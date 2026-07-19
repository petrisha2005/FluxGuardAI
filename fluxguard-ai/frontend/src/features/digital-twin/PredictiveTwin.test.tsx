import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import { resetSimulation } from '@/features/simulation/simulationStore';
import { setupFetchMocks } from '@/tests/testMocks';
import { PredictiveTwinPage } from './PredictiveTwinPage';

describe('PredictiveTwinPage Components', () => {
  beforeEach(() => {
    setupFetchMocks();
    resetSimulation();
    vi.clearAllMocks();
  });

  it('renders primary KPI prediction cards', () => {
    render(
      <MemoryRouter>
        <PredictiveTwinPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Peak Predictive Density/i)).toBeInTheDocument();
    expect(screen.getByText(/Optimal Staff Required/i)).toBeInTheDocument();
    expect(screen.getByText(/Average Incident Probability/i)).toBeInTheDocument();
    expect(screen.getByText(/Egress Safety Status/i)).toBeInTheDocument();
  });

  it('renders interactive SVG digital twin mapping and quadrant selections', async () => {
    render(
      <MemoryRouter>
        <PredictiveTwinPage />
      </MemoryRouter>,
    );

    // Verifies SVG quadrant labels are rendered on the twin layout
    expect(screen.getAllByText(/NORTH GATE/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/EAST CONCOURSE/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/GATE C/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/WEST ENTRANCE/i).length).toBeGreaterThan(0);

    // Verification of diagnostic detail default overlay prompt
    expect(
      screen.getByText(
        /Click on any quadrant segment inside the stadium twin SVG graphic to view live diagnostic feeds/i,
      ),
    ).toBeInTheDocument();
  });

  it('renders multi-horizon risk forecast timelines and handles horizon shifts', async () => {
    render(
      <MemoryRouter>
        <PredictiveTwinPage />
      </MemoryRouter>,
    );

    // Expecting prediction timeline to load default T+20 Mins horizon
    expect(screen.getByRole('button', { name: /\+20 Mins/i })).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText(/North Gate/i).length).toBeGreaterThan(1));
    expect(screen.getByText(/55%/i)).toBeInTheDocument();
    expect(screen.getByText(/120 pax/i)).toBeInTheDocument();

    // Click on +60 Mins horizon
    const horizon60Btn = screen.getByRole('button', { name: /\+60 Mins/i });
    fireEvent.click(horizon60Btn);

    // Expecting Gate C predictions in 60 mins to load
    await waitFor(() => expect(screen.getAllByText(/Gate C/i).length).toBeGreaterThan(1));
    expect(screen.getByText(/90%/i)).toBeInTheDocument();
    expect(screen.getByText(/Bottleneck congestion/i)).toBeInTheDocument();
  });

  it('submits simulation options and displays what-if impact outcomes', async () => {
    render(
      <MemoryRouter>
        <PredictiveTwinPage />
      </MemoryRouter>,
    );

    // Fill in simulation selections
    const runBtn = screen.getByRole('button', { name: /Run Scenario Simulation/i });
    fireEvent.click(runBtn);

    await waitFor(() =>
      expect(
        screen.getByText(/Risk escalates to CRITICAL; queue increases \+35%/i),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText(/18 minutes/i)).toBeInTheDocument();
    expect(screen.getByText(/✓ Open temporary checkpoint at North Gate/i)).toBeInTheDocument();
  });

  it('renders historical insight panel with matched resolutions', async () => {
    render(
      <MemoryRouter>
        <PredictiveTwinPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Similar Event Resolutions/i)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText(/Opened auxiliary Gate B secondary turnstiles/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/Football Cup Qualifier/i)).toBeInTheDocument();
    expect(screen.getByText(/Reduced queue delays at Gate B by 28%/i)).toBeInTheDocument();
  });
});
