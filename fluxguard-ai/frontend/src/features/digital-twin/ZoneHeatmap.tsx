interface CrowdZone {
  id: string;
  name: string;
  density: number;
  capacity?: number;
  risk: string;
}

export function ZoneHeatmap({ zones }: { zones: CrowdZone[] }) {
  return (
    <div className="space-y-3 font-mono text-xs">
      <h3 className="text-[9px] font-bold text-ink-subdued uppercase tracking-widest">
        Live Capacity Overlays
      </h3>
      <div className="grid gap-3">
        {zones.map((z) => (
          <div key={z.id} className="p-3 bg-surface rounded border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-ink">
              <span className="font-bold">{z.name}</span>
              <span
                className={
                  z.risk === 'CRITICAL'
                    ? 'text-risk-critical animate-pulse font-bold'
                    : z.risk === 'HIGH'
                      ? 'text-risk-warning font-bold'
                      : 'text-risk-safe'
                }
              >
                {z.density}% Density ({z.risk})
              </span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  z.risk === 'CRITICAL'
                    ? 'bg-risk-critical'
                    : z.risk === 'HIGH'
                      ? 'bg-risk-warning'
                      : 'bg-brand-primary'
                }`}
                style={{ width: `${z.density}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
