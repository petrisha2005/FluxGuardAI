import { render, screen, within } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { resetSimulation, updateSimulation } from '@/features/simulation/simulationStore';
import { setupFetchMocks } from '@/tests/testMocks';
import { DashboardPage } from '../DashboardPage';

describe('DashboardPage', () => {
  beforeEach(() => {
    setupFetchMocks();
    resetSimulation();
  });

  it('renders the operations command center with simulated data labels', async () => {
    render(<DashboardPage />);

    expect(screen.getByRole('heading', { name: /operations command center/i })).toBeInTheDocument();
    expect(screen.getByText(/enriched operations/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/risk overview metrics/i)).toBeInTheDocument();
  });

  it('displays all configured stadium zones and density values', () => {
    render(<DashboardPage />);

    const zonePanel = screen.getByLabelText(/crowd zone status panel/i);

    expect(within(zonePanel).getByText('North Gate')).toBeInTheDocument();
    expect(within(zonePanel).getByText('East Concourse')).toBeInTheDocument();
    expect(within(zonePanel).getByText('Gate C')).toBeInTheDocument();
    expect(within(zonePanel).getByText('West Entrance')).toBeInTheDocument();
    expect(screen.getByLabelText(/Gate C density 86%/i)).toBeInTheDocument();
    expect(within(zonePanel).getAllByText(/Entry\/min/i).length).toBeGreaterThan(0);
  });

  it('exposes risk states with accessible labels', () => {
    render(<DashboardPage />);

    expect(
      screen.getByRole('status', { name: /North Gate risk state is amber/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status', { name: /Gate C risk state is amber/i })).toBeInTheDocument();
    expect(
      screen.getByRole('status', { name: /West Entrance risk state is green/i }),
    ).toBeInTheDocument();
  });

  it('updates dashboard values when the simulation advances', () => {
    render(<DashboardPage />);

    expect(screen.getByLabelText(/Peak Density: 86%/i)).toBeInTheDocument();

    act(() => {
      updateSimulation();
    });

    expect(screen.queryByLabelText(/Peak Density: 86%/i)).not.toBeInTheDocument();
  });

  it('toggles to CCTV feeds view when tab is clicked', async () => {
    render(<DashboardPage />);

    const cctvTab = screen.getByRole('button', { name: /CCTV Video Feeds/i });
    expect(cctvTab).toBeInTheDocument();

    act(() => {
      cctvTab.click();
    });

    expect(await screen.findByText(/Computer Vision CCTV Feeds/i)).toBeInTheDocument();
    expect(screen.getByText(/Mute CCTV Congestion Alerts/i)).toBeInTheDocument();
  });

  it('renders routing panel recommendations and handles apply actions', async () => {
    render(<DashboardPage />);

    expect(await screen.findByText(/AI Dynamic Routing Suggestion/i)).toBeInTheDocument();
    expect(screen.getByText(/High queue backlog detected at Gate C/i)).toBeInTheDocument();

    const applyButton = screen.getByRole('button', { name: /Apply AI Detour Route/i });
    expect(applyButton).toBeInTheDocument();

    act(() => {
      applyButton.click();
    });

    expect(screen.getByText(/Detour Applied/i)).toBeInTheDocument();
  });

  it('handles emergency evacuation trigger and cancel states', () => {
    render(<DashboardPage />);

    expect(screen.getByText(/Emergency Management Console/i)).toBeInTheDocument();
    const triggerBtn = screen.getByRole('button', { name: /Trigger Evacuation/i });
    expect(triggerBtn).toBeInTheDocument();

    // Show confirm dialog
    act(() => {
      triggerBtn.click();
    });

    const confirmBtn = screen.getByRole('button', { name: /Confirm Evac/i });
    expect(confirmBtn).toBeInTheDocument();

    // Activate evacuation
    act(() => {
      confirmBtn.click();
    });

    expect(screen.getByText(/EMERGENCY EVACUATION ACTIVE/i)).toBeInTheDocument();
    expect(screen.getByText(/Clearance Status/i)).toBeInTheDocument();

    // Abort evacuation
    const abortBtn = screen.getByRole('button', { name: /Abort Evacuation/i });
    expect(abortBtn).toBeInTheDocument();

    act(() => {
      abortBtn.click();
    });

    expect(screen.getByText(/Emergency Management Console/i)).toBeInTheDocument();
  });
});
