import { useState } from 'react';
import {
  triggerEvacuation,
  cancelEvacuation,
  useSimulationState,
} from '../../simulation/simulationStore';
import { RoleGuard } from '@/features/auth';

export function EvacuationControlPanel() {
  const sim = useSimulationState();
  const [showConfirm, setShowConfirm] = useState(false);

  const isEvac = !!sim.isEvacuationActive;
  const initialCrowd = sim.initialEvacuationCrowd || 1000;

  // Calculate current crowd size
  const currentCrowd = sim.zones.reduce((sum, z) => {
    if (z.type === 'concourse') {
      return sum + Math.round((z.density * (z.capacity || 5000)) / 100);
    } else {
      return sum + (z.queueLength || 0);
    }
  }, 0);

  // Compute clearance percentage
  const clearancePct = isEvac
    ? Math.max(0, Math.min(100, Math.round((1 - currentCrowd / initialCrowd) * 100)))
    : 0;

  // Estimated minutes remaining (simple decay model)
  const estMinutesRemaining = isEvac ? Math.max(0, Math.ceil(currentCrowd / 180)) : 0;

  const handleActivate = () => {
    triggerEvacuation();
    setShowConfirm(false);
  };

  const handleAbort = () => {
    cancelEvacuation();
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-surface-elevated/40 p-5 backdrop-blur transition-all duration-300">
      {!isEvac ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-ink flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              Emergency Management Console
            </h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Active stadium safety posture is steady. Dispatch venue-wide evacuation directives if
              an incident occurs.
            </p>
          </div>

          <div>
            <RoleGuard
              allowedRoles={['STADIUM_MANAGER', 'SECURITY_SUPERVISOR', 'SUPER_ADMIN']}
              fallback={
                <button
                  disabled
                  className="w-full sm:w-auto rounded-lg bg-zinc-800 border border-zinc-700/50 px-4 py-2 text-xs font-bold text-zinc-500 cursor-not-allowed opacity-50"
                  title="Clearance required: STADIUM_MANAGER or SECURITY_SUPERVISOR"
                >
                  🚨 Trigger Evacuation
                </button>
              }
            >
              {!showConfirm ? (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="w-full sm:w-auto rounded-lg bg-rose-500/10 border border-rose-500/20 px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  🚨 Trigger Evacuation
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleActivate}
                    className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 active:scale-[0.98] transition-all animate-pulse"
                  >
                    Confirm Evac
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-bold text-ink hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </RoleGuard>
          </div>
        </div>
      ) : (
        <div className="space-y-5 animate-pulse-slow">
          {/* Header Warning Banner */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-rose-500/20 pb-4">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-rose-400 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping"></span>
                🚨 EMERGENCY EVACUATION ACTIVE
              </h3>
              <p className="text-xs text-rose-500/80 leading-relaxed font-semibold">
                Turnstiles set to outflow mode. Dispatched exit route guidelines to all digital
                screens.
              </p>
            </div>

            <RoleGuard
              allowedRoles={['STADIUM_MANAGER', 'SECURITY_SUPERVISOR', 'SUPER_ADMIN']}
              fallback={
                <button
                  disabled
                  className="w-full sm:w-auto rounded-lg bg-zinc-800 border border-zinc-700/50 px-4 py-2 text-xs font-bold text-zinc-500 cursor-not-allowed opacity-50"
                  title="Clearance required to abort evacuation."
                >
                  Abort Evacuation
                </button>
              }
            >
              <button
                onClick={handleAbort}
                className="w-full sm:w-auto rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-xs font-bold text-ink hover:bg-white/10 hover:border-white/20 transition-all"
              >
                Abort Evacuation
              </button>
            </RoleGuard>
          </div>

          {/* Telemetry HUD Grid */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-xl bg-rose-950/10 border border-rose-500/10 p-3 text-center">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-rose-400/80">
                Clearance Status
              </div>
              <div className="text-lg font-black text-rose-400 mt-1">{clearancePct}%</div>
            </div>
            <div className="rounded-xl bg-rose-950/10 border border-rose-500/10 p-3 text-center">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-rose-400/80">
                Est. Time to Clear
              </div>
              <div className="text-lg font-black text-rose-400 mt-1">{estMinutesRemaining} min</div>
            </div>
            <div className="rounded-xl bg-rose-950/10 border border-rose-500/10 p-3 text-center">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-rose-400/80">
                Remaining Headcount
              </div>
              <div className="text-lg font-black text-rose-400 mt-1">{currentCrowd} pax</div>
            </div>
            <div className="rounded-xl bg-rose-950/10 border border-rose-500/10 p-3 text-center">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-rose-400/80">
                Initial Load
              </div>
              <div className="text-lg font-black text-ink mt-1">{initialCrowd} pax</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-rose-400/60 uppercase">
              <span>Evacuation Progress</span>
              <span>{clearancePct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-rose-950/20 overflow-hidden border border-rose-500/10">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-1000"
                style={{ width: `${clearancePct}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
