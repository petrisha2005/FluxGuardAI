import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { Sidebar } from './Sidebar';
import { api } from '@/services/api';
import type { BackendVenue } from '@/services/api';
import {
  getActiveEventId,
  setActiveEventId,
  startSimulation,
  useSimulationState,
} from '@/features/simulation/simulationStore';
import { ErrorState } from '@/components/ui';
import { cn } from '@/utils/classNames';
import { NotificationCenter } from './NotificationCenter';
import { CommandPalette } from './CommandPalette';

const DEMO_VENUES: BackendVenue[] = [
  {
    id: 'demo-venue-fluxguard-command',
    name: 'FluxGuard Command Stadium',
    city: 'Demo City',
    country: 'USA',
    timezone: 'UTC',
    metadata: {
      latitude: 40.8136,
      longitude: -74.0745,
    },
  },
];

function getInitialDemoMode(): boolean {
  const storedMode = localStorage.getItem('fluxguard_demo_mode');
  if (storedMode === null) {
    localStorage.setItem('fluxguard_demo_mode', 'true');
    return true;
  }

  return storedMode === 'true';
}

export function LayoutShell() {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();
  const simulationState = useSimulationState();

  const [collapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [venues, setVenues] = useState<BackendVenue[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string>('');

  // Layout upgrade states
  const [lastSyncSeconds, setLastSyncSeconds] = useState(0);
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(getInitialDemoMode);

  const activateDemoFallback = useCallback(() => {
    localStorage.setItem('fluxguard_demo_mode', 'true');
    setIsDemoMode(true);
    setIsNetworkError(false);
    setVenues(DEMO_VENUES);
    setSelectedVenueId(DEMO_VENUES[0].id);
  }, []);

  // Sync Timer: ticks every second, resets on simulation state update
  useEffect(() => {
    const timer = setInterval(() => {
      setLastSyncSeconds((prev) => (prev < 90 ? prev + 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setLastSyncSeconds(0);
  }, [simulationState.lastUpdated]);

  // Network drops listener
  useEffect(() => {
    const handleNetworkError = () => setIsNetworkError(true);
    window.addEventListener('fluxguard-network-error', handleNetworkError);
    return () => window.removeEventListener('fluxguard-network-error', handleNetworkError);
  }, []);

  useEffect(() => {
    if (isNetworkError && !isDemoMode) {
      activateDemoFallback();
    }
  }, [activateDemoFallback, isDemoMode, isNetworkError]);

  useEffect(() => {
    const stopSimulation = startSimulation();
    if (isAuthenticated) {
      api
        .fetchVenues()
        .then((data) => {
          const nextVenues = data.length > 0 ? data : DEMO_VENUES;
          setVenues(nextVenues);
          setSelectedVenueId((current) => current || nextVenues[0]?.id || '');
          setIsNetworkError(false);
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
        .catch((err) => {
          console.error('Failed to load venues:', err);
          activateDemoFallback();
        });
    }

    return stopSimulation;
  }, [activateDemoFallback, isAuthenticated]);

  const handleVenueChange = async (venueId: string) => {
    setSelectedVenueId(venueId);
    try {
      const events = await api.fetchEventsByVenue(venueId);
      if (events && events.length > 0) {
        setActiveEventId(events[0].id);
      }
    } catch (err) {
      console.error('Failed to swap event for venue:', err);
      activateDemoFallback();
    }
  };

  const handleToggleDemoMode = () => {
    const nextVal = !isDemoMode;
    setIsDemoMode(nextVal);
    localStorage.setItem('fluxguard_demo_mode', String(nextVal));
    window.dispatchEvent(new Event('fluxguard-demo-mode-changed'));
    window.location.reload();
  };

  const handleRetryConnection = async () => {
    setIsNetworkError(false);
    try {
      const data = await api.fetchVenues();
      const nextVenues = data.length > 0 ? data : DEMO_VENUES;
      setVenues(nextVenues);
      setSelectedVenueId(nextVenues[0]?.id || '');
      if (nextVenues.length > 0) {
        const events = await api.fetchEventsByVenue(nextVenues[0].id);
        if (events.length > 0) {
          setActiveEventId(events[0].id);
        }
      }
    } catch (err) {
      console.error('Retry failed; staying in demo fallback mode:', err);
      activateDemoFallback();
    }
  };

  const isPublicPage =
    !isAuthenticated || pathname === '/' || pathname === '/login' || pathname === '/unauthorized';

  if (isPublicPage) {
    return (
      <div className="min-h-screen bg-slate-950 text-ink">
        <main id="main-content" className="w-full">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-ink overflow-hidden font-sans flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-brand-primary text-slate-950 px-4 py-2 rounded font-bold font-mono text-xs z-[9999]"
      >
        Skip to main content
      </a>
      {/* Search Palette command portal */}
      <CommandPalette />

      {/* Demo Mode Blinking top warning header */}
      {isDemoMode && (
        <div className="bg-amber-500 text-slate-950 font-mono text-[10px] font-bold py-1 px-4 text-center tracking-widest uppercase flex items-center justify-center gap-1.5 animate-pulse select-none z-50 shrink-0">
          <span>⚠️</span> DEMO MODE ACTIVE · SIMULATION DATA OVERLAY <span>⚠️</span>
        </div>
      )}

      {/* Main Layout Container */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Sidebar Drawer Overlay */}
        {isMobileOpen && (
          /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
            onClick={() => setIsMobileOpen(false)}
          >
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div className="h-full w-60" onClick={(e) => e.stopPropagation()}>
              <Sidebar
                collapsed={false}
                onToggleCollapse={() => {}}
                onCloseMobile={() => setIsMobileOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Desktop Sidebar (Hidden on mobile) */}
        <div className="hidden md:block h-full shrink-0">
          <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
        </div>

        {/* Main Content Pane */}
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
          {/* Top Header Bar */}
          <header className="h-16 border-b border-white/5 bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 shrink-0 z-30">
            <div className="flex items-center gap-4">
              {/* Mobile Hamburger toggle */}
              <button
                onClick={() => setIsMobileOpen(true)}
                className="md:hidden p-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 text-ink-subdued hover:text-ink cursor-pointer"
                aria-label="Open navigation sidebar"
              >
                <span className="block w-5 h-0.5 bg-current"></span>
                <span className="block w-5 h-0.5 bg-current mt-1.5"></span>
                <span className="block w-5 h-0.5 bg-current mt-1.5"></span>
              </button>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-mono font-bold tracking-wider text-ink-subdued uppercase hidden sm:block">
                  Operations Control
                </h2>
                {isDemoMode && (
                  <span className="text-[9px] font-mono font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 px-1.5 py-0.5 rounded animate-pulse select-none">
                    DEMO
                  </span>
                )}
              </div>
            </div>

            {/* Middle and Right Controls */}
            <div className="flex items-center gap-4">
              {/* Command Palette Trigger tips */}
              <span className="hidden lg:inline-flex items-center gap-1.5 text-4xs font-mono text-ink-subdued/60 bg-white/2 border border-white/5 px-2 py-1 rounded">
                Search{' '}
                <kbd className="border border-white/10 px-1 rounded bg-slate-900">Ctrl + K</kbd>
              </span>

              {/* Venue switcher context */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-ink-subdued uppercase tracking-wider font-mono font-bold hidden md:inline select-none">
                  Venue:
                </span>
                <select
                  value={selectedVenueId}
                  onChange={(e) => handleVenueChange(e.target.value)}
                  className="bg-slate-900 border border-white/10 text-ink text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer font-mono"
                >
                  {venues.map((v) => (
                    <option key={v.id} value={v.id} className="bg-slate-950 text-ink">
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Demo Mode Toggle */}
              <div className="flex items-center gap-2 border-l border-white/5 pl-4 shrink-0">
                <span className="text-[10px] text-ink-subdued uppercase tracking-wider font-mono font-bold hidden sm:inline select-none">
                  Demo Mode
                </span>
                <button
                  onClick={handleToggleDemoMode}
                  className={cn(
                    'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-white/10 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-brand-primary',
                    isDemoMode ? 'bg-amber-500/80 border-amber-500/30' : 'bg-slate-800',
                  )}
                  aria-checked={isDemoMode}
                  role="switch"
                  aria-label="Toggle demo mode simulation overlays"
                >
                  <span
                    className={cn(
                      'pointer-events-none inline-block h-3 w-3 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out mt-[3px] ml-[3px]',
                      isDemoMode ? 'translate-x-4' : 'translate-x-0',
                    )}
                  />
                </button>
              </div>

              {/* Notification Center Centerbell */}
              <NotificationCenter />
            </div>
          </header>

          {/* Viewport Content */}
          <div className="flex-1 overflow-hidden relative flex flex-col bg-slate-950">
            {isNetworkError ? (
              <div className="flex-1 overflow-y-auto px-4 py-16 flex items-center justify-center">
                <ErrorState
                  title="System Connection Interrupted"
                  description="Operations Command service is currently unreachable. The server may be offline or your network link is down."
                  onRetry={handleRetryConnection}
                />
              </div>
            ) : (
              <main
                id="main-content"
                className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 max-w-6xl w-full mx-auto pb-12"
              >
                <Outlet />
              </main>
            )}
          </div>
        </div>
      </div>

      {/* Global Command Center System Status Bar */}
      <footer className="h-9 border-t border-white/5 bg-slate-950 px-4 flex items-center justify-between text-[10px] font-mono text-ink-subdued shrink-0 select-none z-30 relative">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          FLUXGUARD AI OPERATIONS STATUS
        </div>
        <div className="hidden lg:flex items-center gap-6">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> AI Agents Online
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> Database Connected
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> Prediction Engine
            Active
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> WebSocket Connected
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> Autonomous System
            Ready
          </span>
        </div>
        <div>
          Last Sync:{' '}
          <span
            className={cn(
              'font-bold',
              lastSyncSeconds > 10 ? 'text-amber-400' : 'text-emerald-400',
            )}
          >
            {lastSyncSeconds}s
          </span>{' '}
          ago
        </div>
      </footer>
    </div>
  );
}
