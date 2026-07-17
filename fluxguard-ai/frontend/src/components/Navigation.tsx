import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { api } from '../services/api';
import type { BackendVenue } from '../services/api';
import { getActiveEventId, setActiveEventId } from '../features/simulation/simulationStore';

export function Navigation() {
  const [venues, setVenues] = useState<BackendVenue[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string>('');

  useEffect(() => {
    api
      .fetchVenues()
      .then((data) => {
        setVenues(data);
        // Find which venue owns the active event context
        data.forEach(async (venue) => {
          try {
            const events = await api.fetchEventsByVenue(venue.id);
            if (events.some((e) => e.id === getActiveEventId())) {
              setSelectedVenueId(venue.id);
            }
          } catch (e) {
            console.error('Error fetching venue events:', e);
          }
        });
      })
      .catch((err) => console.error('Failed to load venues:', err));
  }, []);

  const handleVenueChange = async (venueId: string) => {
    setSelectedVenueId(venueId);
    try {
      const events = await api.fetchEventsByVenue(venueId);
      if (events && events.length > 0) {
        setActiveEventId(events[0].id);
      }
    } catch (err) {
      console.error('Failed to swap event for venue:', err);
    }
  };

  return (
    <header className="border-b border-white/5 bg-surface/85 backdrop-blur-md sticky top-0 z-40">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow"
      >
        Skip to main content
      </a>
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8"
      >
        <div className="flex items-center gap-6">
          <NavLink to="/" className="text-sm font-black tracking-widest text-ink mr-4 flex items-center gap-2 uppercase">
            <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
            FluxGuard <span className="text-brand-primary font-mono text-[9px] bg-brand-primary/10 px-1.5 py-0.5 rounded tracking-normal">OPS</span>
          </NavLink>
          <div className="flex items-center gap-1">
            <NavLink
              to="/city-hub"
              className={({ isActive }) =>
                `text-[11px] font-bold uppercase tracking-wider transition-all duration-200 hover:text-ink px-3 py-1.5 rounded-md ${
                  isActive
                    ? 'text-brand-primary bg-white/5 border border-white/5 shadow-[0_0_12px_rgba(56,189,248,0.05)]'
                    : 'text-ink-subdued'
                }`
              }
            >
              City Hub
            </NavLink>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `text-[11px] font-bold uppercase tracking-wider transition-all duration-200 hover:text-ink px-3 py-1.5 rounded-md ${
                  isActive
                    ? 'text-brand-primary bg-white/5 border border-white/5 shadow-[0_0_12px_rgba(56,189,248,0.05)]'
                    : 'text-ink-subdued'
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/analytics"
              className={({ isActive }) =>
                `text-[11px] font-bold uppercase tracking-wider transition-all duration-200 hover:text-ink px-3 py-1.5 rounded-md ${
                  isActive
                    ? 'text-brand-primary bg-white/5 border border-white/5 shadow-[0_0_12px_rgba(56,189,248,0.05)]'
                    : 'text-ink-subdued'
                }`
              }
            >
              Analytics
            </NavLink>
            <NavLink
              to="/copilot"
              className={({ isActive }) =>
                `text-[11px] font-bold uppercase tracking-wider transition-all duration-200 hover:text-ink px-3 py-1.5 rounded-md ${
                  isActive
                    ? 'text-brand-primary bg-white/5 border border-white/5 shadow-[0_0_12px_rgba(56,189,248,0.05)]'
                    : 'text-ink-subdued'
                }`
              }
            >
              AI Copilot
            </NavLink>
            <NavLink
              to="/operations"
              className={({ isActive }) =>
                `text-[11px] font-bold uppercase tracking-wider transition-all duration-200 hover:text-ink px-3 py-1.5 rounded-md ${
                  isActive
                    ? 'text-brand-primary bg-white/5 border border-white/5 shadow-[0_0_12px_rgba(56,189,248,0.05)]'
                    : 'text-ink-subdued'
                }`
              }
            >
              Operations
            </NavLink>
            <NavLink
              to="/signage"
              className={({ isActive }) =>
                `text-[11px] font-bold uppercase tracking-wider transition-all duration-200 hover:text-ink px-3 py-1.5 rounded-md ${
                  isActive
                    ? 'text-brand-primary bg-white/5 border border-white/5 shadow-[0_0_12px_rgba(56,189,248,0.05)]'
                    : 'text-ink-subdued'
                }`
              }
            >
              Signage
            </NavLink>
            <NavLink
              to="/volunteer"
              className={({ isActive }) =>
                `text-[11px] font-bold uppercase tracking-wider transition-all duration-200 hover:text-ink px-3 py-1.5 rounded-md ${
                  isActive
                    ? 'text-brand-primary bg-white/5 border border-white/5 shadow-[0_0_12px_rgba(56,189,248,0.05)]'
                    : 'text-ink-subdued'
                }`
              }
            >
              Volunteer
            </NavLink>
          </div>
        </div>

        <div className="flex items-center gap-2 border-l border-white/5 pl-4">
          <span className="text-[10px] text-ink-subdued uppercase tracking-wider font-mono font-bold hidden md:inline">Venue Context:</span>
          <select
            value={selectedVenueId}
            onChange={(e) => handleVenueChange(e.target.value)}
            className="bg-surface-elevated border border-white/5 text-ink text-xs rounded-md px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-brand-primary"
          >
            {venues.map((v) => (
              <option key={v.id} value={v.id} className="bg-surface text-ink">
                {v.name}
              </option>
            ))}
          </select>
        </div>
      </nav>
    </header>
  );
}
