import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { App } from '@/App';
import { setupFetchMocks } from './testMocks';

describe('App', () => {
  beforeEach(() => {
    setupFetchMocks();
  });

  it('renders the application shell', async () => {
    render(
      <MemoryRouter
        initialEntries={['/dashboard']}
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      >
        <App />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('navigation', { name: /primary navigation/i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: /operations command center/i }),
    ).toBeInTheDocument();
  });

  it('provides an accessible skip link and live loading status', async () => {
    render(
      <MemoryRouter
        initialEntries={['/dashboard']}
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      >
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/skip to main content/i)).toHaveAttribute(
      'href',
      '#main-content',
    );
    expect(
      await screen.findByRole('status', { name: /dashboard is using live simulated/i }),
    ).toBeInTheDocument();
  });
});
