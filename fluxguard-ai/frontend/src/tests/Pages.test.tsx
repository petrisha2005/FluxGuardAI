import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { resetSimulation } from '@/features/simulation/simulationStore';
import { setupFetchMocks } from '@/tests/testMocks';
import { AnalyticsPage } from '@/features/analytics/AnalyticsPage';
import { CopilotPage } from '@/features/copilot/CopilotPage';
import { OperationsPage } from '@/features/operations/OperationsPage';
import { SignagePage } from '@/features/signage/SignagePage';

describe('AnalyticsPage', () => {
  beforeEach(() => {
    setupFetchMocks();
    resetSimulation();
  });

  it('renders prediction charts and indicator panels', async () => {
    render(<AnalyticsPage />);

    expect(screen.getByRole('heading', { name: /operations command center/i })).toBeInTheDocument();
    expect(
      await screen.findByRole('region', { name: /^prediction timeline$/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/weather metrics/i)).toBeInTheDocument();
    expect(screen.getByText(/transit pressure/i)).toBeInTheDocument();
    expect(screen.getByText(/ticket inflow/i)).toBeInTheDocument();
  });
});

describe('CopilotPage', () => {
  beforeEach(() => {
    setupFetchMocks();
    resetSimulation();
  });

  it('renders dedicated fullscreen copilot panel', () => {
    render(<CopilotPage />);

    expect(screen.getByText(/FluxGuard AI Command Assistant/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Explain Gate C risks/i })).toBeInTheDocument();
  });
});

describe('OperationsPage', () => {
  beforeEach(() => {
    setupFetchMocks();
    resetSimulation();
  });

  it('renders operations log and directive actions', () => {
    render(<OperationsPage />);

    expect(screen.getByLabelText(/guidance panel/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/live event feed/i)).toBeInTheDocument();
    expect(
      screen.getByRole('article', { name: /Gate C forecast pressure detected/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit feedback/i })).toBeInTheDocument();
  });
});

describe('SignagePage', () => {
  beforeEach(() => {
    setupFetchMocks();
    resetSimulation();
  });

  it('renders all physical display boards with default greeting', () => {
    render(<SignagePage />);

    expect(screen.getByText(/Live Stadium Signage Console/i)).toBeInTheDocument();
    expect(screen.getByText(/North Gate - Entrance Screen/i)).toBeInTheDocument();
    expect(screen.getByText(/East Concourse - Evacuation Screen/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Welcome to Lucusa Stadium/i).length).toBe(4);
  });
});
