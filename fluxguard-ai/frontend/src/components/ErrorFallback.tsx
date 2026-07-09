type ErrorFallbackProps = {
  title?: string;
  message?: string;
};

export function ErrorFallback({
  title = 'Something went wrong',
  message = 'The interface could not load this section. Please retry or contact support if the issue continues.',
}: ErrorFallbackProps) {
  return (
    <section
      role="alert"
      className="rounded-md border border-red-200 bg-red-50 p-4 text-red-950"
      aria-labelledby="error-fallback-title"
    >
      <h2 id="error-fallback-title" className="text-base font-semibold">
        {title}
      </h2>
      <p className="mt-2 text-sm">{message}</p>
    </section>
  );
}
