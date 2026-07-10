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
  return (
    <Panel
      eyebrow="Predictive analytics"
      title="Density forecast timeline"
      aria-label="Prediction timeline"
    >
      <div className="h-72" role="img" aria-label="Current density and forecast timeline chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={predictions} margin={{ top: 8, right: 18, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="rgba(148, 163, 184, 0.16)" vertical={false} />
            <XAxis dataKey="label" stroke="#a7b4c8" tickLine={false} axisLine={false} />
            <YAxis
              stroke="#a7b4c8"
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              tickFormatter={(value: number) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                background: '#0d1b2e',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                color: '#f8fafc',
              }}
              formatter={(value: number) => `${value}%`}
            />
            <Line
              type="monotone"
              dataKey="density"
              name="Current density"
              stroke="#2dd4bf"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="forecast"
              name="Forecast"
              stroke="#38bdf8"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        {predictions.map((point) => (
          <div key={point.label} className="rounded-command border border-white/10 bg-white/5 p-3">
            <dt className="text-ink-muted">{point.label}</dt>
            <dd className="mt-1 font-semibold text-ink">{point.forecast}% forecast density</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
