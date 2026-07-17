import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/services/api';
import { setupFetchMocks } from '@/tests/testMocks';
import { resetSimulation } from '@/features/simulation/simulationStore';
import { CopilotPanel } from './CopilotPanel';

describe('CopilotPanel', () => {
  beforeEach(() => {
    setupFetchMocks();
    resetSimulation();
  });

  it('renders initial welcome message and suggestion chips', () => {
    render(<CopilotPanel />);

    expect(screen.getByText(/FluxGuard AI Command Assistant/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Explain Gate C risks/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Summarize last 15 minutes/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /message input/i })).toBeInTheDocument();
  });

  it('submits typed message and displays AI response', async () => {
    const copilotSpy = vi.spyOn(api, 'submitCopilotMessage').mockResolvedValue({
      response: 'Local simulation shows Gate C queue length is stable.',
      suggested_actions: ['Acknowledge alert'],
    });

    render(<CopilotPanel />);

    const input = screen.getByRole('textbox', { name: /message input/i });
    fireEvent.change(input, { target: { value: 'Why is Gate C high risk?' } });

    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);

    expect(copilotSpy).toHaveBeenCalledWith(
      'e0000000-0000-0000-0000-000000000000',
      'Why is Gate C high risk?',
    );
    expect(
      await screen.findByText(/Local simulation shows Gate C queue length is stable./i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /execute: Acknowledge alert/i })).toBeInTheDocument();
  });

  it('renders intelligence deck tabs and explains directives', () => {
    render(<CopilotPanel />);

    // Renders the operations tabs
    expect(screen.getByRole('button', { name: /DIRECTIVES/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /TIMELINE/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /BRIEFING/i })).toBeInTheDocument();

    // Renders the directive recommendation details
    expect(screen.getByText(/AI Directive Recommendation/i)).toBeInTheDocument();
    expect(screen.getByText(/Explain Recommendation/i)).toBeInTheDocument();
    expect(screen.getByText(/92% CONFIDENCE/i)).toBeInTheDocument();

    // Renders the alternative recommendations comparison
    expect(screen.getByText(/Alternative Actions comparison/i)).toBeInTheDocument();
    expect(screen.getByText(/Option A: Steward redeployment/i)).toBeInTheDocument();
    expect(screen.getByText(/Option B: Divert new arrivals/i)).toBeInTheDocument();
  });

  it('navigates to timeline tab and handles prediction horizon points', () => {
    render(<CopilotPanel />);

    const timelineTab = screen.getByRole('button', { name: /TIMELINE/i });
    fireEvent.click(timelineTab);

    // Displays prediction horizon selector
    expect(screen.getByText(/Select Prediction Horizon Point/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Current T-0/i })).toBeInTheDocument();

    const forecast20Min = screen.getByRole('button', { name: /20 min Forecast/i });
    fireEvent.click(forecast20Min);

    // Verifies telemetry driver details changed
    expect(screen.getByText(/T\+20 Minute Forecast Analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/Transit arrivals schedules/i)).toBeInTheDocument();
  });

  it('navigates to briefing tab and generates executive briefings', () => {
    render(<CopilotPanel />);

    const briefingTab = screen.getByRole('button', { name: /BRIEFING/i });
    fireEvent.click(briefingTab);

    expect(screen.getByText(/Executive Operations Summary/i)).toBeInTheDocument();

    // Briefing text should generate automatically and display details
    expect(screen.getByText(/EXECUTIVE BRIEFING/i)).toBeInTheDocument();
    expect(screen.getByText(/Elevated Risk Zones/i)).toBeInTheDocument();

    const regenBtn = screen.getByRole('button', { name: /Regenerate/i });
    fireEvent.click(regenBtn);

    expect(screen.getByText(/EXECUTIVE BRIEFING/i)).toBeInTheDocument();
  });
});
