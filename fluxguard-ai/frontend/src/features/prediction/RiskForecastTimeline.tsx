import { useEffect, useState } from 'react';
import { Panel, Badge } from '@/components/ui';
import { getActiveEventId } from '../simulation/simulationStore';

interface TimelinePrediction {
  zone_name: string;
  current_risk: string;
  predicted_risk: string;
  horizon_minutes: number;
  predicted_density: number;
  predicted_queue_length: number;
  predicted_flow_rate: number;
  incident_probability: number;
  staff_requirement: number;
  confidence: number;
  reason: string;
  timeframe: string;
}

export function RiskForecastTimeline() {
  const [predictions, setPredictions] = useState<TimelinePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedHorizon, setSelectedHorizon] = useState<number>(20);

  useEffect(() => {
    setLoading(true);
    const eventId = getActiveEventId();
    fetch(`/api/predictions/timeline?eventId=${eventId}`)
      .then((res) => res.json())
      .then((payload) => {
        setPredictions(payload.data || []);
      })
      .catch((err) => console.warn('Failed to load predictions timeline:', err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = predictions.filter((p) => p.horizon_minutes === selectedHorizon);

  return (
    <Panel eyebrow="Telemetry Forecasting" title="Multi-Horizon Risk Timeline">
      <div className="space-y-4 font-mono">
        {/* Horizon selector buttons */}
        <div className="flex gap-1.5 border-b border-white/5 pb-3">
          {([0, 10, 20, 40, 60] as const).map((h) => (
            <button
              key={h}
              onClick={() => setSelectedHorizon(h)}
              className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${
                selectedHorizon === h
                  ? 'bg-brand-primary text-slate-950 font-black'
                  : 'bg-white/5 border border-white/5 text-ink-subdued hover:bg-white/10'
              }`}
            >
              {h === 0 ? 'Current T-0' : `+${h} Mins`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-xs text-ink-subdued py-6">
            Calculating forecasting matrix...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-xs text-ink-subdued py-6">No prediction data found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[9px] uppercase tracking-wider text-ink-subdued">
                  <th className="py-2.5">Zone</th>
                  <th className="py-2.5">Density</th>
                  <th className="py-2.5">Queue</th>
                  <th className="py-2.5">Incident Prob</th>
                  <th className="py-2.5">Staff Req</th>
                  <th className="py-2.5">Risk Level</th>
                  <th className="py-2.5 text-right">Reason / Driver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((p, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.01] transition-all">
                    <td className="py-3 font-sans font-bold text-ink">{p.zone_name}</td>
                    <td className="py-3 text-brand-primary">{p.predicted_density}%</td>
                    <td className="py-3 text-ink-muted">{p.predicted_queue_length} pax</td>
                    <td className="py-3 text-risk-warning">{p.incident_probability}%</td>
                    <td className="py-3 text-ink-muted">{p.staff_requirement} agents</td>
                    <td className="py-3">
                      <Badge
                        variant={
                          p.predicted_risk === 'CRITICAL'
                            ? 'critical'
                            : p.predicted_risk === 'HIGH'
                              ? 'warning'
                              : 'safe'
                        }
                      >
                        {p.predicted_risk}
                      </Badge>
                    </td>
                    <td className="py-3 text-right text-ink-subdued text-[10px] max-w-[200px] truncate">
                      {p.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Panel>
  );
}
