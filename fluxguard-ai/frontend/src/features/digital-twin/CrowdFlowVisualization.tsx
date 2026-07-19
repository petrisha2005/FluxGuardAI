export function CrowdFlowVisualization() {
  return (
    <div className="p-4 bg-surface rounded border border-white/5 space-y-3 font-mono text-xs">
      <h3 className="text-[9px] font-bold text-ink-subdued uppercase tracking-widest">
        Egress Vector Flow Rates
      </h3>
      <div className="space-y-2">
        <div className="flex justify-between items-center text-ink-muted text-[10px]">
          <span>North Gate → Concourse</span>
          <span className="text-brand-primary font-bold">▲ 45 pax/min</span>
        </div>
        <div className="flex justify-between items-center text-ink-muted text-[10px]">
          <span>Gate C → South Egress</span>
          <span className="text-risk-safe font-bold">▼ 62 pax/min</span>
        </div>
        <div className="flex justify-between items-center text-ink-muted text-[10px]">
          <span>West Entrance → Main Concourse</span>
          <span className="text-risk-warning font-bold">▲ 37 pax/min</span>
        </div>
      </div>
      <div className="text-[9px] text-ink-subdued uppercase pt-1 border-t border-white/5">
        Target Posture: Egress Optimized
      </div>
    </div>
  );
}
