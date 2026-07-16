type LoadingProps = {
  label?: string;
};

export function Loading({ label = 'Loading' }: LoadingProps) {
  return (
    <div
      role="status"
      aria-label={label}
      aria-live="polite"
      className="flex items-center gap-3 text-sm text-ink-muted"
    >
      <span className="h-3 w-3 animate-pulse rounded-full bg-brand-secondary" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
