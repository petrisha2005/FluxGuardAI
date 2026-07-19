import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { setupFetchMocks } from '@/tests/testMocks';
import { AutonomousCommandCenter } from './AutonomousCommandCenter';

describe('AutonomousCommandCenter', () => {
  beforeEach(() => {
    setupFetchMocks();
  });

  it('renders the autonomous command center title and status headers', async () => {
    await act(async () => {
      render(<AutonomousCommandCenter />);
    });

    expect(screen.getByText(/Autonomous Command Center/i)).toBeInTheDocument();
    expect(screen.getByText(/Pending AI Operational Directives/i)).toBeInTheDocument();
    expect(screen.getByText(/Computer Vision Camera Density Assessor/i)).toBeInTheDocument();
    expect(screen.getByText(/Autonomous Agent Grid/i)).toBeInTheDocument();
  });

  it('displays active pending decisions recommendations', async () => {
    await act(async () => {
      render(<AutonomousCommandCenter />);
    });

    // Check agent badge and action heading
    const agents = await screen.findAllByText(/Crowd Control Agent/i);
    expect(agents.length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/OPEN_GATE/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/Gate B/i)).length).toBeGreaterThan(0);
    expect(screen.getByText(/Gate C density exceeds safety threshold/i)).toBeInTheDocument();
    expect(screen.getByText(/Queue duration reduced by 28%/i)).toBeInTheDocument();
  });

  it('allows user to modify target details and trigger action approval', async () => {
    await act(async () => {
      render(<AutonomousCommandCenter />);
    });

    // Click "Modify"
    const modifyBtn = screen.getByRole('button', { name: /Modify/i });
    fireEvent.click(modifyBtn);

    // Verify modify fields exist
    const targetInput = await screen.findByLabelText(/Target Location \/ Asset/i);
    fireEvent.change(targetInput, { target: { value: 'Gate D Override' } });

    // Approve the action
    const approveBtn = screen.getByRole('button', { name: /Approve & Execute/i });
    await act(async () => {
      fireEvent.click(approveBtn);
    });

    // Verify success banner is shown
    expect(await screen.findByText(/executed successfully/i)).toBeInTheDocument();
  });

  it('allows user to run simulated CCTV crowd scanning assessment', async () => {
    await act(async () => {
      render(<AutonomousCommandCenter />);
    });

    // Set count
    const countInput = screen.getByLabelText(/Estimated People/i);
    fireEvent.change(countInput, { target: { value: '1500' } });

    // Click Analyze
    const analyzeBtn = screen.getByRole('button', { name: /Analyze CCTV/i });
    await act(async () => {
      fireEvent.click(analyzeBtn);
    });

    // Verify assessment report renders
    expect(await screen.findByText(/Analysis Report/i)).toBeInTheDocument();
    expect(screen.getByText(/Deploy roaming stewards/i)).toBeInTheDocument();
  });

  it('toggles global autonomous state active/inactive', async () => {
    await act(async () => {
      render(<AutonomousCommandCenter />);
    });

    // Find the toggle button
    const toggleBtn = screen.getByRole('button', { name: /Toggle autonomous operations mode/i });
    await act(async () => {
      fireEvent.click(toggleBtn);
    });

    // Verify state change message
    expect(await screen.findByText(/Autonomous operations Mode switched to/i)).toBeInTheDocument();
  });
});
