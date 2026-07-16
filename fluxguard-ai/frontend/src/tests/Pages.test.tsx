import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import { resetSimulation } from '@/features/simulation/simulationStore';
import { setupFetchMocks } from '@/tests/testMocks';
import { AnalyticsPage } from '@/features/analytics/AnalyticsPage';
import { CopilotPage } from '@/features/copilot/CopilotPage';
import { OperationsPage } from '@/features/operations/OperationsPage';
import { SignagePage } from '@/features/signage/SignagePage';
import { VolunteerPage } from '@/features/volunteer/VolunteerPage';
import { LandingPage } from '@/features/landing/LandingPage';
import { CityHubPage } from '@/features/city/CityHubPage';

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
    expect(screen.getByText(/Model Explanation & Drivers/i)).toBeInTheDocument();
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

describe('VolunteerPage', () => {
  beforeEach(() => {
    setupFetchMocks();
    resetSimulation();
    localStorage.clear();
  });

  it('renders volunteer command dashboard and task list', () => {
    render(<VolunteerPage />);

    expect(screen.getByText(/Volunteer Command Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/My Active Assignments/i)).toBeInTheDocument();
    expect(screen.getByText(/Report Crowd Incident/i)).toBeInTheDocument();
  });
});

describe('LandingPage', () => {
  beforeEach(() => {
    setupFetchMocks();
    resetSimulation();
  });

  it('renders 3D landing page copy and primary CTAs', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /FluxGuard AI/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Launch Command Center/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Steward Volunteer Console/i })).toBeInTheDocument();
    expect(screen.getByText(/Predictive Modeling/i)).toBeInTheDocument();
    expect(screen.getByText(/Steward Allocation/i)).toBeInTheDocument();
  });
});

describe('CityHubPage', () => {
  beforeEach(() => {
    setupFetchMocks();
    resetSimulation();
  });

  it('renders city command center widgets and maps', async () => {
    render(
      <MemoryRouter>
        <CityHubPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: /City Command Center/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Active Venues/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Geographic Operations Map/i)).toBeInTheDocument();
  });
});
