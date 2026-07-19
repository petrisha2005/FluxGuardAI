import { Panel } from '@/components/ui';

export function TransportHeatmap() {
  return (
    <Panel eyebrow="Transit Control" title="Metro & Road Egress Speedways">
      <div className="space-y-3 font-mono text-xs text-ink-muted">
        <div className="p-3 bg-surface rounded border border-white/5 space-y-2">
          <div className="flex justify-between items-center text-ink text-[10px]">
            <span>Subway Line 4 (Stadium Hub Station)</span>
            <span className="text-risk-critical font-bold">92% Congestion</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div className="h-1.5 rounded-full bg-risk-critical" style={{ width: '92%' }} />
          </div>
        </div>

        <div className="p-3 bg-surface rounded border border-white/5 space-y-2">
          <div className="flex justify-between items-center text-ink text-[10px]">
            <span>Route 3 Expressway (Egress Lane)</span>
            <span className="text-risk-warning font-bold">71% Congestion</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div className="h-1.5 rounded-full bg-risk-warning" style={{ width: '71%' }} />
          </div>
        </div>
      </div>
    </Panel>
  );
}
