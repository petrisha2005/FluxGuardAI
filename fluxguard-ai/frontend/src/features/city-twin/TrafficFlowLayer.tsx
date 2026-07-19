import { Panel } from '@/components/ui';

export function TrafficFlowLayer() {
  return (
    <Panel eyebrow="Road Flows" title="Expressway Delays">
      <div className="space-y-2 font-mono text-xs text-ink-muted">
        <div className="p-3 bg-surface border border-white/5 rounded flex justify-between items-center">
          <span>Route 3 North</span>
          <span className="text-risk-critical font-bold">+18 mins delay</span>
        </div>
        <div className="p-3 bg-surface border border-white/5 rounded flex justify-between items-center">
          <span>Eastern Expressway</span>
          <span className="text-risk-warning font-bold">+12 mins delay</span>
        </div>
      </div>
    </Panel>
  );
}
