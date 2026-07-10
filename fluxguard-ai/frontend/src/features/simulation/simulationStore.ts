/* eslint-disable @typescript-eslint/no-explicit-any */
import { useSyncExternalStore } from 'react';

import { api } from '../../services/api';
import {
  createInitialCrowdZones,
  getSimulationTimestamp,
  simulateNextCrowdZones,
} from './crowdSimulator';
import { assessCrowdRisks } from './riskEngine';
import type {
  CrowdZone,
  RiskAssessment,
  RiskLevel,
  SimulationEvent,
  SimulationState,
} from './simulationTypes';

type Listener = () => void;

const EVENT_ID = 'e0000000-0000-0000-0000-000000000000';
const MAX_EVENTS = 12;
const RISK_ORDER: Record<RiskLevel, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3,
};

const ZONE_MAP: Record<string, string> = {
  'north-gate': '00000000-0000-0000-0000-000000000001',
  'east-concourse': '00000000-0000-0000-0000-000000000002',
  'gate-c': '00000000-0000-0000-0000-000000000003',
  'west-entrance': '00000000-0000-0000-0000-000000000004',
};

const REV_ZONE_MAP: Record<string, string> = {
  '00000000-0000-0000-0000-000000000001': 'north-gate',
  '00000000-0000-0000-0000-000000000002': 'east-concourse',
  '00000000-0000-0000-0000-000000000003': 'gate-c',
  '00000000-0000-0000-0000-000000000004': 'west-entrance',
};

function formatTimestamp(timestamp: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(new Date(timestamp));
}

function createInitialState(): SimulationState {
  const zones = createInitialCrowdZones();
  const timestamp = getSimulationTimestamp(0);

  return {
    zones,
    riskAssessments: assessCrowdRisks(zones, timestamp),
    events: [
      {
        id: 'event-0-gate-c-high',
        zoneId: 'gate-c',
        severity: 'HIGH',
        title: 'Gate C forecast pressure detected',
        description: 'Recommended action: Redirect crowd flow toward West Entrance.',
        timestamp: formatTimestamp(timestamp),
      },
    ],
    tick: 0,
    lastUpdated: timestamp,
  };
}

let currentState: SimulationState = createInitialState();
const listeners = new Set<Listener>();

function findAssessment(assessments: RiskAssessment[], zoneId: string): RiskAssessment | undefined {
  return assessments.find((assessment) => assessment.zoneId === zoneId);
}

