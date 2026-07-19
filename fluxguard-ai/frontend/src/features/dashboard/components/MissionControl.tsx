import { Link } from 'react-router-dom';
import { useSimulationState } from '@/features/simulation/simulationStore';
import { StatusBadge, MetricCard, Panel } from '@/components/ui';

export function MissionControl() {
  const sim = useSimulationState();

  // Calculate dynamic stats
  const activeStadiumsCount = 12; // Static requirement or dynamic
  const elevatedZonesCount = sim.zones.filter((z) => z.risk !== 'LOW').length;
  const crowdRiskText =
    elevatedZonesCount > 1 ? 'HIGH' : elevatedZonesCount === 1 ? 'MEDIUM' : 'LOW';

  // Format active incidents
  const activeIncidentsCount = sim.events.length;

  // Decisions pending
  const pendingDecisionsCount = sim.isEvacuationActive ? 1 : Math.max(0, elevatedZonesCount + 1);

  // Derive highest density zone
  const highestZone =
    sim.zones.length > 0
      ? sim.zones.reduce((prev, curr) => (curr.density > prev.density ? curr : prev), sim.zones[0])
      : null;

  return (
    <div className="space-y-6">
      {/* KPI Overview Cards */}
      <section
        className="grid gap-4 grid-cols-2 lg:grid-cols-6 font-mono text-xs select-none"
        aria-label="Risk overview metrics"
      >
        <MetricCard
          title="Active Stadiums"
          value={String(activeStadiumsCount)}
          trend="Multi-stadium feed"
        />
        <div className="rounded-xl border border-white/5 bg-surface-elevated/20 p-4 flex flex-col justify-between h-24">
          <span className="text-[10px] text-ink-subdued uppercase tracking-wider font-bold">
            Crowd Risk
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold tracking-tight text-ink font-mono">
              {crowdRiskText}
            </span>
            <StatusBadge
              variant={
                crowdRiskText === 'HIGH'
                  ? 'danger'
                  : crowdRiskText === 'MEDIUM'
                    ? 'warning'
                    : 'success'
              }
            >
              Postures
            </StatusBadge>
          </div>
        </div>
        <MetricCard
          title="Peak Density"
          value={`${highestZone ? highestZone.density : 0}%`}
          trend={highestZone ? highestZone.name : 'N/A'}
        />
        <MetricCard
          title="Active Incidents"
          value={String(activeIncidentsCount).padStart(2, '0')}
          trend="Awaiting clearance"
        />
        <MetricCard
          title="AI Decisions Pending"
          value={String(pendingDecisionsCount).padStart(2, '0')}
          trend="Required signature"
        />
        <div className="rounded-xl border border-white/5 bg-surface-elevated/20 p-4 flex flex-col justify-between h-24">
          <span className="text-[10px] text-ink-subdued uppercase tracking-wider font-bold">
            System Health
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold tracking-tight text-ink font-mono">99.8%</span>
            <StatusBadge variant="success">Online</StatusBadge>
          </div>
        </div>
      </section>

      {/* Live Operations Summary */}
      <Panel
        eyebrow="Mission Control Briefing"
        title="Live Operations Summary"
        className="border border-white/5 bg-slate-900/10 font-mono text-xs"
      >
        <div className="grid gap-6 md:grid-cols-12">
          {/* Incidents and risk zones (Left column) */}
          <div className="md:col-span-7 space-y-4">
            <div className="space-y-2">
              <h3 className="text-3xs font-bold uppercase tracking-widest text-ink-subdued">
                Active Incident Log
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto divide-y divide-white/5 pr-1">
                {sim.events.length === 0 ? (
                  <div className="py-6 text-center text-ink-subdued font-sans">
                    No incident triggers currently registered.
                  </div>
                ) : (
                  sim.events.map((evt) => (
                    <div
                      key={evt.id}
                      className="pt-2 pb-2 flex items-start justify-between gap-3 text-4xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-ink truncate block font-sans">
                          {evt.title}
                        </span>
                        <span className="text-ink-muted leading-relaxed font-sans">
                          {evt.description}
                        </span>
                      </div>
                      <span className="text-ink-subdued shrink-0 select-none font-mono">
                        {evt.timestamp}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <h3 className="text-3xs font-bold uppercase tracking-widest text-ink-subdued">
                Highest Risk Zone Posture
              </h3>
              {highestZone ? (
                <div className="p-3 rounded border border-white/5 bg-surface flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-ink">{highestZone.name}</span>
                    <p className="text-[10px] text-ink-muted font-sans">
                      Capacity limit: {highestZone.capacity} fans. Current Density:{' '}
                      {highestZone.density}%.
                    </p>
                  </div>
                  <StatusBadge
                    variant={
                      highestZone.risk === 'CRITICAL'
                        ? 'danger'
                        : highestZone.risk === 'HIGH'
                          ? 'danger'
                          : highestZone.risk === 'MEDIUM'
                            ? 'warning'
                            : 'success'
                    }
                  >
                    {highestZone.risk}
                  </StatusBadge>
                </div>
              ) : (
                <div className="py-4 text-center text-ink-subdued">No active zones mapped.</div>
              )}
            </div>
          </div>

          {/* AI recommendations and actions (Right column) */}
          <div className="md:col-span-5 space-y-4 md:border-l md:border-white/5 md:pl-6">
            <div className="space-y-2">
              <h3 className="text-3xs font-bold uppercase tracking-widest text-ink-subdued">
                AI Operations Directives
              </h3>
              <div className="p-3 bg-brand-primary/5 border border-brand-primary/20 rounded space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-brand-primary font-bold text-3xs font-mono">
                    RECOMMENDED OPTION
                  </span>
                  <span className="text-[9px] font-mono font-bold text-emerald-400">
                    92% CONFIDENCE
                  </span>
                </div>
                <p className="text-[11px] text-ink leading-relaxed font-sans font-medium">
                  {highestZone && highestZone.density > 70
                    ? `Open Gate C overflow exit corridors to drain excess load at ${highestZone.name}.`
                    : 'Maintain current turnstile configurations and perform normal safety monitoring.'}
                </p>
                <div className="text-[9px] text-ink-subdued font-sans">
                  Expected Impact: Queue time ↓ 25%, Density clearance in 9m.
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <h3 className="text-3xs font-bold uppercase tracking-widest text-ink-subdued">
                Recent Actions Log
              </h3>
              <div className="space-y-1 text-[10px] text-ink-muted">
                <div className="flex justify-between items-center py-0.5 border-b border-white/2">
                  <span>✓ Redeployed 5 stewards to Gate C</span>
                  <span>14:21</span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-white/2">
                  <span>✓ Signage postured to Emergency Egress</span>
                  <span>14:18</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span>✓ Broadcast status: Synchronized</span>
                  <span>14:15</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {/* Quick Navigation Panel */}
      <section className="rounded-xl border border-white/5 bg-surface-elevated/20 p-5 font-mono text-xs select-none">
        <h3 className="text-3xs font-bold uppercase tracking-widest text-ink-subdued mb-3">
          Quick Navigation Portal
        </h3>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          <Link
            to="/city-hub"
            className="flex items-center justify-center p-3 rounded border border-white/5 bg-slate-900/60 hover:bg-brand-primary hover:text-slate-950 hover:border-brand-primary transition-all text-center font-bold"
          >
            🗺️ Open Digital Twin
          </Link>
          <Link
            to="/predictive-twin"
            className="flex items-center justify-center p-3 rounded border border-white/5 bg-slate-900/60 hover:bg-brand-primary hover:text-slate-950 hover:border-brand-primary transition-all text-center font-bold"
          >
            📈 View Predictions
          </Link>
          <Link
            to="/autonomous-control"
            className="flex items-center justify-center p-3 rounded border border-white/5 bg-slate-900/60 hover:bg-brand-primary hover:text-slate-950 hover:border-brand-primary transition-all text-center font-bold"
          >
            🤖 Check Autonomous AI
          </Link>
          <Link
            to="/operations"
            className="flex items-center justify-center p-3 rounded border border-white/5 bg-slate-900/60 hover:bg-brand-primary hover:text-slate-950 hover:border-brand-primary transition-all text-center font-bold"
          >
            🚨 Review Incidents
          </Link>
        </div>
      </section>
    </div>
  );
}
