import { Button } from './Button';
import { cn } from '@/utils/classNames';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function ErrorState({
  title = 'System Connection Interrupted',
  description = 'Operations service is currently unavailable or the network timed out.',
  onRetry,
  isLoading = false,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-rose-500/20 bg-rose-500/5 p-8 text-center max-w-md mx-auto flex flex-col items-center justify-center space-y-4 select-none',
        className,
      )}
      role="alert"
    >
      <div
        className="h-10 w-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 text-lg animate-pulse"
        aria-hidden="true"
      >
        ⚠️
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider font-mono">
          {title}
        </h3>
        <p className="text-xs text-ink-muted leading-relaxed">{description}</p>
      </div>
      {onRetry && (
        <Button
          onClick={onRetry}
          disabled={isLoading}
          variant="secondary"
          size="sm"
          className="font-mono text-[10px] uppercase font-bold border border-rose-500/25 text-rose-400 hover:bg-rose-500/10"
        >
          {isLoading ? (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full border border-current border-t-transparent animate-spin" />
              Retrying Connection...
            </span>
          ) : (
            'Retry Connection'
          )}
        </Button>
      )}
    </div>
  );
}
