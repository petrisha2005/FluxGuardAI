import { describe, expect, it } from 'vitest';

import { createInitialCrowdZones, simulateNextCrowdZones } from './crowdSimulator';

describe('crowdSimulator', () => {
  it('starts with the expected stadium zones', () => {
    const zones = createInitialCrowdZones();

    expect(zones.map((zone) => zone.name)).toEqual([
      'North Gate',
      'East Concourse',
      'Gate C',
      'West Entrance',
    ]);
  });

  it('generates deterministic valid crowd values', () => {
    const initialZones = createInitialCrowdZones();
    const nextZones = simulateNextCrowdZones(initialZones, 1);
    const repeatedNextZones = simulateNextCrowdZones(initialZones, 1);

    expect(nextZones).toEqual(repeatedNextZones);
    nextZones.forEach((zone) => {
      expect(zone.density).toBeGreaterThanOrEqual(0);
      expect(zone.density).toBeLessThanOrEqual(100);
      expect(zone.queueLength).toBeGreaterThanOrEqual(0);
      expect(zone.entryRate).toBeGreaterThanOrEqual(0);
      expect(zone.exitRate).toBeGreaterThanOrEqual(0);
    });
  });

  it('correctly models detours when a gate is closed', () => {
    const initialZones = createInitialCrowdZones();
    
    // Close 'gate-c' and detour to 'west-entrance'
    const modifiedZones = initialZones.map((z) => {
      if (z.id === 'gate-c') {
        return { ...z, status: 'closed' as const, detourTargetId: 'west-entrance' };
      }
      return z;
    });

    const nextZones = simulateNextCrowdZones(modifiedZones, 1);
    
    const nextGateC = nextZones.find((z) => z.id === 'gate-c')!;
    const initialWest = initialZones.find((z) => z.id === 'west-entrance')!;
    const nextWest = nextZones.find((z) => z.id === 'west-entrance')!;

    // Gate C entry rate should be 0 because it is closed
    expect(nextGateC.entryRate).toBe(0);
    // West Entrance queue should increase due to redirected detour flow
    expect(nextWest.queueLength).toBeGreaterThan(initialWest.queueLength);
  });
});
