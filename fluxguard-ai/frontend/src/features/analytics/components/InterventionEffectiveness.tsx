import { useEffect, useState } from 'react';
import { Panel } from '@/components/ui';
import { api, type BackendIntervention } from '@/services/api';

const ZONE_LABELS: Record<string, string> = {
  '00000000-0000-0000-0000-000000000001': 'North Gate',
  '00000000-0000-0000-0000-000000000002': 'East Concourse',
  '00000000-0000-0000-0000-000000000003': 'Gate C',
  '00000000-0000-0000-0000-000000000004': 'West Entrance',
};

const RISK_LEVELS: Record<string, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3,
};

const RISK_BADGES: Record<string, string> = {
  LOW: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  MEDIUM: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  HIGH: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  CRITICAL: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
};

interface InterventionEffectivenessProps {
  eventId: string;
}

export function InterventionEffectiveness({ eventId }: InterventionEffectivenessProps) {
  const [interventions, setInterventions] = useState<BackendIntervention[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInterventions = async () => {
      try {
        const data = await api.fetchInterventions(eventId);
        setInterventions(data);
      } catch (err) {
        console.error('Failed to load intervention effectiveness analytics', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInterventions();
    const interval = setInterval(fetchInterventions, 6000);
    return () => clearInterval(interval);
  }, [eventId]);

  const resolved = interventions.filter((i) => i.postDensity !== null && i.postRisk !== null);

  const successful = resolved.filter((i) => {
    if (i.postDensity === null || i.postRisk === null) return false;
    const densityReduced = i.postDensity < i.preDensity;
    const riskReduced = RISK_LEVELS[i.postRisk] < RISK_LEVELS[i.preRisk];
    return densityReduced || riskReduced;
  });

  const successRate =
    resolved.length > 0 ? Math.round((successful.length / resolved.length) * 100) : 0;

  const averageDensityDelta =
    resolved.length > 0
      ? Math.round(
          resolved.reduce((sum, curr) => sum + ((curr.postDensity ?? 0) - curr.preDensity), 0) /
            resolved.length,
        )
      : 0;

  return (
    <Panel eyebrow="Operations Analytics" title="Intervention Effectiveness Tracker">
      <div className="space-y-6">
        <p className="text-xs text-ink-muted leading-relaxed">
          Analyzes the post-action impact of operator guidance directives, steward redeployments,
          and incident resolutions. Telemetry metrics are resolved 2 simulation ticks after each
          action.
        </p>

        {/* Impact KPIs */}
        <div className="grid grid-cols-3 gap-4 border border-white/5 rounded-xl bg-slate-950/40 p-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-ink-muted">
              Total Actions
            </span>
            <div className="text-2xl font-bold text-ink">{interventions.length}</div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-ink-muted">
              Success Rate
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-cyan-400">{successRate}%</span>
              {resolved.length > 0 && (
                <span className="text-[10px] text-emerald-400 font-medium">
                  ({successful.length}/{resolved.length})
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-ink-muted">
              Avg Density Delta
            </span>
            <div className="text-2xl font-bold text-ink">
              {averageDensityDelta > 0 ? `+${averageDensityDelta}%` : `${averageDensityDelta}%`}
            </div>
          </div>
        </div>

        {/* Effectiveness Timeline Queue */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            Logged Interventions ({interventions.length})
          </h4>

          {isLoading && interventions.length === 0 ? (
            <div className="text-center py-6 text-xs text-ink-muted">
              Loading telemetry tracking...
            </div>
          ) : interventions.length === 0 ? (
            <div className="text-center py-8 text-xs text-ink-muted border border-dashed border-white/10 rounded-lg">
              No active interventions logged for this simulation run.
            </div>
          ) : (
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {[...interventions].reverse().map((i) => {
                const isResolved = i.postDensity !== null && i.postRisk !== null;
                const densityDiff = isResolved ? (i.postDensity ?? 0) - i.preDensity : 0;
                const riskDiff = isResolved
                  ? RISK_LEVELS[i.postRisk ?? 'LOW'] - RISK_LEVELS[i.preRisk]
                  : 0;

                const hasImproved = densityDiff < 0 || riskDiff < 0;

                return (
                  <div
                    key={i.id}
                    className="group relative flex flex-col gap-3 rounded-lg border border-white/10 p-3.5 transition-all hover:bg-white/[0.02]"
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                            i.type === 'STAFF'
                              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              : i.type === 'GUIDANCE'
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          }`}
                        >
                          {i.type}
                        </span>
                        <span className="text-xs font-semibold text-ink">
                          {ZONE_LABELS[i.zoneId] || 'Stadium'}
                        </span>
                      </div>
                      <span className="text-[10px] text-ink-muted">Tick #{i.triggerTick}</span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-ink-muted line-clamp-2 leading-relaxed">
                      {i.description}
                    </p>

                    {/* Telemetry Before vs After grid */}
                    <div className="grid grid-cols-[1fr_24px_1fr] items-center gap-2 border-t border-white/5 pt-2.5 mt-1">
                      {/* Before State */}
                      <div className="space-y-1.5">
                        <div className="text-[9px] uppercase tracking-wider font-semibold text-ink-muted">
                          Pre-Intervention
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${RISK_BADGES[i.preRisk]}`}
                          >
                            {i.preRisk}
                          </span>
                          <span className="text-xs font-medium text-ink">
                            Density: {i.preDensity}%
                          </span>
                        </div>
                      </div>

                      {/* Arrow Spacer */}
                      <div className="flex justify-center text-ink-muted font-bold">
                        {isResolved ? (
                          <span className={hasImproved ? 'text-emerald-400' : 'text-ink-muted'}>
                            →
                          </span>
                        ) : (
                          <span className="animate-pulse">…</span>
                        )}
                      </div>

                      {/* After State */}
                      <div className="space-y-1.5 pl-2">
                        <div className="text-[9px] uppercase tracking-wider font-semibold text-ink-muted">
                          Post-Intervention
                        </div>
                        {isResolved ? (
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${RISK_BADGES[i.postRisk ?? 'LOW']}`}
                            >
                              {i.postRisk}
                            </span>
                            <span
                              className={`text-xs font-semibold ${hasImproved ? 'text-emerald-400' : 'text-ink'}`}
                            >
                              Density: {i.postDensity}%{' '}
                              {densityDiff !== 0 &&
                                `(${densityDiff > 0 ? `+${densityDiff}` : densityDiff}%)`}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 font-medium animate-pulse">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                            Awaiting post-tick telemetry...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}
