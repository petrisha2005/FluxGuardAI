import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/utils/classNames';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function Card({ actions, children, className, description, title, ...props }: CardProps) {
  return (
    <section
      className={cn(
        'rounded-command border border-white/10 bg-surface-panel/90 p-5 shadow-command',
        className,
      )}
      {...props}
    >
      {title || description || actions ? (
        <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? <h2 className="text-base font-semibold text-ink">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div>{children}</div>
    </section>
  );
}