function createEvents(
  previousZones: CrowdZone[],
  nextZones: CrowdZone[],
  previousAssessments: RiskAssessment[],
  nextAssessments: RiskAssessment[],
  tick: number,
  timestamp: string,
): SimulationEvent[] {
  const formattedTimestamp = formatTimestamp(timestamp);
  const events: SimulationEvent[] = [];

  nextZones.forEach((zone) => {
    const previousZone = previousZones.find((candidate) => candidate.id === zone.id);
    const previousAssessment = findAssessment(previousAssessments, zone.id);
    const nextAssessment = findAssessment(nextAssessments, zone.id);

    if (!previousZone || !previousAssessment || !nextAssessment) {
      return;
    }

    if (previousZone.density < 85 && zone.density >= 85) {
      events.push({
        id: `event-${tick}-${zone.id}-density`,
        zoneId: zone.id,
        severity: zone.risk,
        title: `${zone.name} density crossed 85%`,
        description: `Current simulated density is ${zone.density}%.`,
        timestamp: formattedTimestamp,
      });
    }

    if (RISK_ORDER[nextAssessment.risk] > RISK_ORDER[previousAssessment.risk]) {
      events.push({
        id: `event-${tick}-${zone.id}-risk`,
        zoneId: zone.id,
        severity: nextAssessment.risk,
        title: `Risk escalated from ${previousAssessment.risk} to ${nextAssessment.risk}`,
        description: nextAssessment.reason,
        timestamp: formattedTimestamp,
      });
    }

    if (nextAssessment.risk === 'HIGH' || nextAssessment.risk === 'CRITICAL') {
      events.push({
        id: `event-${tick}-${zone.id}-recommendation`,
        zoneId: zone.id,
        severity: nextAssessment.risk,
        title: 'Recommended action: Redirect crowd flow',
        description: nextAssessment.recommendation,
        timestamp: formattedTimestamp,
      });
    }
  });

  return events;
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function getState(): SimulationState {
  return currentState;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function updateSimulation(): SimulationState {
  const nextTick = currentState.tick + 1;
  const timestamp = getSimulationTimestamp(nextTick);
  const nextLocalZones = simulateNextCrowdZones(currentState.zones, nextTick);

  // 1. Calculate and apply next state synchronously (preserves Vitest sync expectations)
  const nextAssessments = assessCrowdRisks(nextLocalZones, timestamp);
  const nextEvents = createEvents(
    currentState.zones,
    nextLocalZones,
    currentState.riskAssessments,
    nextAssessments,
    nextTick,
    timestamp,
  );

  currentState = {
    zones: nextLocalZones,
    riskAssessments: nextAssessments,
    events: [...nextEvents, ...currentState.events].slice(0, MAX_EVENTS),
    tick: nextTick,
    lastUpdated: timestamp,
  };

  emitChange();

  // 2. Perform REST API updates and state synchronization asynchronously in the background
  Promise.resolve().then(async () => {
    try {
      await Promise.all(
        nextLocalZones.map((zone) => {
          const zoneUuid = ZONE_MAP[zone.id];
          if (!zoneUuid) return Promise.resolve();
          return api.postMeasurement(EVENT_ID, {
            zoneId: zoneUuid,
            measuredAt: timestamp,
            densityCount: zone.density,
            flowRatePerMinute: zone.entryRate,
            queueLength: zone.queueLength,
            sourceType: 'simulator',
            confidence: 0.95,
          });
        }),
      );

      await api.runPredictionsCycle(EVENT_ID);

      const [backendScores, backendAlerts] = await Promise.all([
        api.fetchRiskScores(EVENT_ID),
        api.fetchAlerts(EVENT_ID),
      ]);

      let worstAlertGuidance: any = null;
      const activeBackendAlerts = backendAlerts.filter((a) => a.status === 'unacknowledged');
      if (activeBackendAlerts.length > 0) {
        const sortedAlerts = [...activeBackendAlerts].sort((a, b) => {
          const aSev = a.severity === 'critical' ? 2 : a.severity === 'high' ? 1 : 0;
          const bSev = b.severity === 'critical' ? 2 : b.severity === 'high' ? 1 : 0;
          return bSev - aSev;
        });
        const targetAlert = sortedAlerts[0];
        if (targetAlert.severity === 'critical' || targetAlert.severity === 'high') {
          try {
            worstAlertGuidance = await api.generateGuidance(EVENT_ID, targetAlert.id, 'operator');
          } catch (e) {
            console.warn('AI Guidance generation failed:', e);
          }
        }
      }

      const zones = nextLocalZones.map((zone) => {
        const zoneUuid = ZONE_MAP[zone.id];
        const score = backendScores.find((s) => s.zoneId === zoneUuid);
        const risk = (score?.severity.toUpperCase() || 'LOW') as RiskLevel;
        return {
          ...zone,
          risk,
          lastUpdated: score?.generatedAt || timestamp,
        };
      });

      const riskAssessments = backendScores.map((score) => {
        const zoneId = REV_ZONE_MAP[score.zoneId] || 'north-gate';
        const risk = score.severity.toUpperCase() as RiskLevel;

        let reason = score.drivers.join(', ');
        let recommendation = 'Maintain normal monitoring.';

        if (
          worstAlertGuidance &&
          worstAlertGuidance.severity.toUpperCase() === risk &&
          worstAlertGuidance.payload.affectedZones?.some(
            (zUuid: string) => REV_ZONE_MAP[zUuid] === zoneId,
          )
        ) {
          reason = worstAlertGuidance.payload.incidentSummary;
          recommendation = worstAlertGuidance.payload.recommendedActions[0];
        } else {
          if (risk === 'CRITICAL') {
            recommendation = 'Hold incoming flow and redirect visitors away.';
          } else if (risk === 'HIGH') {
            recommendation = 'Redirect incoming visitors to lower-density zones.';
          } else if (risk === 'MEDIUM') {
            recommendation = 'Monitor closely and prepare volunteer support.';
          }
        }

        return {
          zoneId,
          risk,
          reason,
          recommendation,
          timestamp: score.generatedAt,
        };
      });

      const events = backendAlerts.map((alert) => {
        const zoneId = REV_ZONE_MAP[alert.zoneId] || 'north-gate';
        const severity = alert.severity.toUpperCase() as RiskLevel;
        return {
          id: alert.id,
          zoneId,
          severity,
          title: alert.title,
          description: alert.description,
          timestamp: formatTimestamp(alert.timestamp),
        };
      });

      currentState = {
        zones,
        riskAssessments,
        events: [...events, ...currentState.events].slice(0, MAX_EVENTS),
        tick: nextTick,
        lastUpdated: timestamp,
      };

      emitChange();
    } catch (e) {
      console.warn('Backend sync failed, maintaining local fallback state:', e);
    }
  });

  return currentState;
}

export function startSimulation(intervalMs = 3_000): () => void {
  const intervalId = window.setInterval(updateSimulation, intervalMs);

  return () => window.clearInterval(intervalId);
}

export function resetSimulation(): SimulationState {
  currentState = createInitialState();
  emitChange();
  return currentState;
}

export function useSimulationState(): SimulationState {
  return useSyncExternalStore(subscribe, getState, getState);
}
