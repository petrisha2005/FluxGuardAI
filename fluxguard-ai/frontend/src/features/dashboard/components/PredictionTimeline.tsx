import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Panel } from '@/components/ui';
import type { PredictionPoint } from '../types/dashboard';

export interface PredictionTimelineProps {
  predictions: PredictionPoint[];
}

export function PredictionTimeline({ predictions }: PredictionTimelineProps) {
  const currentVal = predictions[0]?.forecast ?? 0;
  const horizonVal = predictions[predictions.length - 1]?.forecast ?? 0;
  const delta = horizonVal - currentVal;

  return (
    <Panel
      eyebrow="Predictive analytics"
      title="Density forecast timeline"
      aria-label="Prediction timeline"
    >
      <div className="space-y-6">
        {/* Responsive Recharts Line Chart */}
        <div className="h-72" role="img" aria-label="Current density and forecast timeline chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={predictions} margin={{ top: 8, right: 18, bottom: 8, left: 0 }}>
              <CartesianGrid stroke="rgba(255, 255, 255, 0.04)" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#64748b"
                tickLine={false}
                axisLine={false}
                className="text-[10px] font-mono"
              />
              <YAxis
                stroke="#64748b"
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                tickFormatter={(value: number) => `${value}%`}
                className="text-[10px] font-mono"
              />
              <Tooltip
                contentStyle={{
                  background: '#111827',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '4px',
                  color: '#f1f5f9',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                }}
                formatter={(value: number | string, name: string) => [`${value}%`, name]}
              />
              {/* Lower Confidence Bound */}
              <Line
                type="monotone"
                dataKey="confidenceLow"
                name="95% CI Lower Bound"
                stroke="#64748b"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
              {/* Upper Confidence Bound */}
              <Line
                type="monotone"
                dataKey="confidenceHigh"
                name="95% CI Upper Bound"
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
              {/* Current density */}
              <Line
                type="monotone"
                dataKey="density"
                name="Current density"
                stroke="#2dd4bf"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              {/* Forecast Projection */}
              <Line
                type="monotone"
                dataKey="forecast"
                name="Forecast projection"
                stroke="#38bdf8"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Explainability / Forecast Drivers Panel */}
        <div className="border-t border-white/5 pt-4 space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-ink-muted font-mono">
            Model Explanation & Drivers
          </h4>

          {/* Model Status Card */}
          <div
            className={`rounded-lg border p-3.5 text-xs leading-relaxed ${
              delta > 5
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                : delta < -5
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-slate-900 border-white/10 text-ink-muted'
            }`}
          >
            {delta > 5 ? (
              <p>
                ⚠️ <strong>Surge Forecast:</strong> Crowd density is projected to rise by{' '}
                <strong>{delta}%</strong> over the 40-minute horizon. Primary drivers include
                incoming transit egress passenger surges at the gates.
              </p>
            ) : delta < -5 ? (
              <p>
                ✨ <strong>Post-Intervention Egress:</strong> Crowd density is projected to fall by{' '}
                <strong>{Math.abs(delta)}%</strong>. Stewards dispatch redirection and dynamiced
                signs are successfully balancing risk posture.
              </p>
            ) : (
              <p>
                ℹ️ <strong>Stable State:</strong> Crowd circulation is projected to remain stable
                within safe capacity boundaries. Normal entry/exit balance.
              </p>
            )}
          </div>

          {/* Core Telemetry Explanations */}
          <div className="grid gap-3 sm:grid-cols-2 text-xs">
            <div className="rounded-lg border border-white/5 bg-slate-950/20 p-3">
              <span className="font-semibold text-brand-secondary">Model Version</span>
              <p className="text-[11px] text-ink-muted mt-1">Prophet-mvp-v1.0-enriched</p>
            </div>
            <div className="rounded-lg border border-white/5 bg-slate-950/20 p-3">
              <span className="font-semibold text-brand-secondary">95% Confidence Interval</span>
              <p className="text-[11px] text-ink-muted mt-1">
                20m horizon: ±8% margin • 40m horizon: ±14% margin
              </p>
            </div>
          </div>
        </div>

        {/* Forecast horizon summary tags */}
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          {predictions.map((point) => (
            <div
              key={point.label}
              className="rounded-command border border-white/10 bg-white/5 p-3"
            >
              <dt className="text-ink-muted">{point.label}</dt>
              <dd className="mt-1 font-semibold text-ink">
                {point.forecast}%{' '}
                {point.confidenceLow !== undefined &&
                  `[${point.confidenceLow}% - ${point.confidenceHigh}%]`}{' '}
                density
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Panel>
  );
}
