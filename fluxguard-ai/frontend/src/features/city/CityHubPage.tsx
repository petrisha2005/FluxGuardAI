import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { setActiveEventId, useSimulationState } from '../simulation/simulationStore';

interface VenueStatus {
  id: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  activeEventName: string;
  activeEventId: string;
  averageDensity: number;
  activeIncidentsCount: number;
  activeAlertsCount: number;
  totalCapacity: number;
  totalStewards: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

const mapLatitudeBounds = { min: -15.44, max: -15.4 };
const mapLongitudeBounds = { min: 28.26, max: 28.32 };

function getMapCoordinates(lat: number, lng: number) {
  const x =
    ((lng - mapLongitudeBounds.min) / (mapLongitudeBounds.max - mapLongitudeBounds.min)) * 100;
  const y = ((mapLatitudeBounds.max - lat) / (mapLatitudeBounds.max - mapLatitudeBounds.min)) * 100;
  return { x: Math.max(10, Math.min(90, x)), y: Math.max(10, Math.min(90, y)) };
}

const RISK_COLORS = {
  LOW: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 glow-emerald-500',
  MEDIUM: 'text-amber-400 bg-amber-500/10 border-amber-500/20 glow-amber-500',
  HIGH: 'text-rose-400 bg-rose-500/10 border-rose-500/20 glow-rose-500',
  CRITICAL: 'text-purple-400 bg-purple-500/10 border-purple-500/20 glow-purple-500',
};

const RISK_PULSES = {
  LOW: 'bg-emerald-500',
  MEDIUM: 'bg-amber-500',
  HIGH: 'bg-rose-500',
  CRITICAL: 'bg-purple-500',
};

export function CityHubPage() {
  const [venuesStatus, setVenuesStatus] = useState<VenueStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  // Listen to simulation state so that background simulation updates prompt a city overview reload
  const sim = useSimulationState();

  const fetchCityOverviewData = async () => {
    try {
      const venues = await api.fetchVenues();
      const statusList: VenueStatus[] = await Promise.all(
        venues.map(async (venue) => {
          const events = await api.fetchEventsByVenue(venue.id);
          const activeEvent = events[0] || { id: '', name: 'No Active Event' };

          let averageDensity = 0;
          let activeIncidentsCount = 0;
          let activeAlertsCount = 0;
          let totalCapacity = 0;
          let totalStewards = 0;
          let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';

          if (activeEvent.id) {
            const [zones, riskScores, alerts, staffing] = await Promise.all([
              api.fetchZones(activeEvent.id),
              api.fetchRiskScores(activeEvent.id),
              api.fetchAlerts(activeEvent.id),
              api.getStaffingStatus(activeEvent.id),
            ]);

            // Calculate metrics
            totalCapacity = zones.reduce((acc, z) => acc + z.capacity, 0);
            activeIncidentsCount = alerts.filter((a) => a.status === 'unacknowledged').length;
            activeAlertsCount = alerts.length;

            if (zones.length > 0) {
              const densities = zones.map((z) => {
                // Read from local live simulation zones if this is currently the active event
                const liveZone = sim.zones.find((lz) => lz.name === z.name);
                return liveZone ? liveZone.density : 45;
              });
              averageDensity = Math.round(densities.reduce((acc, d) => acc + d, 0) / zones.length);
            }

            // Determine highest risk level
            if (riskScores.length > 0) {
              const severities = riskScores.map((s) => s.severity.toUpperCase());
              if (severities.includes('CRITICAL')) riskLevel = 'CRITICAL';
              else if (severities.includes('HIGH')) riskLevel = 'HIGH';
              else if (severities.includes('MEDIUM')) riskLevel = 'MEDIUM';
            }

            if (staffing && staffing.currentStaff) {
              totalStewards = Object.values(staffing.currentStaff).reduce(
                (acc, val) => acc + val,
                0,
              );
            }
          }

          const lat = venue.metadata?.latitude ?? -15.4167;
          const lng = venue.metadata?.longitude ?? 28.2833;

          return {
            id: venue.id,
            name: venue.name,
            city: venue.city,
            country: venue.country,
            latitude: lat,
            longitude: lng,
            activeEventName: activeEvent.name,
            activeEventId: activeEvent.id,
            averageDensity,
            activeIncidentsCount,
            activeAlertsCount,
            totalCapacity,
            totalStewards,
            riskLevel,
          };
        }),
      );
      setVenuesStatus(statusList);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load city overview data:', err);
    }
  };

  useEffect(() => {
    fetchCityOverviewData();
    // Refresh city data every 5 seconds
    const interval = setInterval(fetchCityOverviewData, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sim.tick]);

  const handleControlVenue = (eventId: string) => {
    setActiveEventId(eventId);
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
      </div>
    );
  }

  // Calculate aggregates
  const totalActiveIncidents = venuesStatus.reduce((acc, v) => acc + v.activeIncidentsCount, 0);
  const totalAlerts = venuesStatus.reduce((acc, v) => acc + v.activeAlertsCount, 0);
  const totalCityStewards = venuesStatus.reduce((acc, v) => acc + v.totalStewards, 0);
  const worstRisk = venuesStatus.some((v) => v.riskLevel === 'CRITICAL')
    ? 'CRITICAL'
    : venuesStatus.some((v) => v.riskLevel === 'HIGH')
      ? 'HIGH'
      : venuesStatus.some((v) => v.riskLevel === 'MEDIUM')
        ? 'MEDIUM'
        : 'LOW';

  return (
    <div className="space-y-8 text-ink">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-ink">City Command Center</h1>
        <p className="text-sm text-ink-muted">
          Multi-venue orchestration and transit flow hub for tournament operations.
        </p>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/5 bg-surface-elevated/40 p-5 backdrop-blur">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Active Venues
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold">{venuesStatus.length}</span>
            <span className="text-xs text-emerald-400">● Live</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-surface-elevated/40 p-5 backdrop-blur">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            City Alerts
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold">{totalAlerts}</span>
            {totalAlerts > 0 ? (
              <span className="text-xs text-rose-400">▲ Action Required</span>
            ) : (
              <span className="text-xs text-emerald-400">✓ Stable</span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-surface-elevated/40 p-5 backdrop-blur">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Active Safety Incidents
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold">{totalActiveIncidents}</span>
            {totalActiveIncidents > 0 ? (
              <span className="text-xs text-amber-400">⚠️ Responders Dispatched</span>
            ) : (
              <span className="text-xs text-emerald-400">✓ Zero Tickets</span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-surface-elevated/40 p-5 backdrop-blur">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Active Stewards Deployed
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold">{totalCityStewards}</span>
            <span className="text-xs text-ink-muted">across all zones</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Map & Venues comparative performance */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Geographic Map Widget */}
        <div className="lg:col-span-1 rounded-2xl border border-white/5 bg-surface-elevated/20 p-6 flex flex-col gap-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">Geographic Operations Map</h2>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${RISK_COLORS[worstRisk]}`}
            >
              Status: {worstRisk}
            </span>
          </div>

          <div className="relative aspect-square w-full rounded-xl border border-white/5 bg-[#0b0c10] overflow-hidden flex items-center justify-center shadow-inner">
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            {/* SVG Map details */}
            <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
              {/* Fake Transit Routes */}
              <path
                d="M 10 50 Q 50 40 90 50"
                fill="none"
                stroke="rgba(56, 189, 248, 0.15)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <path
                d="M 50 10 L 50 90"
                fill="none"
                stroke="rgba(168, 85, 247, 0.15)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              {/* Plot Venue Markers */}
              {venuesStatus.map((v) => {
                const { x, y } = getMapCoordinates(v.latitude, v.longitude);
                return (
                  <g
                    key={v.id}
                    className="cursor-pointer"
                    onClick={() => handleControlVenue(v.activeEventId)}
                  >
                    {/* Pulsing ring */}
                    <circle
                      cx={`${x}%`}
                      cy={`${y}%`}
                      r="16"
                      className={`animate-ping opacity-25 ${RISK_PULSES[v.riskLevel]}`}
                    />
                    {/* Anchor point */}
                    <circle
                      cx={`${x}%`}
                      cy={`${y}%`}
                      r="8"
                      className={`${RISK_PULSES[v.riskLevel]} stroke-white/20`}
                      strokeWidth="2"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Label anchors */}
            {venuesStatus.map((v) => {
              const { x, y } = getMapCoordinates(v.latitude, v.longitude);
              return (
                <div
                  key={v.id}
                  style={{ left: `${x}%`, top: `${y + 4}%` }}
                  className="absolute -translate-x-1/2 rounded bg-surface/90 border border-white/5 px-2 py-0.5 text-[9px] font-semibold text-ink backdrop-blur shadow"
                >
                  {v.name.split(' ')[0]}
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 text-2xs text-ink-muted justify-center border-t border-white/5 pt-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Low
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span> Medium
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500"></span> High
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-purple-500"></span> Critical
            </div>
          </div>
        </div>

        {/* Venues Status Grid */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h2 className="text-lg font-bold tracking-tight">Active Venues Performance</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {venuesStatus.map((v) => (
              <div
                key={v.id}
                className="flex flex-col justify-between rounded-2xl border border-white/5 bg-surface-elevated/20 p-5 backdrop-blur hover:border-white/10 transition-all duration-200"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-ink text-base">{v.name}</h3>
                      <p className="text-2xs text-ink-muted">
                        {v.city}, {v.country}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-semibold border ${RISK_COLORS[v.riskLevel]}`}
                    >
                      {v.riskLevel}
                    </span>
                  </div>

                  <div className="border-t border-white/5 pt-3 space-y-2">
                    <div>
                      <div className="text-3xs uppercase tracking-wider text-ink-muted">
                        Active Event
                      </div>
                      <div className="text-xs font-semibold text-brand-primary truncate">
                        {v.activeEventName}
                      </div>
                    </div>

                    {/* Density Meter */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-3xs uppercase tracking-wider text-ink-muted">
                        <span>Average Density</span>
                        <span className="font-semibold text-ink">{v.averageDensity}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                        <div
                          style={{ width: `${v.averageDensity}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${
                            v.averageDensity > 80
                              ? 'bg-rose-500'
                              : v.averageDensity > 60
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                          }`}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-3">
                    <div className="text-center rounded bg-white/5 p-1.5">
                      <div className="text-3xs uppercase text-ink-muted">Stewards</div>
                      <div className="text-sm font-bold text-ink">{v.totalStewards}</div>
                    </div>
                    <div className="text-center rounded bg-white/5 p-1.5">
                      <div className="text-3xs uppercase text-ink-muted">Incidents</div>
                      <div className="text-sm font-bold text-amber-400">
                        {v.activeIncidentsCount}
                      </div>
                    </div>
                    <div className="text-center rounded bg-white/5 p-1.5">
                      <div className="text-3xs uppercase text-ink-muted">Capacity</div>
                      <div className="text-sm font-bold text-ink">
                        {(v.totalCapacity / 1000).toFixed(1)}k
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <button
                    onClick={() => handleControlVenue(v.activeEventId)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-brand-primary hover:bg-brand-primary-hover px-3 py-2 text-xs font-bold text-black transition-all duration-200 shadow-md shadow-brand-primary/10"
                  >
                    Control Command
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
