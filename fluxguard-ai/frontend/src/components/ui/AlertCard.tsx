import { motion } from 'framer-motion';
import { useId } from 'react';

import { Badge } from './Badge';
import { cn } from '@/utils/classNames';

export type AlertSeverity = 'safe' | 'warning' | 'critical' | 'info';

export interface AlertCardProps {
  severity: AlertSeverity;
  title: string;
  description: string;
  timestamp: string;
  className?: string;
}

const severityLabel: Record<AlertSeverity, string> = {
  safe: 'Safe',
  warning: 'Warning',
  critical: 'Critical',
  info: 'Info',
};

export function AlertCard({ className, description, severity, timestamp, title }: AlertCardProps) {
  const titleId = useId();

  return (
    <motion.article
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      className={cn(
        'rounded-command border border-white/10 bg-surface-panel p-4 shadow-command',
        className,
      )}
      aria-labelledby={titleId}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Badge variant={severity}>{severityLabel[severity]}</Badge>
          <h3 id={titleId} className="text-base font-semibold text-ink">
            {title}
          </h3>
          <p className="text-sm leading-6 text-ink-muted">{description}</p>
        </div>
        <time className="text-xs font-medium text-ink-subdued">{timestamp}</time>
      </div>
    </motion.article>
  );
}
