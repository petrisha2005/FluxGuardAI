import { render, screen, fireEvent, act } from '@testing-library/react';
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

import { api } from '@/services/api';
import type { BackendStaffingStatus } from '@/services/api';

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

  it('renders predictive staffing alerts in the StaffingPanel', async () => {
    const mockStaffingStatus: BackendStaffingStatus = {
      currentStaff: {
        '00000000-0000-0000-0000-000000000001': 20,
        '00000000-0000-0000-0000-000000000003': 25,
      },
      recommendedStaff: {
        '00000000-0000-0000-0000-000000000001': 15,
        '00000000-0000-0000-0000-000000000003': 30,
      },
      suggestions: [
        {
          fromZoneId: '00000000-0000-0000-0000-000000000001',
          toZoneId: '00000000-0000-0000-0000-000000000003',
          count: 5,
          reason: 'Redeploy 5 stewards from North Gate to cover congestion risks.',
        },
      ],
      alerts: [
        'Upcoming Crowd Surge: Zone Gate C is projected to reach 85% density within 20 minutes. Deficit of 5 stewards detected; immediate redeployment recommended.',
      ],
    };

    const getStaffingSpy = vi.spyOn(api, 'getStaffingStatus').mockResolvedValue(mockStaffingStatus);

    render(<OperationsPage />);

    // Wait for the predictive staffing alert warning to render
    expect(await screen.findByTestId('predictive-staffing-alert')).toBeInTheDocument();
    expect(
      screen.getByText(/Zone Gate C is projected to reach 85% density within 20 minutes/i),
    ).toBeInTheDocument();

    getStaffingSpy.mockRestore();
  });
});

describe('SignagePage', () => {
  beforeEach(() => {
    setupFetchMocks();
    resetSimulation();
  });

  it('renders all physical display boards with default greeting and supports translations', async () => {
    render(<SignagePage />);

    expect(screen.getByText(/Live Stadium Signage Console/i)).toBeInTheDocument();
    expect(screen.getByText(/North Gate - Screen/i)).toBeInTheDocument();
    expect(screen.getByText(/East Concourse - Screen/i)).toBeInTheDocument();

    // Toggle language to French
    const select = screen.getByRole('combobox', { name: /Language Selector/i });
    act(() => {
      fireEvent.change(select, { target: { value: 'fr' } });
    });

    expect(screen.getByText(/Console de signalisation du stade en direct/i)).toBeInTheDocument();

    // Trigger simulation test alert
    const triggerBtn = screen.getByRole('button', { name: /Déclencher l'alerte test/i });
    act(() => {
      triggerBtn.click();
    });

    expect(screen.getByText(/Rediriger le trafic des zones encombrées/i)).toBeInTheDocument();
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
    expect(
      screen.getByText(/Monitor turnstile entry speeds and queue lines at North Gate/i),
    ).toBeInTheDocument();
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

  it('renders operations digital twin widgets and layouts', async () => {
    render(
      <MemoryRouter>
        <CityHubPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: /Operations Digital Twin/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Avg Density/i)).toBeInTheDocument();
    expect(screen.getByText(/LIVE VENUE COMMAND POST/i)).toBeInTheDocument();
    expect(screen.getByText(/Real-Time Operations Feed Logs/i)).toBeInTheDocument();
  });
});
