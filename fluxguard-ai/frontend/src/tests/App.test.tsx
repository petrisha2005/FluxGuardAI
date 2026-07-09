import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { App } from '@/App';

describe('App', () => {
  it('renders the application shell', () => {
    render(
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('navigation', { name: /primary navigation/i })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /predictive crowd orchestration/i }),
    ).toBeInTheDocument();
  });

  it('provides an accessible skip link and live loading status', () => {
    render(
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByText(/skip to main content/i)).toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('status', { name: /foundation ready/i })).toBeInTheDocument();
  });
});
