import { describe, expect, it } from 'vitest';

import { calculateRiskLevel, assessZoneRisk } from './riskEngine';
import type { CrowdZone } from './simulationTypes';

function createZone(overrides: Partial<CrowdZone>): CrowdZone {
  return {
    id: 'test-zone',
    name: 'Test Zone',
    density: 20,
    queueLength: 20,
    entryRate: 20,
    exitRate: 20,
    risk: 'LOW',
    lastUpdated: '2026-06-11T18:00:00.000Z',
    ...overrides,
  };
}

describe('riskEngine', () => {
  it.each([
    [{ density: 40, queueLength: 100 }, 'LOW'],
    [{ density: 51, queueLength: 100 }, 'MEDIUM'],
    [{ density: 76, queueLength: 100 }, 'HIGH'],
    [{ density: 40, queueLength: 201 }, 'HIGH'],
    [{ density: 91, queueLength: 100 }, 'CRITICAL'],
    [{ density: 40, queueLength: 351 }, 'CRITICAL'],
  ] as const)('returns %s for threshold input %#', (input, expectedRisk) => {
    expect(calculateRiskLevel(input)).toBe(expectedRisk);
  });

  it('generates a reason and recommendation for each assessment', () => {
    const assessment = assessZoneRisk(createZone({ density: 82, entryRate: 48, exitRate: 20 }));

    expect(assessment.risk).toBe('HIGH');
    expect(assessment.reason).toMatch(/reduced exit flow/i);
    expect(assessment.recommendation).toMatch(/Redirect incoming visitors/i);
  });
});
