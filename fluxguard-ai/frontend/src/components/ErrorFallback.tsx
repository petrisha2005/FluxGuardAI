import { Button } from '@/components/ui';

type ErrorFallbackProps = {
  title?: string;
  message?: string;
};

export function ErrorFallback({
  title = 'Something went wrong',
  message = 'The interface could not load this section. Please retry or contact support if the issue continues.',
}: ErrorFallbackProps) {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <section
      role="alert"
      className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-6 text-center max-w-md mx-auto flex flex-col items-center justify-center space-y-4 select-none font-mono text-xs text-ink"
      aria-labelledby="error-fallback-title"
    >
      <div
        className="h-9 w-9 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 text-base animate-pulse"
        aria-hidden="true"
      >
        ⚠️
      </div>
      <div className="space-y-1">
        <h2
          id="error-fallback-title"
          className="text-sm font-bold text-rose-400 uppercase tracking-wider"
        >
          {title}
        </h2>
        <p className="text-xs text-ink-muted leading-relaxed font-sans">{message}</p>
      </div>
      <Button
        onClick={handleReload}
        variant="secondary"
        size="sm"
        className="font-mono text-[9px] uppercase font-bold border border-rose-500/25 text-rose-400 hover:bg-rose-500/10"
      >
        Reload Page
      </Button>
    </section>
  );
}
