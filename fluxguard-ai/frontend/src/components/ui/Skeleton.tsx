import type { HTMLAttributes } from 'react';

import { cn } from '@/utils/classNames';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
}

export function Skeleton({ className, label = 'Loading content', ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-command bg-white/10', className)}
      role="status"
      aria-label={label}
      {...props}
    />
  );
}
