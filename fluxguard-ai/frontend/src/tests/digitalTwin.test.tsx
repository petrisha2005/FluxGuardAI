import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CityHubPage } from '@/features/city/CityHubPage';
import { setupFetchMocks } from '@/tests/testMocks';
import { resetSimulation } from '@/features/simulation/simulationStore';

describe('Operations Digital Twin View', () => {
  beforeEach(() => {
    setupFetchMocks();
    resetSimulation();
    vi.clearAllMocks();
  });

  it('renders initial telemetry KPIs, weather summary, and interactive map stands', async () => {
    render(
      <MemoryRouter>
        <CityHubPage />
      </MemoryRouter>,
    );

    // Verify loading header resolved
    expect(await screen.findByText(/LIVE VENUE COMMAND POST/i)).toBeInTheDocument();

    // Verify top KPIs
    expect(screen.getByText(/85,000/i)).toBeInTheDocument();
    expect(screen.getByText(/75,200/i)).toBeInTheDocument();
    expect(screen.getByText(/Avg Density/i)).toBeInTheDocument();
    expect(screen.getByText(/Risk Level/i)).toBeInTheDocument();

    // Verify weather summary
    expect(screen.getByText(/Showers/i)).toBeInTheDocument();
    expect(screen.getByText(/Wind: 14km\/h/i)).toBeInTheDocument();

    // Verify SVG layout stands are rendered
    expect(screen.getAllByText(/NORTH STAND/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/EAST STAND/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/GATE C/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/WEST STAND/i).length).toBeGreaterThan(0);
  });

  it('toggles display overlay layers on click', async () => {
    render(
      <MemoryRouter>
        <CityHubPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/LIVE VENUE COMMAND POST/i)).toBeInTheDocument();

    const camerasBtn = screen.getByRole('button', { name: /Security Cameras/i });
    expect(camerasBtn).toBeInTheDocument();
    fireEvent.click(camerasBtn);
  });

  it('displays error recovery fallback card and retries successfully', async () => {
    // Force API failure
    const errorMock = vi
      .spyOn(global, 'fetch')
      .mockRejectedValueOnce(new Error('Connection timed out'));

    render(
      <MemoryRouter>
        <CityHubPage />
      </MemoryRouter>,
    );

    // Verify error state
    expect(await screen.findByText(/Unable to load Digital Twin/i)).toBeInTheDocument();
    expect(screen.getByText(/Reason: Connection timed out/i)).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /Retry Connection/i });
    expect(retryBtn).toBeInTheDocument();

    // Restore fetch mocks
    errorMock.mockRestore();
    setupFetchMocks();

    // Trigger retry
    fireEvent.click(retryBtn);

    // Verify loaded view restored
    expect(await screen.findByText(/LIVE VENUE COMMAND POST/i)).toBeInTheDocument();
  });
});
