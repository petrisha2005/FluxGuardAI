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
        <div className="flex items-center gap-6">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `text-sm font-semibold transition-all duration-250 hover:text-brand-primary ${
                isActive
                  ? 'text-brand-primary border-b-2 border-brand-primary pb-0.5 shadow-[0_4px_12px_rgb(56_189_248/0.1)]'
                  : 'text-ink-muted'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              `text-sm font-semibold transition-all duration-250 hover:text-brand-primary ${
                isActive
                  ? 'text-brand-primary border-b-2 border-brand-primary pb-0.5 shadow-[0_4px_12px_rgb(56_189_248/0.1)]'
                  : 'text-ink-muted'
              }`
            }
          >
            Analytics
          </NavLink>
          <NavLink
            to="/copilot"
            className={({ isActive }) =>
              `text-sm font-semibold transition-all duration-250 hover:text-brand-primary ${
                isActive
                  ? 'text-brand-primary border-b-2 border-brand-primary pb-0.5 shadow-[0_4px_12px_rgb(56_189_248/0.1)]'
                  : 'text-ink-muted'
              }`
            }
          >
            AI Copilot
          </NavLink>
          <NavLink
            to="/operations"
            className={({ isActive }) =>
              `text-sm font-semibold transition-all duration-250 hover:text-brand-primary ${
                isActive
                  ? 'text-brand-primary border-b-2 border-brand-primary pb-0.5 shadow-[0_4px_12px_rgb(56_189_248/0.1)]'
                  : 'text-ink-muted'
              }`
            }
          >
            Operations
          </NavLink>
          <NavLink
            to="/signage"
            className={({ isActive }) =>
              `text-sm font-semibold transition-all duration-250 hover:text-brand-primary ${
                isActive
                  ? 'text-brand-primary border-b-2 border-brand-primary pb-0.5 shadow-[0_4px_12px_rgb(56_189_248/0.1)]'
                  : 'text-ink-muted'
              }`
            }
          >
            Signage
          </NavLink>
        </div>
      </nav>
    </header>
  );
}
