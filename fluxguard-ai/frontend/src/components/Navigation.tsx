import { NavLink } from 'react-router-dom';

export function Navigation() {
  return (
    <header className="border-b border-white/10 bg-surface-elevated/80 backdrop-blur">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow"
      >
        Skip to main content
      </a>
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8"
      >
        <NavLink to="/" className="text-lg font-semibold tracking-tight text-ink">
          FluxGuard AI
        </NavLink>
        <span className="text-sm font-medium text-ink-muted">Predict. Prevent. Protect.</span>
      </nav>
    </header>
  );
}
