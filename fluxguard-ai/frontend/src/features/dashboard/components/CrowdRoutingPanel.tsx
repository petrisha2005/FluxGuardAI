import { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import type { BackendRoutingRecommendation } from '../../../services/api';
import {
  getActiveEventId,
  getSimIdFromUuid,
  setZoneDetour,
  setZoneStatus,
  useSimulationState,
} from '../../simulation/simulationStore';

export function CrowdRoutingPanel() {
  const sim = useSimulationState();
  const [recommendations, setRecommendations] = useState<BackendRoutingRecommendation[]>([]);
  const [appliedRoutes, setAppliedRoutes] = useState<Set<string>>(new Set());
  const activeEventId = getActiveEventId();

  const fetchRecommendations = async () => {
    try {
      const data = await api.fetchRoutingRecommendations(activeEventId);
      setRecommendations(data);
    } catch (err) {
      console.error('Failed to fetch routing recommendations:', err);
    }
  };

  useEffect(() => {
    fetchRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEventId, sim.tick]);

  const handleApplyDetour = (rec: BackendRoutingRecommendation) => {
    const srcSimId = getSimIdFromUuid(rec.sourceZoneId);
    const tgtSimId = getSimIdFromUuid(rec.targetZoneId);

    if (srcSimId && tgtSimId) {
      // Reprogram the simulator via the global state selectors
      setZoneStatus(srcSimId, 'closed');
      setZoneDetour(srcSimId, tgtSimId);

      const key = `${rec.sourceZoneId}-${rec.targetZoneId}`;
      setAppliedRoutes((prev) => {
        const next = new Set(prev);
        next.add(key);
        return next;
      });
    }
  };

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {recommendations.map((rec, idx) => {
        const key = `${rec.sourceZoneId}-${rec.targetZoneId}`;
        const isApplied = appliedRoutes.has(key);

        return (
          <div
            key={`${key}-${idx}`}
            className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 backdrop-blur animate-fade-in flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
          >
            {/* Ambient background glow */}
            <div className="absolute -left-12 -top-12 h-24 w-24 rounded-full bg-amber-500/10 blur-xl pointer-events-none"></div>

            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
                  ⚡ AI Dynamic Routing Suggestion
                </span>
                {isApplied && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                    ✓ Detour Applied
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-ink leading-relaxed">{rec.reason}</p>
            </div>

            <div className="flex flex-wrap items-center gap-4 border-t border-white/5 pt-4 md:border-t-0 md:pt-0">
              <div className="grid grid-cols-3 gap-3 text-center min-w-[200px]">
                <div className="rounded-lg bg-white/5 px-2 py-1.5">
                  <div className="text-[9px] uppercase tracking-wider text-ink-muted">
                    Expected Delay
                  </div>
                  <div className="text-xs font-bold text-emerald-400">
                    -{rec.delayReductionMinutes} min
                  </div>
                </div>
                <div className="rounded-lg bg-white/5 px-2 py-1.5">
                  <div className="text-[9px] uppercase tracking-wider text-ink-muted">
                    Confidence
                  </div>
                  <div className="text-xs font-bold text-ink">
                    {(rec.confidence * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="rounded-lg bg-white/5 px-2 py-1.5">
                  <div className="text-[9px] uppercase tracking-wider text-ink-muted">
                    Relief Time
                  </div>
                  <div className="text-xs font-bold text-ink">{rec.reliefTimeMinutes} min</div>
                </div>
              </div>

              <div className="w-full md:w-auto">
                <button
                  disabled={isApplied}
                  onClick={() => handleApplyDetour(rec)}
                  className={`w-full md:w-auto flex items-center justify-center rounded-lg px-4 py-2 text-xs font-bold text-black transition-all duration-200 shadow-md ${
                    isApplied
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 shadow-none cursor-not-allowed'
                      : 'bg-amber-400 hover:bg-amber-500 hover:scale-[1.02] shadow-amber-500/10 active:scale-[0.98]'
                  }`}
                >
                  {isApplied ? 'Applied' : 'Apply AI Detour Route'}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
