import { useState } from 'react';
import { Card } from './Card';
import { Badge } from './Badge';
import { RoleGuard } from '@/features/auth';
import { cn } from '@/utils/classNames';

export interface AIDecisionCardProps {
  decisionId: string;
  agentName: string;
  recommendation: string;
  confidence: number;
  reason: string;
  expectedImpact: string;
  humanApprovalRequired: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  onApprove?: (decisionId: string, operatorName: string) => Promise<void> | void;
  onReject?: (decisionId: string) => Promise<void> | void;
  className?: string;
}

export function AIDecisionCard({
  decisionId,
  agentName,
  recommendation,
  confidence,
  reason,
  expectedImpact,
  humanApprovalRequired,
  status = 'pending',
  onApprove,
  onReject,
  className,
}: AIDecisionCardProps) {
  const [operatorName, setOperatorName] = useState('OPS-Lead');
  const [actioning, setActioning] = useState<'approving' | 'rejecting' | null>(null);

  const getAgentColor = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('crowd')) return 'border-cyan-500/20 text-cyan-400 bg-cyan-500/5';
    if (lower.includes('emergency')) return 'border-red-500/20 text-red-400 bg-red-500/5';
    if (lower.includes('transport')) return 'border-amber-500/20 text-amber-400 bg-amber-500/5';
    if (lower.includes('resource') || lower.includes('safety'))
      return 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5';
    return 'border-purple-500/20 text-purple-400 bg-purple-500/5';
  };

  const handleApprove = async () => {
    if (!onApprove) return;
    setActioning('approving');
    try {
      await onApprove(decisionId, operatorName);
    } finally {
      setActioning(null);
    }
  };

  const handleReject = async () => {
    if (!onReject) return;
    setActioning('rejecting');
    try {
      await onReject(decisionId);
    } finally {
      setActioning(null);
    }
  };

  return (
    <Card
      className={cn(
        'border border-white/5 bg-slate-900/40 backdrop-blur-sm p-5 hover:border-brand-primary/20 hover:bg-slate-900/60 transition-all duration-300 font-mono text-xs relative overflow-hidden',
        status === 'approved' && 'border-emerald-500/30 bg-emerald-950/5',
        status === 'rejected' && 'border-rose-500/20 bg-rose-950/5 opacity-60',
        className,
      )}
    >
      {/* Decorative pulse line for high confidence suggestions */}
      {confidence >= 90 && status === 'pending' && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brand-primary/40 to-transparent animate-pulse" />
      )}

      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="space-y-1">
          <span
            className={cn(
              'inline-block rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider',
              getAgentColor(agentName),
            )}
          >
            🤖 {agentName}
          </span>
          <h4 className="text-sm font-bold text-ink uppercase tracking-wide font-sans mt-1">
            {recommendation}
          </h4>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-bold text-brand-primary">{confidence}%</div>
          <div className="text-[8px] text-ink-subdued uppercase tracking-widest">Confidence</div>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <span className="text-[9px] text-ink-subdued uppercase tracking-wider block mb-0.5">
            Reason / Rationale
          </span>
          <p className="text-xs text-ink leading-relaxed font-sans">{reason}</p>
        </div>

        <div>
          <span className="text-[9px] text-ink-subdued uppercase tracking-wider block mb-0.5">
            Expected Impact
          </span>
          <p className="text-xs text-emerald-400 font-bold">{expectedImpact}</p>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <span className="text-[9px] text-ink-subdued uppercase tracking-wider">
            Human Approval:
          </span>
          {humanApprovalRequired ? (
            <Badge variant="warning" className="text-[9px] min-h-0 py-0.5">
              Required
            </Badge>
          ) : (
            <Badge variant="safe" className="text-[9px] min-h-0 py-0.5">
              Auto-Exec Allowed
            </Badge>
          )}
        </div>
      </div>

      {status === 'pending' && onApprove && (
        <div className="border-t border-white/5 pt-4 space-y-4">
          {/* Signature Input */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label
              htmlFor={`sig-${decisionId}`}
              className="text-[9px] text-ink-subdued uppercase tracking-wider shrink-0 select-none"
            >
              Operator Signature:
            </label>
            <input
              id={`sig-${decisionId}`}
              type="text"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              className="flex-1 rounded border border-white/10 bg-slate-950 px-2.5 py-1 text-xs text-ink focus:border-brand-primary focus:outline-none placeholder-white/20"
              placeholder="Enter signature code..."
            />
          </div>

          {/* Action buttons with RBAC clearance wrapper */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <RoleGuard
              allowedRoles={['GLOBAL_OPERATIONS_DIRECTOR', 'STADIUM_MANAGER', 'SUPER_ADMIN']}
              fallback={
                <div className="text-[9px] text-rose-400/80 font-bold uppercase tracking-wider select-none">
                  ⚠️ Clearances required to execute AI directives.
                </div>
              }
            >
              {onReject && (
                <button
                  onClick={handleReject}
                  disabled={actioning !== null}
                  className="rounded border border-rose-500/20 bg-rose-500/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-400 hover:bg-rose-500/15 transition-all select-none"
                >
                  Reject
                </button>
              )}
              <button
                onClick={handleApprove}
                disabled={actioning !== null}
                className="rounded bg-brand-primary px-4 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-950 hover:bg-sky-400 transition-all select-none shadow-[0_0_12px_rgba(56,189,248,0.2)]"
              >
                {actioning === 'approving' ? 'Executing...' : 'Approve & Execute'}
              </button>
            </RoleGuard>
          </div>
        </div>
      )}

      {status !== 'pending' && (
        <div className="border-t border-white/5 pt-3 mt-3 flex items-center justify-between text-[10px] text-ink-subdued">
          <span className="uppercase">Decision Logged</span>
          <span
            className={cn(
              'font-bold uppercase tracking-widest',
              status === 'approved' ? 'text-emerald-400' : 'text-rose-400',
            )}
          >
            {status === 'approved' ? '✓ Approved' : '✕ Rejected'}
          </span>
        </div>
      )}
    </Card>
  );
}
