import { Panel } from '@/components/ui';

export function FanZoneMonitor() {
  return (
    <Panel eyebrow="Viewing Areas" title="Fan Zone Capacities">
      <div className="space-y-3 font-mono text-xs text-ink-muted">
        <div className="p-3 bg-surface rounded border border-white/5 space-y-1">
          <div className="flex justify-between text-ink">
            <span className="font-bold">Times Square Viewing Area</span>
            <span className="text-risk-safe">12,500 / 15,000</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
            <div className="h-1 bg-brand-primary" style={{ width: '83%' }} />
          </div>
        </div>

        <div className="p-3 bg-surface rounded border border-white/5 space-y-1">
          <div className="flex justify-between text-ink">
            <span className="font-bold">Central Park Fan Plaza</span>
            <span className="text-risk-warning">18,000 / 20,000</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
            <div className="h-1 bg-risk-warning" style={{ width: '90%' }} />
          </div>
        </div>
      </div>
    </Panel>
  );
}
