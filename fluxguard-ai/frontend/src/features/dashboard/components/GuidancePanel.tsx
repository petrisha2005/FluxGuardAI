import { Badge, Panel } from '@/components/ui';
import type { GuidanceRecommendation } from '../types/dashboard';

export interface GuidancePanelProps {
  guidance: GuidanceRecommendation;
  onApprove?: () => void;
  onReject?: () => void;
}

export function GuidancePanel({ guidance, onApprove, onReject }: GuidancePanelProps) {
  const status = guidance.status || 'PENDING_APPROVAL';

  return (
    <Panel
      eyebrow="Operational guidance"
      title="Simulated AI recommendation"
      aria-label="Guidance panel"
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-2xl text-sm leading-6 text-ink-muted">{guidance.message}</p>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge variant="info">
              {guidance.confidence}% confidence · {guidance.risk}
            </Badge>
            {status === 'APPROVED' && <Badge variant="safe">Broadcast Active</Badge>}
            {status === 'REJECTED' && <Badge variant="critical">Archived / Rejected</Badge>}
            {status === 'PENDING_APPROVAL' && (
              <Badge variant="warning">Awaiting Operator Approval</Badge>
            )}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-ink">Recommended actions</h3>
          <ul className="mt-3 space-y-2">
            {guidance.recommendedActions.map((action) => (
              <li
                key={action}
                className="rounded-command border border-white/10 bg-white/5 px-3 py-2 text-sm text-ink-muted"
              >
                {action}
              </li>
            ))}
          </ul>
        </div>

        {status === 'PENDING_APPROVAL' && onApprove && onReject && (
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onApprove}
              className="text-xs font-semibold rounded bg-brand-primary text-slate-950 px-3 py-2 hover:bg-brand-primary/80 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary"
            >
              ✓ Approve Broadcast
            </button>
            <button
              onClick={onReject}
              className="text-xs font-semibold rounded border border-white/10 bg-white/5 text-ink-muted px-3 py-2 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/20 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500"
            >
              ✕ Reject Directive
            </button>
          </div>
        )}
      </div>
    </Panel>
  );
}
