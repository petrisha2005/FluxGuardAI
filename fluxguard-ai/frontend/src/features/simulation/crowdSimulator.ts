import { assessZoneRisk } from './riskEngine';
import type { CrowdZone } from './simulationTypes';

const BASE_TIMESTAMP_MS = Date.UTC(2026, 5, 11, 18, 0, 0);
const UPDATE_INTERVAL_MS = 3_000;

const initialZoneInputs = [
  {
    id: 'north-gate',
    name: 'North Gate',
    density: 72,
    queueLength: 184,
    entryRate: 46,
    exitRate: 34,
  },
  {
    id: 'east-concourse',
    name: 'East Concourse',
    density: 54,
    queueLength: 96,
    entryRate: 31,
    exitRate: 38,
  },
  {
    id: 'gate-c',
    name: 'Gate C',
    density: 86,
    queueLength: 248,
    entryRate: 58,
    exitRate: 29,
  },
  {
    id: 'west-entrance',
    name: 'West Entrance',
    density: 41,
    queueLength: 64,
    entryRate: 24,
    exitRate: 33,
  },
] as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value);
}

export function getSimulationTimestamp(tick: number): string {
  return new Date(BASE_TIMESTAMP_MS + tick * UPDATE_INTERVAL_MS).toISOString();
}

function zoneWave(zoneId: string, tick: number, offset = 0): number {
  const idSeed = [...zoneId].reduce((total, char) => total + char.charCodeAt(0), 0);
  return Math.sin((tick + offset + idSeed / 13) * 0.72);
}

export function createInitialCrowdZones(): CrowdZone[] {
  const timestamp = getSimulationTimestamp(0);

  return initialZoneInputs.map((zone) => {
    const risk = assessZoneRisk({ ...zone, risk: 'LOW', lastUpdated: timestamp }).risk;

    return {
      ...zone,
      risk,
      lastUpdated: timestamp,
    };
  });
}

export function simulateNextCrowdZones(previousZones: CrowdZone[], tick: number): CrowdZone[] {
  const timestamp = getSimulationTimestamp(tick);

  return previousZones.map((zone) => {
    const entryShift = zoneWave(zone.id, tick, 0) * 7;
    const exitShift = zoneWave(zone.id, tick, 2) * 5;
    const pressure = zone.entryRate - zone.exitRate;
    const densityDelta = pressure * 0.08 + zoneWave(zone.id, tick, 4) * 2.4;
    const queueDelta = pressure * 0.55 + zoneWave(zone.id, tick, 6) * 8;

    const entryRate = round(clamp(zone.entryRate + entryShift, 12, 72));
    const exitRate = round(clamp(zone.exitRate + exitShift, 10, 68));
    const density = round(clamp(zone.density + densityDelta, 0, 100));
    const queueLength = round(clamp(zone.queueLength + queueDelta, 0, 520));
    const nextZone = {
      ...zone,
      density,
      queueLength,
      entryRate,
      exitRate,
      lastUpdated: timestamp,
    };

    return {
      ...nextZone,
      risk: assessZoneRisk(nextZone, timestamp).risk,
    };
  });
}
