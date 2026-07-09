import type { ReactNode } from 'react';

import { Card } from './Card';
import { cn } from '@/utils/classNames';

export interface MetricCardProps {
  title: string;
  value: string;
  trend?: string;
  icon?: ReactNode;
  className?: string;
}

export function MetricCard({ className, icon, title, trend, value }: MetricCardProps) {
  return (
    <Card className={cn('p-4', className)} aria-label={`${title}: ${value}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ink-muted">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-ink">{value}</p>
          {trend ? <p className="mt-2 text-sm text-brand-secondary">{trend}</p> : null}
        </div>
        {icon ? (
          <div className="rounded-command border border-white/10 bg-white/5 p-2 text-brand-primary">
            {icon}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
