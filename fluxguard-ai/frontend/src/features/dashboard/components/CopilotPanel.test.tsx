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
    expect(screen.getByRole('button', { name: /Summarize last 10 minutes/i })).toBeInTheDocument();
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

  it('sends suggestion query when chip is clicked', async () => {
    const copilotSpy = vi.spyOn(api, 'submitCopilotMessage');

    render(<CopilotPanel />);

    const chip = screen.getByRole('button', { name: /Explain Gate C risks/i });
    fireEvent.click(chip);

    expect(copilotSpy).toHaveBeenCalledWith(
      'e0000000-0000-0000-0000-000000000000',
      'Why is Gate C high risk?',
    );
  });
});
