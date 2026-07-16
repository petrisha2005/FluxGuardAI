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

let activeEventId = 'e0000000-0000-0000-0000-000000000000';
const MAX_EVENTS = 12;
const RISK_ORDER: Record<RiskLevel, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3,
};

let ZONE_MAP: Record<string, string> = {
  'north-gate': '00000000-0000-0000-0000-000000000001',
  'east-concourse': '00000000-0000-0000-0000-000000000002',
  'gate-c': '00000000-0000-0000-0000-000000000003',
  'west-entrance': '00000000-0000-0000-0000-000000000004',
};

let REV_ZONE_MAP: Record<string, string> = {
  '00000000-0000-0000-0000-000000000001': 'north-gate',
  '00000000-0000-0000-0000-000000000002': 'east-concourse',
  '00000000-0000-0000-0000-000000000003': 'gate-c',
  '00000000-0000-0000-0000-000000000004': 'west-entrance',
};

export function getActiveEventId(): string {
  return activeEventId;
}

export function setActiveEventId(eventId: string) {
  if (activeEventId !== eventId) {
    initializeSimulationForEvent(eventId);
  }
}


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
let activeSocket: WebSocket | null = null;
let reconnectTimeout: any = null;

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

export function connectWebSocket() {
  if (activeSocket) return;

  const wsUrl = api.getWebSocketUrl(activeEventId);
  const socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log('Connected to real-time operations channel:', wsUrl);
  };

  socket.onmessage = (event) => {
    try {
      const frame = JSON.parse(event.data);
      const { type, data } = frame;

      if (type === 'zone_status_updated') {
        const zoneId = REV_ZONE_MAP[data.zoneId];
        if (zoneId) {
          currentState = {
            ...currentState,
            zones: currentState.zones.map((z) => {
              if (z.id === zoneId) {
                return {
                  ...z,
                  density: data.densityCount,
                  queueLength: data.queueLength,
                  entryRate: data.flowRatePerMinute,
                  lastUpdated: data.measuredAt,
                };
              }
              return z;
            }),
          };
          emitChange();
        }
      } else if (type === 'risk_score_updated') {
        const riskScores = data as any[];
        const zones = currentState.zones.map((zone) => {
          const zoneUuid = ZONE_MAP[zone.id];
          const score = riskScores.find((s) => s.zoneId === zoneUuid);
          const risk = (score?.severity.toUpperCase() || 'LOW') as RiskLevel;
          return {
            ...zone,
            risk,
            lastUpdated: score?.generatedAt || zone.lastUpdated,
          };
        });

        const riskAssessments = riskScores.map((score) => {
          const zoneId = REV_ZONE_MAP[score.zoneId] || 'north-gate';
          const risk = score.severity.toUpperCase() as RiskLevel;
          let recommendation = 'Maintain normal monitoring.';
          if (risk === 'CRITICAL') {
            recommendation = 'Hold incoming flow and redirect visitors away.';
          } else if (risk === 'HIGH') {
            recommendation = 'Redirect incoming visitors to lower-density zones.';
          } else if (risk === 'MEDIUM') {
            recommendation = 'Monitor closely and prepare volunteer support.';
          }

          return {
            zoneId,
            risk,
            reason: score.drivers.join(', '),
            recommendation,
            timestamp: score.generatedAt,
          };
        });

        currentState = {
          ...currentState,
          zones,
          riskAssessments,
        };
        emitChange();
      } else if (type === 'alert_created') {
        const alertId = data.id;
        const zoneId = REV_ZONE_MAP[data.zoneId] || 'north-gate';
        const severity = data.severity.toUpperCase() as RiskLevel;

        if (!currentState.events.some((e) => e.id === alertId)) {
          const newEvent = {
            id: alertId,
            zoneId,
            severity,
            title: data.title,
            description: data.description,
            timestamp: formatTimestamp(data.timestamp),
          };
          currentState = {
            ...currentState,
            events: [newEvent, ...currentState.events].slice(0, MAX_EVENTS),
          };
          emitChange();
        }
      } else if (type === 'alert_updated') {
        const alertId = data.id;
        const status = data.status;
        currentState = {
          ...currentState,
          events: currentState.events.map((e) => {
            if (e.id === alertId) {
              return {
                ...e,
                description: `Status: ${status}. ${data.description}`,
              };
            }
            return e;
          }),
        };
        emitChange();
      } else if (type === 'guidance_created') {
        const guidance = data;
        const zoneId = REV_ZONE_MAP[guidance.payload.affectedZones?.[0]] || 'north-gate';

        currentState = {
          ...currentState,
          riskAssessments: currentState.riskAssessments.map((ra) => {
            if (ra.zoneId === zoneId && ra.risk === guidance.severity.toUpperCase()) {
              return {
                ...ra,
                reason: guidance.payload.incidentSummary,
                recommendation: guidance.payload.recommendedActions[0],
              };
            }
            return ra;
          }),
        };
        emitChange();
      }
    } catch (err) {
      console.error('Failed to parse WebSocket frame data:', err);
    }
  };

  socket.onclose = () => {
    console.log('Real-time operations channel closed. Reconnecting in 5s...');
    activeSocket = null;
    reconnectTimeout = setTimeout(connectWebSocket, 5000);
  };

  socket.onerror = (err) => {
    console.warn('Real-time operations channel encountered error:', err);
    socket.close();
  };

  activeSocket = socket;
}

