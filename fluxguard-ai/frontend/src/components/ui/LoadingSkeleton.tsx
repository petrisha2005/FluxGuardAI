import { Skeleton } from './Skeleton';
import { cn } from '@/utils/classNames';

interface LoadingSkeletonProps {
  variant?: 'card' | 'table' | 'list' | 'map' | 'chart';
  count?: number;
  className?: string;
}

export function LoadingSkeleton({ variant = 'card', count = 3, className }: LoadingSkeletonProps) {
  if (variant === 'table') {
    return (
      <div
        className={cn('space-y-3 w-full', className)}
        role="status"
        aria-label="Loading table content"
      >
        <div className="flex gap-4 border-b border-white/10 pb-2">
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-5 w-1/4" />
        </div>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex gap-4 pt-1">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div
        className={cn('space-y-4 w-full', className)}
        role="status"
        aria-label="Loading list content"
      >
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'map') {
    return (
      <div
        className={cn(
          'w-full h-80 rounded-xl border border-white/5 bg-slate-900/30 flex items-center justify-center p-6 relative overflow-hidden',
          className,
        )}
        role="status"
        aria-label="Loading digital twin layout"
      >
        <Skeleton className="absolute inset-0 w-full h-full" />
        <div className="z-10 text-center space-y-2">
          <div className="inline-block h-8 w-8 rounded-full border-2 border-brand-primary/20 border-t-brand-primary animate-spin" />
          <div className="text-2xs font-mono font-bold tracking-widest text-ink-subdued uppercase">
            Rendering digital twin topology...
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'chart') {
    return (
      <div
        className={cn(
          'w-full h-48 flex items-end gap-3 pt-6 border-b border-l border-white/10 px-2',
          className,
        )}
        role="status"
        aria-label="Loading analytics trends"
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            className="w-full rounded-t-sm"
            style={{
              height: `${Math.max(15, Math.min(100, (i + 1) * 12 + (i % 2 === 0 ? 15 : -10)))}%`,
            }}
          />
        ))}
      </div>
    );
  }

  // Default: Card Skeleton
  return (
    <div
      className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}
      role="status"
      aria-label="Loading panel updates"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-white/5 bg-surface-elevated/20 p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-8 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/6" />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
