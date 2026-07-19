interface PredictionCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  horizon: string;
  trend?: 'UP' | 'DOWN' | 'STABLE';
}

export function PredictionCard({ title, value, subValue, horizon, trend }: PredictionCardProps) {
  return (
    <div className="rounded border border-white/5 bg-surface-panel p-4 space-y-2 font-mono hover:border-white/10 transition-all">
      <div className="flex items-center justify-between text-[9px] text-ink-subdued uppercase tracking-wider">
        <span>{title}</span>
        <span className="bg-white/5 border border-white/5 px-1.5 py-0.5 rounded text-[8px]">
          {horizon}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold text-ink">{value}</span>
        {subValue && <span className="text-2xs text-ink-muted">{subValue}</span>}
      </div>
      {trend && (
        <div className="text-[9px] flex items-center gap-1 font-bold">
          <span className="text-ink-subdued">Trend:</span>
          <span
            className={
              trend === 'UP'
                ? 'text-risk-critical animate-pulse'
                : trend === 'DOWN'
                  ? 'text-risk-safe'
                  : 'text-brand-primary'
            }
          >
            {trend}
          </span>
        </div>
      )}
    </div>
  );
}
