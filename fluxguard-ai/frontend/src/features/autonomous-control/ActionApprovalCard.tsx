import React, { useState } from 'react';
import type { AutonomousDecision } from '@/services/api';
import { RoleGuard } from '@/features/auth';
import { Badge, Card } from '@/components/ui';
import { cn } from '@/utils/classNames';

interface ActionApprovalCardProps {
  decision: AutonomousDecision;
  onApprove: (decisionId: string, operatorName: string) => void;
  onReject: (decisionId: string) => void;
}

export function ActionApprovalCard({ decision, onApprove, onReject }: ActionApprovalCardProps) {
  const [operatorName, setOperatorName] = useState('OPS-Lead');
  const [isModifying, setIsModifying] = useState(false);
  const [modifiedTarget, setModifiedTarget] = useState(decision.target);
  const [modifiedReason, setModifiedReason] = useState(decision.reason);
  const [isApproved, setIsApproved] = useState(false);
  const [isRejected, setIsRejected] = useState(false);

  const handleApprove = () => {
    setIsApproved(true);
    onApprove(decision.id, operatorName);
  };

  const handleReject = () => {
    setIsRejected(true);
    onReject(decision.id);
  };

  const getAgentColor = (agent: string) => {
    const lower = agent.toLowerCase();
    if (lower.includes('crowd')) return 'border-cyan-500/20 text-cyan-400 bg-cyan-500/5';
    if (lower.includes('emergency')) return 'border-red-500/20 text-red-400 bg-red-500/5';
    if (lower.includes('transport')) return 'border-amber-500/20 text-amber-400 bg-amber-500/5';
    if (lower.includes('resource') || lower.includes('safety'))
      return 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5';
    return 'border-purple-500/20 text-purple-400 bg-purple-500/5';
  };

  const status = isApproved ? 'approved' : isRejected ? 'rejected' : 'pending';

  return (
    <Card
      className={cn(
        'border border-white/5 bg-slate-900/40 backdrop-blur-sm p-5 hover:border-brand-primary/20 hover:bg-slate-900/60 transition-all duration-300 font-mono text-xs relative overflow-hidden',
        status === 'approved' && 'border-emerald-500/30 bg-emerald-950/5',
        status === 'rejected' && 'border-rose-500/20 bg-rose-950/5 opacity-60',
      )}
    >
      {decision.confidence >= 90 && status === 'pending' && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brand-primary/40 to-transparent animate-pulse" />
      )}

      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="space-y-1">
          <span
            className={cn(
              'inline-block rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider',
              getAgentColor(decision.agent),
            )}
          >
            🤖 {decision.agent}
          </span>
          <h4 className="text-sm font-bold text-ink uppercase tracking-wide font-sans mt-1">
            {decision.action}{' '}
            <span className="text-brand-secondary">
              → {isModifying ? modifiedTarget : decision.target}
            </span>
          </h4>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-bold text-brand-primary">{decision.confidence}%</div>
          <div className="text-[8px] text-ink-subdued uppercase tracking-widest">Confidence</div>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <span className="text-[9px] text-ink-subdued uppercase tracking-wider block mb-0.5">
            Rationale
          </span>
          {isModifying ? (
            <textarea
              value={modifiedReason}
              onChange={(e) => setModifiedReason(e.target.value)}
              className="mt-1 w-full rounded border border-white/10 bg-slate-950 px-2.5 py-1.5 text-xs text-ink focus:border-brand-primary focus:outline-none"
              rows={2}
            />
          ) : (
            <p className="text-xs text-ink leading-relaxed font-sans">{decision.reason}</p>
          )}
        </div>

        <div>
          <span className="text-[9px] text-ink-subdued uppercase tracking-wider block mb-0.5">
            Expected Impact
          </span>
          <p className="text-xs text-emerald-400 font-bold">{decision.expectedImpact}</p>
        </div>

        {isModifying && (
          <div>
            <label
              htmlFor={`target-${decision.id}`}
              className="text-[9px] font-mono text-ink-subdued uppercase tracking-wider block mb-0.5"
            >
              Target Location / Asset
            </label>
            <input
              id={`target-${decision.id}`}
              type="text"
              value={modifiedTarget}
              onChange={(e) => setModifiedTarget(e.target.value)}
              className="w-full rounded border border-white/10 bg-slate-950 px-2.5 py-1 text-xs text-ink focus:border-brand-primary focus:outline-none font-mono"
            />
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <span className="text-[9px] text-ink-subdued uppercase tracking-wider">
            Human Approval:
          </span>
          <Badge variant="warning" className="text-[9px] min-h-0 py-0.5">
            Required Clearance
          </Badge>
        </div>
      </div>

      {status === 'pending' && (
        <div className="border-t border-white/5 pt-4 space-y-4">
          {/* Signature Input */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label
              htmlFor={`sig-${decision.id}`}
              className="text-[9px] text-ink-subdued uppercase tracking-wider shrink-0 select-none"
            >
              Operator Signature:
            </label>
            <input
              id={`sig-${decision.id}`}
              type="text"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              className="flex-1 rounded border border-white/10 bg-slate-950 px-2.5 py-1 text-xs text-ink focus:border-brand-primary focus:outline-none font-mono"
              placeholder="e.g. OPS-Lead"
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
              <button
                onClick={() => setIsModifying(!isModifying)}
                className="rounded border border-white/10 bg-transparent px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink transition-all hover:bg-white/5 focus:outline-none"
              >
                {isModifying ? 'Cancel' : 'Modify'}
              </button>
              <button
                onClick={handleReject}
                className="rounded border border-rose-500/25 bg-rose-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-400 transition-colors duration-200 hover:bg-rose-500/25 focus:outline-none"
              >
                Reject
              </button>
              <button
                onClick={handleApprove}
                className="rounded bg-brand-primary px-4 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-950 hover:bg-sky-400 focus:outline-none font-black shadow-[0_0_12px_rgba(56,189,248,0.2)] transition-all duration-200"
              >
                Approve & Execute
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
