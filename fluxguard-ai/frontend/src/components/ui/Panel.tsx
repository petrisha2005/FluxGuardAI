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
      className={cn(
        'rounded-md border border-white/5 bg-surface-elevated p-5 transition-all duration-200 hover:border-white/10',
        className,
      )}
      {...props}
    >
      {eyebrow || title ? (
        <header className="mb-4 border-b border-white/5 pb-3">
          {eyebrow ? (
            <p className="text-[9px] font-bold uppercase tracking-widest text-brand-primary font-mono">
              {eyebrow}
            </p>
          ) : null}
          {title ? (
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink font-mono mt-0.5">
              {title}
            </h2>
          ) : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
