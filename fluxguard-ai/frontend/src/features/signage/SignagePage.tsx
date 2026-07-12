import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { useSimulationState } from '@/features/simulation/simulationStore';

interface SignageGuidance {
  guidanceId: string;
  alertId: string;
  audienceRole: string;
  severity: string;
  headline: string;
  actions: string[];
  expiresAt: string;
  payload?: {
    shortMessage?: string;
  };
  status: string;
}

export function SignagePage() {
  const state = useSimulationState();
  const [approvedDirectives, setApprovedDirectives] = useState<SignageGuidance[]>([]);

  useEffect(() => {
    const loadDirectives = async () => {
      try {
        const response = await api.getActiveGuidance('e0000000-0000-0000-0000-000000000000');
        setApprovedDirectives(response.data);
      } catch (err) {
        console.error('Failed to load active approved guidance', err);
      }
    };
    loadDirectives();

    const wsUrl = api.getWebSocketUrl('e0000000-0000-0000-0000-000000000000');
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const frame = JSON.parse(event.data);
        const { type, data } = frame;

        if (type === 'guidance_approved') {
          setApprovedDirectives((prev) => {
            const filtered = prev.filter((d) => d.guidanceId !== data.guidanceId);
            return [...filtered, data];
          });
        } else if (type === 'guidance_rejected') {
          setApprovedDirectives((prev) => prev.filter((d) => d.guidanceId !== data.guidanceId));
        }
      } catch (err) {
        console.error('Signage socket parsing failed', err);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  // Map approved guidance to zone IDs
  const guidanceByZone: Record<string, SignageGuidance> = {};
  approvedDirectives.forEach((g) => {
    const matchEvent = state.events.find((e) => e.id.toLowerCase() === g.alertId.toLowerCase());
    if (matchEvent) {
      guidanceByZone[matchEvent.zoneId] = g;
    }
  });

  const zonesList = [
    { id: 'north-gate', label: 'North Gate - Entrance Screen' },
    { id: 'east-concourse', label: 'East Concourse - Evacuation Screen' },
    { id: 'gate-c', label: 'Gate C - Main Stadium Screen' },
    { id: 'west-entrance', label: 'West Entrance - Info Display' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Live Stadium Signage Console</h1>
        <p className="mt-2 text-sm text-ink-muted leading-relaxed">
          Simulated active LED display boards located throughout Lucusa Stadium. Real-time approved
          safety instructions are pushed instantly to these displays.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {zonesList.map((z) => {
          const activeGuidance = guidanceByZone[z.id];
          const hasGuidance = !!activeGuidance;
          const severity = activeGuidance?.severity || 'low';

          return (
            <div
              key={z.id}
              className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-950 p-6 shadow-2xl transition-all duration-300"
            >
              {/* Glowing Neon Status Border */}
              <div
                className={`absolute inset-x-0 top-0 h-1 transition-all duration-300 ${
                  severity === 'critical'
                    ? 'bg-red-500 shadow-[0_2px_10px_#ef4444]'
                    : severity === 'high'
                      ? 'bg-amber-500 shadow-[0_2px_10px_#f59e0b]'
                      : 'bg-emerald-500 shadow-[0_2px_10px_#10b981]'
                }`}
              />

              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <span className="text-xs font-black uppercase tracking-wider text-ink-muted">
                  {z.label}
                </span>
                <span
                  className={`inline-flex items-center rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                    severity === 'critical'
                      ? 'bg-red-950 text-red-400 border border-red-800/40 animate-pulse'
                      : severity === 'high'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                  }`}
                >
                  {hasGuidance ? 'Safety Broadcast Active' : 'Normal Operations'}
                </span>
              </div>

              <div className="mt-6 flex min-h-[160px] flex-col justify-between">
                {hasGuidance ? (
                  <div className="space-y-4">
                    <h2
                      className={`text-lg font-black tracking-tight ${
                        severity === 'critical'
                          ? 'text-red-400'
                          : severity === 'high'
                            ? 'text-amber-400'
                            : 'text-sky-400'
                      }`}
                    >
                      ⚠️ {activeGuidance.headline}
                    </h2>
                    <p className="text-sm text-ink-muted leading-relaxed font-mono">
                      {activeGuidance.payload?.shortMessage || activeGuidance.headline}
                    </p>

                    {activeGuidance.actions && activeGuidance.actions.length > 0 && (
                      <div className="rounded bg-white/5 border border-white/5 p-3">
                        <span className="text-[10px] font-black uppercase tracking-wider text-brand-primary block mb-2">
                          Safety Directives
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-xs text-ink-muted font-sans">
                          {activeGuidance.actions.map((act: string) => (
                            <li key={act}>{act}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center space-y-3 py-6">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <span className="text-emerald-400 text-sm font-bold">✓</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-ink">Welcome to Lucusa Stadium</h3>
                      <p className="text-xs text-ink-muted mt-1 max-w-[280px]">
                        Operations running within safe capacity limits. Maintain standard flow
                        rates.
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-6 border-t border-white/5 pt-4 flex items-center justify-between text-[10px] text-ink-muted font-mono">
                  <span>Display ID: {z.id.toUpperCase()}-LED</span>
                  <span>
                    {hasGuidance && activeGuidance.expiresAt
                      ? `Expires: ${new Date(activeGuidance.expiresAt).toLocaleTimeString()}`
                      : 'Status: Steady'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
