import { MetricCard, Panel } from '@/components/ui';
import type { DashboardSummary } from '../types/dashboard';

export interface RiskOverviewProps {
  summary: DashboardSummary;
}

export function RiskOverview({ summary }: RiskOverviewProps) {
  return (
    <Panel
      eyebrow="Risk overview"
      title="Stadium operating posture"
      aria-label="Risk overview metrics"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Active Zones"
          value={String(summary.activeZones)}
          trend="Live simulation"
        />
        <MetricCard
          title="Peak Density"
          value={`${summary.highestDensity}%`}
          trend={summary.highestDensityZone}
        />
        <MetricCard
          title="Elevated Risk"
          value={String(summary.elevatedRiskZones)}
          trend="Amber or red zones"
        />
        <MetricCard
          title="Expected Delay"
          value={`${summary.expectedDelayMinutes} min`}
          trend="Forecast window"
        />
      </div>
    </Panel>
  );
}
