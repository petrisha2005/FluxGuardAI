type LoadingProps = {
  label?: string;
};

export function Loading({ label = 'Loading' }: LoadingProps) {
  return (
    <div
      role="status"
      aria-label={label}
      aria-live="polite"
      className="flex items-center gap-3 text-sm text-slate-700"
    >
      <span className="h-3 w-3 animate-pulse rounded-full bg-risk-medium" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
