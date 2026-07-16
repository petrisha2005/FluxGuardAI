import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/services/api';
import { setupFetchMocks } from '@/tests/testMocks';
import { FeedbackPanel } from './FeedbackPanel';

describe('FeedbackPanel', () => {
  beforeEach(() => {
    setupFetchMocks();
  });

  it('renders all form elements with accessible labels', () => {
    render(<FeedbackPanel />);

    expect(screen.getByLabelText(/stadium zone/i)).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: /zone rating/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/comment/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit feedback/i })).toBeInTheDocument();
  });

  it('shows validation error when submitting empty comment', async () => {
    render(<FeedbackPanel />);

    const submitButton = screen.getByRole('button', { name: /submit feedback/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/comment is required/i)).toBeInTheDocument();
  });

  it('submits feedback successfully and displays success screen', async () => {
    const submitSpy = vi.spyOn(api, 'submitFeedback');

    render(<FeedbackPanel />);

    const textarea = screen.getByLabelText(/comment/i);
    fireEvent.change(textarea, { target: { value: 'Very crowded concourse' } });

    const submitButton = screen.getByRole('button', { name: /submit feedback/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/thank you for your feedback/i)).toBeInTheDocument();
    expect(submitSpy).toHaveBeenCalledWith(
      'e0000000-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000001',
      5,
      'Very crowded concourse',
    );

    // Click submit another button
    const anotherButton = screen.getByRole('button', { name: /submit another/i });
    fireEvent.click(anotherButton);

    expect(screen.getByLabelText(/comment/i)).toBeInTheDocument();
    expect((screen.getByLabelText(/comment/i) as HTMLTextAreaElement).value).toBe('');
  });
});
