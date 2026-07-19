import type { HTMLAttributes } from 'react';
import { cn } from '@/utils/classNames';

export type StatusBadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: StatusBadgeVariant;
  pulse?: boolean;
}

const variantClasses: Record<StatusBadgeVariant, string> = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  danger: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
  info: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
  neutral: 'border-slate-500/30 bg-slate-500/10 text-slate-400',
};

const dotClasses: Record<StatusBadgeVariant, string> = {
  success: 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
  warning: 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]',
  danger: 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.5)]',
  info: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]',
  neutral: 'bg-slate-400',
};

export function StatusBadge({
  children,
  className,
  variant = 'neutral',
  pulse = true,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold font-mono tracking-wider uppercase select-none',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'mr-1.5 h-1.5 w-1.5 rounded-full shrink-0',
          dotClasses[variant],
          pulse && 'animate-pulse',
        )}
      />
      {children}
    </span>
  );
}
