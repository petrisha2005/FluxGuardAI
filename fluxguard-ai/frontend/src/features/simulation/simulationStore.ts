import { useSyncExternalStore } from 'react';

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

const MAX_EVENTS = 12;
const RISK_ORDER: Record<RiskLevel, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3,
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
  const nextZones = simulateNextCrowdZones(currentState.zones, nextTick);
  const nextAssessments = assessCrowdRisks(nextZones, timestamp);
  const nextEvents = createEvents(
    currentState.zones,
    nextZones,
    currentState.riskAssessments,
    nextAssessments,
    nextTick,
    timestamp,
  );

  currentState = {
    zones: nextZones,
    riskAssessments: nextAssessments,
    events: [...nextEvents, ...currentState.events].slice(0, MAX_EVENTS),
    tick: nextTick,
    lastUpdated: timestamp,
  };

  emitChange();
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
