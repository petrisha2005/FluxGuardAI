import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/utils/classNames';

export interface PanelProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  eyebrow?: string;
  children: ReactNode;
}

export function Panel({ children, className, eyebrow, title, ...props }: PanelProps) {
  return (
    <section
      className={cn('rounded-command border border-white/10 bg-surface-elevated/80 p-6', className)}
      {...props}
    >
      {eyebrow || title ? (
        <header className="mb-5">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-secondary">
              {eyebrow}
            </p>
          ) : null}
          {title ? <h2 className="mt-1 text-lg font-semibold text-ink">{title}</h2> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
