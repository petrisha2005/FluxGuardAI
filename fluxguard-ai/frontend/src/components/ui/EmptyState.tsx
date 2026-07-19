import React from 'react';
import { cn } from '@/utils/classNames';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon = '📋',
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-dashed border-white/10 bg-slate-900/10 p-8 text-center max-w-lg mx-auto flex flex-col items-center justify-center space-y-3 select-none',
        className,
      )}
    >
      <div
        className="text-3xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]"
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-ink uppercase tracking-wide font-mono">{title}</h3>
        <p className="text-xs text-ink-muted leading-relaxed max-w-sm">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
