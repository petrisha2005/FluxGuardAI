import { Panel } from '@/components/ui';

export function EventStatusPanel() {
  return (
    <Panel eyebrow="Match Day" title="Active Event Schedule Status">
      <div className="space-y-3 font-mono text-xs text-ink-muted">
        <div className="p-3 bg-surface rounded border border-white/5 space-y-1.5">
          <div className="flex justify-between items-center text-ink">
            <span className="font-sans font-bold text-sm">MetLife Stadium</span>
            <span className="text-[9px] uppercase tracking-wider text-risk-warning bg-risk-warning/10 px-1.5 py-0.5 rounded">
              Group A
            </span>
          </div>
          <p className="text-[11px] text-ink font-sans">Argentina vs Canada</p>
          <div className="flex justify-between text-[10px] text-ink-subdued pt-1 border-t border-white/5">
            <span>Date: 2026-06-11</span>
            <span>Attendance: 72,000 / 82,500</span>
          </div>
        </div>

        <div className="p-3 bg-surface rounded border border-white/5 space-y-1.5">
          <div className="flex justify-between items-center text-ink">
            <span className="font-sans font-bold text-sm">SoFi Stadium</span>
            <span className="text-[9px] uppercase tracking-wider text-risk-safe bg-risk-safe/10 px-1.5 py-0.5 rounded">
              Group B
            </span>
          </div>
          <p className="text-[11px] text-ink font-sans">USA vs Bolivia</p>
          <div className="flex justify-between text-[10px] text-ink-subdued pt-1 border-t border-white/5">
            <span>Date: 2026-06-12</span>
            <span>Attendance: 65,000 / 70,000</span>
          </div>
        </div>
      </div>
    </Panel>
  );
}
