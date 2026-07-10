import { describe, expect, it } from 'vitest';

import { getState, resetSimulation, subscribe, updateSimulation } from './simulationStore';

describe('simulationStore', () => {
  it('updates simulation state and notifies subscribers', () => {
    resetSimulation();
    let notificationCount = 0;
    const unsubscribe = subscribe(() => {
      notificationCount += 1;
    });

    const previousState = getState();
    const nextState = updateSimulation();

    unsubscribe();

    expect(notificationCount).toBe(1);
    expect(nextState.tick).toBe(previousState.tick + 1);
    expect(nextState.zones).not.toEqual(previousState.zones);
    expect(nextState.riskAssessments).toHaveLength(nextState.zones.length);
  });

  it('generates operational events during updates', () => {
    resetSimulation();

    const nextState = updateSimulation();

    expect(nextState.events.length).toBeGreaterThan(0);
    expect(nextState.events.some((event) => event.title.includes('Recommended action'))).toBe(true);
  });
});
