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
});