export function disconnectWebSocket() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  if (activeSocket) {
    activeSocket.onclose = null;
    activeSocket.close();
    activeSocket = null;
  }
}

export function updateSimulation(): SimulationState {
  const nextTick = currentState.tick + 1;
  const timestamp = getSimulationTimestamp(nextTick);
  const nextLocalZones = simulateNextCrowdZones(currentState.zones, nextTick);

  // Synchronous tick update (client-side prediction local baseline)
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

  // Trigger background REST API operations
  Promise.resolve().then(async () => {
    try {
      // Ingest sensor metrics
      await Promise.all(
        nextLocalZones.map((zone) => {
          const zoneUuid = ZONE_MAP[zone.id];
          if (!zoneUuid) return Promise.resolve();
          return api.postMeasurement(activeEventId, {
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

      // Trigger predict calculations cycle on backend
      await api.runPredictionsCycle(activeEventId);

      // If WebSocket is not connected or active, fall back to REST pulls to keep synced
      if (!activeSocket || activeSocket.readyState !== WebSocket.OPEN) {
        const [backendScores, backendAlerts] = await Promise.all([
          api.fetchRiskScores(activeEventId),
          api.fetchAlerts(activeEventId),
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
              worstAlertGuidance = await api.generateGuidance(activeEventId, targetAlert.id, 'operator');
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
      }
    } catch (e) {
      console.warn('Backend sync failed, maintaining local fallback state:', e);
    }
  });

  return currentState;
}

export function startSimulation(intervalMs = 3_000): () => void {
  // Connect WebSocket
  connectWebSocket();

  const intervalId = window.setInterval(updateSimulation, intervalMs);

  return () => {
    window.clearInterval(intervalId);
    disconnectWebSocket();
  };
}

export function resetSimulation(): SimulationState {
  disconnectWebSocket();
  currentState = createInitialState();
  emitChange();
  return currentState;
}

export async function initializeSimulationForEvent(eventId: string) {
  activeEventId = eventId;
  disconnectWebSocket();

  try {
    const backendZones = await api.fetchZones(eventId);

    const newZoneMap: Record<string, string> = {};
    const newRevZoneMap: Record<string, string> = {};
    const simulatorIds = ['north-gate', 'east-concourse', 'gate-c', 'west-entrance'];

    const simulatorZones: CrowdZone[] = backendZones.map((bz, index) => {
      const simId = simulatorIds[index] || bz.name.toLowerCase().replace(/\s+/g, '-');
      newZoneMap[simId] = bz.id;
      newRevZoneMap[bz.id] = simId;

      const isGate = bz.type === 'gate';
      return {
        id: simId,
        name: bz.name,
        type: isGate ? 'gate' : 'concourse',
        capacity: bz.capacity,
        density: isGate ? 40 : 50,
        entryRate: isGate ? 30 : 20,
        exitRate: isGate ? 25 : 22,
        queueLength: isGate ? 50 : 0,
        risk: 'LOW',
        lastUpdated: new Date().toISOString(),
      };
    });

    ZONE_MAP = newZoneMap;
    REV_ZONE_MAP = newRevZoneMap;

    const timestamp = getSimulationTimestamp(0);
    currentState = {
      zones: simulatorZones,
      riskAssessments: assessCrowdRisks(simulatorZones, timestamp),
      events: [],
      tick: 0,
      lastUpdated: timestamp,
    };

    emitChange();
    connectWebSocket();
  } catch (error) {
    console.error('Failed to initialize simulation for event:', error);
  }
}


export function useSimulationState(): SimulationState {
  return useSyncExternalStore(subscribe, getState, getState);
}

export function setZoneStatus(zoneId: string, status: 'open' | 'closed') {
  const zoneIndex = currentState.zones.findIndex(z => z.id === zoneId);
  if (zoneIndex !== -1) {
    currentState.zones[zoneIndex] = {
      ...currentState.zones[zoneIndex],
      status,
    };
    emitChange();
  }
}

export function setZoneDetour(zoneId: string, detourTargetId: string | undefined) {
  const zoneIndex = currentState.zones.findIndex(z => z.id === zoneId);
  if (zoneIndex !== -1) {
    currentState.zones[zoneIndex] = {
      ...currentState.zones[zoneIndex],
      detourTargetId,
    };
    emitChange();
  }
}
