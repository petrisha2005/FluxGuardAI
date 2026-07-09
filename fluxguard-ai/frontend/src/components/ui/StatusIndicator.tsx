import { cn } from '@/utils/classNames';

export type CrowdRiskState = 'green' | 'amber' | 'red';
export type StatusState = CrowdRiskState;

export interface StatusIndicatorProps {
  state: StatusState;
  label?: string;
  accessibilityText?: string;
  className?: string;
}

const stateConfig: Record<StatusState, { label: string; className: string }> = {
  green: {
    label: 'Green',
    className: 'bg-risk-safe shadow-[0_0_16px_rgb(34_197_94/0.4)]',
  },
  amber: {
    label: 'Amber',
    className: 'bg-risk-warning shadow-[0_0_16px_rgb(245_158_11/0.4)]',
  },
  red: {
    label: 'Red',
    className: 'bg-risk-critical shadow-[0_0_16px_rgb(239_68_68/0.4)]',
  },
};

export function StatusIndicator({
  accessibilityText,
  className,
  label,
  state,
}: StatusIndicatorProps) {
  const config = stateConfig[state];
  const visibleLabel = label ?? config.label;

  return (
    <span
      className={cn('inline-flex items-center gap-2 text-sm font-medium text-ink', className)}
      role="status"
      aria-label={accessibilityText ?? `Status ${visibleLabel}`}
    >
      <span className={cn('h-2.5 w-2.5 rounded-full', config.className)} aria-hidden="true" />
      <span>{visibleLabel}</span>
    </span>
  );
}
