import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  AlertCard,
  Badge,
  Button,
  Card,
  MetricCard,
  Panel,
  Skeleton,
  Spinner,
  StatusIndicator,
  Tooltip,
  StatusBadge,
  LoadingSkeleton,
  EmptyState,
  ErrorState,
  AIDecisionCard,
} from '@/components/ui';

describe('UI design system foundations', () => {
  it('renders button variants and handles loading and disabled states accessibly', async () => {
    const user = userEvent.setup();
    let clicks = 0;

    render(
      <div>
        <Button variant="primary" onClick={() => (clicks += 1)}>
          Dispatch
        </Button>
        <Button variant="secondary" isLoading>
          Sync
        </Button>
        <Button variant="danger" disabled>
          Lockdown
        </Button>
      </div>,
    );

    await user.click(screen.getByRole('button', { name: /dispatch/i }));

    expect(clicks).toBe(1);
    expect(screen.getByRole('button', { name: /sync/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Sync' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sync/i })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: /lockdown/i })).toBeDisabled();
  });

  it('renders cards, panels, metrics, and alerts with readable labels', () => {
    render(
      <Panel eyebrow="Mission Control" title="Operations">
        <Card title="Crowd Density" description="Current zone summary">
          <MetricCard title="Current Density" value="72%" trend="+6% in 10 min" />
        </Card>
        <AlertCard
          severity="warning"
          title="Threshold rising"
          description="A recommendation is ready for review."
          timestamp="10:24"
        />
      </Panel>,
    );

    expect(screen.getByRole('heading', { name: /operations/i })).toBeInTheDocument();
    expect(screen.getByText(/current density/i)).toBeInTheDocument();
    expect(screen.getByText('72%')).toBeInTheDocument();
    expect(screen.getByRole('article', { name: /threshold rising/i })).toBeInTheDocument();
  });

  it('renders risk badges and status indicators without relying on color alone', () => {
    render(
      <div>
        <Badge variant="critical">Critical</Badge>
        <StatusIndicator state="amber" accessibilityText="Crowd risk is amber for Gate B" />
      </div>,
    );

    expect(screen.getByText(/critical/i)).toBeInTheDocument();
    expect(screen.getByRole('status', { name: /crowd risk is amber/i })).toBeInTheDocument();
    expect(screen.getByText(/amber/i)).toBeInTheDocument();
  });

  it('renders accessible loading indicators', () => {
    render(
      <div>
        <Skeleton label="Loading command panel" className="h-12" />
        <Spinner label="Loading AI recommendation" />
      </div>,
    );

    expect(screen.getByRole('status', { name: /loading command panel/i })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: /loading ai recommendation/i })).toBeInTheDocument();
  });

  it('shows tooltip content on keyboard focus', async () => {
    const user = userEvent.setup();
    const onFocus = vi.fn();
    const onBlur = vi.fn();

    render(
      <Tooltip content="Predicted congestion risk over the next 20 minutes">
        <button type="button" onFocus={onFocus} onBlur={onBlur}>
          Risk info
        </button>
      </Tooltip>,
    );

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    await user.tab();

    expect(screen.getByRole('button', { name: /risk info/i })).toHaveFocus();
    expect(screen.getByRole('tooltip')).toHaveTextContent(/predicted congestion risk/i);
    expect(onFocus).toHaveBeenCalledTimes(1);

    await user.tab();

    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('renders StatusBadge with specific variants', () => {
    render(<StatusBadge variant="success">Active Status</StatusBadge>);
    expect(screen.getByText('Active Status')).toBeInTheDocument();
  });

  it('renders LoadingSkeleton variations', () => {
    render(<LoadingSkeleton variant="table" count={2} />);
    expect(screen.getByRole('status', { name: /loading table content/i })).toBeInTheDocument();
  });

  it('renders EmptyState messages with action trigger', () => {
    render(
      <EmptyState
        title="Empty Logs"
        description="No events found."
        action={<button>Create Event</button>}
      />,
    );
    expect(screen.getByText('Empty Logs')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create event/i })).toBeInTheDocument();
  });

  it('renders ErrorState with retry trigger capability', () => {
    const handleRetry = vi.fn();
    render(
      <ErrorState
        title="Connection Timed Out"
        description="Failed to sync logs."
        onRetry={handleRetry}
      />,
    );
    expect(screen.getByText('Connection Timed Out')).toBeInTheDocument();
    screen.getByRole('button', { name: /retry connection/i }).click();
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('renders AIDecisionCard with approval constraints', () => {
    render(
      <AIDecisionCard
        decisionId="dec-test"
        agentName="Test Agent"
        recommendation="Reroute West"
        confidence={90}
        reason="Heavy congestion"
        expectedImpact="Reduce backlog"
        humanApprovalRequired={true}
      />,
    );
    expect(screen.getByText('Reroute West')).toBeInTheDocument();
    expect(screen.getByText(/Test Agent/i)).toBeInTheDocument();
  });
});
