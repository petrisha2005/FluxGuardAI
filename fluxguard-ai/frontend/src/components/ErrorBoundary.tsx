import type { ReactNode } from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

import { ErrorFallback } from './ErrorFallback';

type ErrorBoundaryProps = {
  children: ReactNode;
};

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  return (
    <ReactErrorBoundary
      FallbackComponent={() => <ErrorFallback />}
      onError={(error, info) => {
        console.error('Application error boundary captured an error.', {
          error,
          componentStack: info.componentStack,
        });
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}
