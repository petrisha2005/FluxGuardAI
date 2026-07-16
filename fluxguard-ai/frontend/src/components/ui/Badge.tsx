import type { HTMLAttributes } from 'react';

import { cn } from '@/utils/classNames';

export type BadgeVariant = 'safe' | 'warning' | 'critical' | 'info';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  safe: 'border-risk-safe/40 bg-risk-safe/15 text-green-200',
  warning: 'border-risk-warning/50 bg-risk-warning/15 text-amber-100',
  critical: 'border-risk-critical/50 bg-risk-critical/15 text-red-100',
  info: 'border-risk-info/50 bg-risk-info/15 text-sky-100',
};

export function Badge({ children, className, variant = 'info', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-semibold uppercase tracking-wide',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
