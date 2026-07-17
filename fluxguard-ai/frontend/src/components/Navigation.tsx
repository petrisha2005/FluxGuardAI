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
        <div className="flex items-center gap-6">
          <NavLink to="/" className="text-lg font-semibold tracking-tight text-ink mr-2">
            FluxGuard AI
          </NavLink>
          <div className="flex items-center gap-4">
            <NavLink
              to="/city-hub"
              className={({ isActive }) =>
                `text-sm font-semibold transition-all duration-250 hover:text-brand-primary ${
                  isActive
                    ? 'text-brand-primary border-b-2 border-brand-primary pb-0.5 shadow-[0_4px_12px_rgb(56_189_248/0.1)]'
                    : 'text-ink-muted'
                }`
              }
            >
              City Hub
            </NavLink>
            <NavLink
              to="/dashboard"
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
            <NavLink
              to="/volunteer"
              className={({ isActive }) =>
                `text-sm font-semibold transition-all duration-250 hover:text-brand-primary ${
                  isActive
                    ? 'text-brand-primary border-b-2 border-brand-primary pb-0.5 shadow-[0_4px_12px_rgb(56_189_248/0.1)]'
                    : 'text-ink-muted'
                }`
              }
            >
              Volunteer
            </NavLink>
          </div>
        </div>

        <div className="flex items-center gap-2 border-l border-white/10 pl-4">
          <span className="text-xs text-ink-muted hidden md:inline">Venue:</span>
          <select
            value={selectedVenueId}
            onChange={(e) => handleVenueChange(e.target.value)}
            className="bg-surface/80 border border-white/10 text-ink text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-primary backdrop-blur"
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
