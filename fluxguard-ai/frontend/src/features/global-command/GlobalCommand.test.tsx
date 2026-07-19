import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import { resetSimulation } from '@/features/simulation/simulationStore';
import { setupFetchMocks } from '@/tests/testMocks';
import { GlobalOperationsDashboard } from './GlobalOperationsDashboard';

describe('GlobalOperationsDashboard Components', () => {
  beforeEach(() => {
    setupFetchMocks();
    resetSimulation();
    vi.clearAllMocks();
  });

  it('renders network command dashboard headings and alerts', async () => {
    // Mock the stadiums registry query data
    vi.spyOn(global, 'fetch').mockImplementation((url) => {
      if (url.toString().includes('/api/stadiums')) {
        return Promise.resolve({
          json: () =>
            Promise.resolve({
              status: 'success',
              data: [
                {
                  id: 'stadium_001',
                  name: 'MetLife Stadium',
                  city: 'New York',
                  country: 'USA',
                  capacity: 82000,
                  currentAttendance: 72000,
                  riskLevel: 'high',
                  predictionStatus: 'Critical congestion in 18 minutes',
                },
                {
                  id: 'stadium_002',
                  name: 'SoFi Stadium',
                  city: 'Los Angeles',
                  country: 'USA',
                  capacity: 70000,
                  currentAttendance: 65000,
                  riskLevel: 'low',
                  predictionStatus: 'Standard crowd flow',
                },
              ],
            }),
        } as unknown as Response);
      }
      return Promise.resolve({ json: () => Promise.resolve({ data: [] }) } as unknown as Response);
    });

    render(
      <MemoryRouter>
        <GlobalOperationsDashboard />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Global Operations Network/i)).toBeInTheDocument();
    expect(screen.getByText(/FIFA 2026 Enterprise Command Center/i)).toBeInTheDocument();

    // Verifies stadiums display lists
    await waitFor(() => expect(screen.getAllByText(/MetLife Stadium/i).length).toBeGreaterThan(0));
    expect(screen.getAllByText(/SoFi Stadium/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Critical congestion in 18 minutes/i)).toBeInTheDocument();
  });

  it('submits emergency dispatch scenarios and updates the operations logs', async () => {
    vi.spyOn(global, 'fetch').mockImplementation((url) => {
      if (url.toString().includes('/api/stadiums')) {
        return Promise.resolve({
          json: () => Promise.resolve({ status: 'success', data: [] }),
        } as unknown as Response);
      }
      if (url.toString().includes('/api/emergency/dispatch')) {
        return Promise.resolve({
          json: () =>
            Promise.resolve({
              status: 'success',
              data: {
                priority: 'HIGH',
                actions: ['Send ambulance unit 3', 'Redirect pedestrian flow'],
              },
            }),
        } as unknown as Response);
      }
      return Promise.resolve({ json: () => Promise.resolve({ data: [] }) } as unknown as Response);
    });

    render(
      <MemoryRouter>
        <GlobalOperationsDashboard />
      </MemoryRouter>,
    );

    const input = screen.getByPlaceholderText(/E.g. Medical emergency near Gate C/i);
    fireEvent.change(input, { target: { value: 'Medical emergency near Gate C' } });

    const btn = screen.getByRole('button', { name: /Trigger Dispatch/i });
    fireEvent.click(btn);

    await waitFor(() => {
      const match = screen.getAllByText(
        (content, el) => el?.textContent?.includes('Send ambulance unit 3') ?? false,
      );
      expect(match.length).toBeGreaterThan(0);
    });
    const match2 = screen.getAllByText(
      (content, el) => el?.textContent?.includes('Redirect pedestrian flow') ?? false,
    );
    expect(match2.length).toBeGreaterThan(0);
  });

  it('renders city twin and transport heatmaps', () => {
    render(
      <MemoryRouter>
        <GlobalOperationsDashboard />
      </MemoryRouter>,
    );

    expect(screen.getByText(/New York Metro Egress Digital Twin/i)).toBeInTheDocument();
    expect(screen.getByText(/Metro & Road Egress Speedways/i)).toBeInTheDocument();
    expect(screen.getByText(/Fan Zone Capacities/i)).toBeInTheDocument();
    expect(screen.getByText(/Expressway Delays/i)).toBeInTheDocument();

    // Verifies SVG labels are present
    expect(screen.getAllByText(/FAN ZONE A/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/FAN ZONE B/i).length).toBeGreaterThan(0);
  });
});
