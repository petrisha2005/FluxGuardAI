import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { getActiveEventId, useSimulationState } from '../simulation/simulationStore';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';

interface TwinOverview {
  stadiumCapacity: number;
  currentAttendance: number;
  densityPercent: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  activeIncidents: number;
  gateStatus: string;
  emergencyLevel: 'GREEN' | 'YELLOW' | 'RED';
  weather: {
    temp: number;
    rain: string;
    wind: string;
    visibility: string;
    description: string;
  };
}

interface TwinZone {
  id: string;
  name: string;
  density: number;
  capacity: number;
  risk: number;
  status: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  occupancy: number;
  queueLength: number;
  riskScore: number;
  openIncidents: number;
  aiRecommendation: string;
}

interface TwinIncident {
  id: string;
  type: string;
  zoneId: string | null;
  zoneName: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  status: string;
  createdAt: string;
}

interface LiveLog {
  timestamp: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

const RISK_CLASSES = {
  LOW: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5 hover:border-emerald-500/40',
  MEDIUM: 'border-amber-500/20 text-amber-400 bg-amber-500/5 hover:border-amber-500/40',
  HIGH: 'border-rose-500/20 text-rose-400 bg-rose-500/5 hover:border-rose-500/40',
  CRITICAL: 'border-purple-500/20 text-purple-400 bg-purple-500/5 hover:border-purple-500/40',
};

export function CityHubPage() {
  const [overview, setOverview] = useState<TwinOverview | null>(null);
  const [zones, setZones] = useState<TwinZone[]>([]);
  const [incidents, setIncidents] = useState<TwinIncident[]>([]);
  const [liveLogs, setLiveLogs] = useState<LiveLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedZone, setSelectedZone] = useState<TwinZone | null>(null);

  // Layer switches
  const [layers, setLayers] = useState({
    density: true,
    heatmap: false,
    cameras: false,
    emergency: false,
    medical: false,
    security: false,
    entryGates: true,
    exitGates: true,
    transport: false,
    weather: true,
  });
  const layerControls: Array<{ key: keyof typeof layers; label: string }> = [
    { key: 'density', label: 'Crowd Density' },
    { key: 'heatmap', label: 'Heatmap Matrix' },
    { key: 'cameras', label: 'Security Cameras' },
    { key: 'emergency', label: 'Emergency Posts' },
    { key: 'medical', label: 'Medical Units' },
    { key: 'security', label: 'Security Squads' },
    { key: 'entryGates', label: 'Entry Gates' },
    { key: 'exitGates', label: 'Exit Gates' },
    { key: 'transport', label: 'Transit Links' },
    { key: 'weather', label: 'Weather Overlay' },
  ];

  const sim = useSimulationState();
  const eventId = getActiveEventId();

  const fetchDigitalTwinData = async () => {
    try {
      const [ovData, zonesData, incData, , , logsData] = await Promise.all([
        api.fetchDigitalTwinOverview(eventId),
        api.fetchDigitalTwinZones(eventId),
        api.fetchDigitalTwinIncidents(eventId),
        api.fetchDigitalTwinCameras(eventId),
        api.fetchDigitalTwinCrowdFlow(eventId),
        api.fetchDigitalTwinLiveFeed(eventId),
      ]);

      setOverview(ovData);
      setZones(zonesData);
      setIncidents(incData);
      setLiveLogs(logsData);

      // Auto-keep selected zone references fresh
      if (selectedZone) {
        const updatedSelected = zonesData.find((z: TwinZone) => z.name === selectedZone.name);
        if (updatedSelected) {
          setSelectedZone(updatedSelected);
        }
      } else {
        // Default select the most congested/highest risk zone if none selected
        const highRisk = zonesData.find((z: TwinZone) => z.density > 75);
        if (highRisk) {
          setSelectedZone(highRisk);
        }
      }

      setErrorMsg(null);
      setLoading(false);
    } catch (err: unknown) {
      console.error('Digital Twin API fetch error:', err);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Backend endpoint unavailable or returned an invalid schema.',
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchDigitalTwinData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  useEffect(() => {
    // Refresh feed telemetry when the global simulation state increments/ticks
    if (!loading && !errorMsg) {
      fetchDigitalTwinData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sim.tick]);

  const toggleLayer = (layerName: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [layerName]: !prev[layerName] }));
  };

  if (loading) {
    return (
      <div className="space-y-6 text-ink p-2">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-800 rounded animate-pulse" />
          <div className="h-4 w-96 bg-slate-800 rounded animate-pulse" />
        </div>
        <LoadingSkeleton variant="table" count={6} />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <ErrorState
          title="Unable to load Digital Twin"
          description={`Reason: ${errorMsg}`}
          onRetry={() => {
            setLoading(true);
            setErrorMsg(null);
            fetchDigitalTwinData();
          }}
        />
      </div>
    );
  }

  const getZoneDensityColor = (zone?: TwinZone) => {
    if (!zone) {
      return 'fill-slate-900/50 stroke-white/10';
    }

    if (layers.heatmap) {
      if (zone.density > 80) return 'fill-purple-500/40 stroke-purple-500';
      if (zone.density > 60) return 'fill-rose-500/40 stroke-rose-500';
      if (zone.density > 40) return 'fill-amber-500/40 stroke-amber-500';
      return 'fill-emerald-500/40 stroke-emerald-500';
    }
    if (layers.density) {
      if (zone.status === 'CRITICAL') return 'fill-purple-500/20 stroke-purple-500';
      if (zone.status === 'HIGH') return 'fill-rose-500/20 stroke-rose-500';
      if (zone.status === 'MEDIUM') return 'fill-amber-500/20 stroke-amber-500';
      return 'fill-emerald-500/20 stroke-emerald-500';
    }
    return 'fill-slate-900/50 stroke-white/10';
  };

  // Weather risk modifier calculation
  const isRaining =
    overview?.weather.description.toLowerCase().includes('rain') ||
    overview?.weather.description.toLowerCase().includes('shower') ||
    (overview?.weather.rain && parseFloat(overview.weather.rain) > 0);
  const weatherRiskIncrement = isRaining ? 15 : 0;
  const displayRisk = overview ? overview.riskLevel : 'LOW';

  return (
    <div className="space-y-6 text-ink">
      {/* Top Telemetry Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink font-sans uppercase">
            Operations Digital Twin
          </h1>
          <p className="text-xs text-ink-subdued font-mono">
            LIVE VENUE COMMAND POST · 3D ORCHESTRATION & TRANSIT TELEMETRY LAYERS
          </p>
        </div>

        {layers.weather && overview?.weather && (
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/40 border border-white/5 rounded-xl text-xs font-mono">
            <span className="text-lg">🌤</span>
            <div>
              <div className="text-ink font-bold">
                {overview.weather.temp}°C · {overview.weather.description}
              </div>
              <div className="text-ink-subdued text-[10px]">
                Wind: {overview.weather.wind} · Precip: {overview.weather.rain}
              </div>
            </div>
            {isRaining && (
              <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 animate-pulse">
                Weather Alert (+{weatherRiskIncrement}% Risk)
              </span>
            )}
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 font-mono">
        <div className="border border-white/5 bg-slate-900/40 p-4 rounded-xl">
          <div className="text-[9px] uppercase tracking-wider text-ink-subdued">Capacity</div>
          <div className="text-lg font-bold text-ink mt-1">
            {overview?.stadiumCapacity.toLocaleString()}
          </div>
        </div>

        <div className="border border-white/5 bg-slate-900/40 p-4 rounded-xl">
          <div className="text-[9px] uppercase tracking-wider text-ink-subdued">Attendance</div>
          <div className="text-lg font-bold text-brand-primary mt-1">
            {overview?.currentAttendance.toLocaleString()}
          </div>
        </div>

        <div className="border border-white/5 bg-slate-900/40 p-4 rounded-xl">
          <div className="text-[9px] uppercase tracking-wider text-ink-subdued">Avg Density</div>
          <div className="text-lg font-bold text-ink mt-1">{overview?.densityPercent}%</div>
        </div>

        <div className="border border-white/5 bg-slate-900/40 p-4 rounded-xl">
          <div className="text-[9px] uppercase tracking-wider text-ink-subdued">Risk Level</div>
          <div className="mt-1">
            <StatusBadge
              variant={
                displayRisk === 'CRITICAL'
                  ? 'danger'
                  : displayRisk === 'HIGH'
                    ? 'danger'
                    : displayRisk === 'MEDIUM'
                      ? 'warning'
                      : 'success'
              }
            >
              {displayRisk}
            </StatusBadge>
          </div>
        </div>

        <div className="border border-white/5 bg-slate-900/40 p-4 rounded-xl">
          <div className="text-[9px] uppercase tracking-wider text-ink-subdued">Incidents</div>
          <div className="text-lg font-bold text-rose-400 mt-1">
            {overview?.activeIncidents} Active
          </div>
        </div>

        <div className="border border-white/5 bg-slate-900/40 p-4 rounded-xl">
          <div className="text-[9px] uppercase tracking-wider text-ink-subdued">Gate Control</div>
          <div className="text-lg font-bold text-emerald-400 mt-1">{overview?.gateStatus}</div>
        </div>

        <div className="border border-white/5 bg-slate-900/40 p-4 rounded-xl">
          <div className="text-[9px] uppercase tracking-wider text-ink-subdued">Emergency</div>
          <div className="mt-1">
            <span
              className={`inline-block h-3.5 w-3.5 rounded-full ${
                overview?.emergencyLevel === 'RED'
                  ? 'bg-rose-500 animate-ping'
                  : overview?.emergencyLevel === 'YELLOW'
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
              }`}
            />
          </div>
        </div>

        <div className="border border-white/5 bg-slate-900/40 p-4 rounded-xl">
          <div className="text-[9px] uppercase tracking-wider text-ink-subdued">Sensors</div>
          <div className="text-lg font-bold text-cyan-400 mt-1">100% OK</div>
        </div>
      </div>

      {/* Main Orchestration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: SVG Map + Layer Switches */}
        <div className="lg:col-span-8 space-y-6">
          <div className="relative border border-white/5 bg-slate-950 p-6 rounded-2xl flex flex-col justify-center items-center min-h-[420px] overflow-hidden">
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:30px_30px]"></div>

            {/* Stadium Visual Model */}
            <svg viewBox="0 0 500 400" className="w-full max-w-[440px] h-auto z-10">
              {/* Parking Lot Outer Area */}
              <rect
                x="10"
                y="10"
                width="80"
                height="60"
                rx="8"
                className={`transition-all duration-300 stroke-2 stroke-dashed ${
                  selectedZone?.name === 'Parking Lot'
                    ? 'stroke-brand-primary fill-brand-primary/5'
                    : 'stroke-white/10 fill-none'
                } cursor-pointer`}
                onClick={() => setSelectedZone(zones.find((z) => z.name === 'Parking Lot') || null)}
              />
              <text
                x="50"
                y="45"
                textAnchor="middle"
                className="fill-ink-subdued text-[8px] font-mono pointer-events-none select-none font-bold"
              >
                PARKING
              </text>

              {/* Main Stadium Outer Boundary */}
              <rect
                x="80"
                y="50"
                width="340"
                height="300"
                rx="140"
                className="fill-none stroke-white/5 stroke-2"
              />

              {/* Inner Pitch */}
              <rect
                x="170"
                y="140"
                width="160"
                height="120"
                rx="40"
                className="fill-emerald-950/20 stroke-white/5 stroke-1"
              />
              <text
                x="250"
                y="205"
                textAnchor="middle"
                className="fill-white/10 text-[9px] tracking-widest font-mono pointer-events-none select-none"
              >
                PITCH
              </text>

              {/* North Stand */}
              <path
                d="M 170,70 L 330,70 A 130,130 0 0,1 390,140 L 250,200 L 110,140 A 130,130 0 0,1 170,70 Z"
                className={`cursor-pointer transition-all duration-300 stroke-2 ${
                  selectedZone?.name === 'North Stand'
                    ? 'stroke-brand-primary fill-brand-primary/10'
                    : getZoneDensityColor(zones.find((z) => z.name === 'North Stand'))
                }`}
                onClick={() => setSelectedZone(zones.find((z) => z.name === 'North Stand') || null)}
              />

              {/* East Stand */}
              <path
                d="M 390,140 A 130,130 0 0,1 430,260 L 330,260 L 250,200 L 390,140 Z"
                className={`cursor-pointer transition-all duration-300 stroke-2 ${
                  selectedZone?.name === 'East Stand'
                    ? 'stroke-brand-primary fill-brand-primary/10'
                    : getZoneDensityColor(zones.find((z) => z.name === 'East Stand'))
                }`}
                onClick={() => setSelectedZone(zones.find((z) => z.name === 'East Stand') || null)}
              />

              {/* Gate C (South Stand) */}
              <path
                d="M 110,260 A 130,130 0 0,1 170,330 L 330,330 A 130,130 0 0,1 390,260 L 250,200 Z"
                className={`cursor-pointer transition-all duration-300 stroke-2 ${
                  selectedZone?.name === 'Gate C'
                    ? 'stroke-brand-primary fill-brand-primary/10'
                    : getZoneDensityColor(zones.find((z) => z.name === 'Gate C'))
                }`}
                onClick={() => setSelectedZone(zones.find((z) => z.name === 'Gate C') || null)}
              />

              {/* West Stand (West Entrance) */}
              <path
                d="M 70,160 A 130,130 0 0,1 110,260 L 250,200 L 110,140 A 130,130 0 0,1 70,160 Z"
                className={`cursor-pointer transition-all duration-300 stroke-2 ${
                  selectedZone?.name === 'West Stand'
                    ? 'stroke-brand-primary fill-brand-primary/10'
                    : getZoneDensityColor(zones.find((z) => z.name === 'West Stand'))
                }`}
                onClick={() => setSelectedZone(zones.find((z) => z.name === 'West Stand') || null)}
              />

              {/* Concourse (Inner Circle Corridor) */}
              <rect
                x="130"
                y="100"
                width="240"
                height="200"
                rx="90"
                className={`cursor-pointer fill-none stroke-2 transition-all duration-300 ${
                  selectedZone?.name === 'Concourse' ? 'stroke-brand-primary' : 'stroke-cyan-500/20'
                }`}
                onClick={() => setSelectedZone(zones.find((z) => z.name === 'Concourse') || null)}
              />

              {/* Labels */}
              <text
                x="250"
                y="95"
                textAnchor="middle"
                className="fill-ink text-[8px] font-bold pointer-events-none select-none font-mono"
              >
                NORTH STAND
              </text>
              <text
                x="360"
                y="200"
                textAnchor="middle"
                className="fill-ink text-[8px] font-bold pointer-events-none select-none font-mono"
              >
                EAST STAND
              </text>
              <text
                x="250"
                y="310"
                textAnchor="middle"
                className="fill-ink text-[8px] font-bold pointer-events-none select-none font-mono"
              >
                GATE C
              </text>
              <text
                x="140"
                y="200"
                textAnchor="middle"
                className="fill-ink text-[8px] font-bold pointer-events-none select-none font-mono"
              >
                WEST STAND
              </text>

              {/* Crowd Flow Animated Arrows */}
              <g className="opacity-60">
                {/* Gate C to Concourse Flow */}
                <path
                  d="M 250,330 L 250,280"
                  fill="none"
                  stroke="rgba(56, 189, 248, 0.8)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  className="animate-[dash_2s_linear_infinite]"
                />

                {/* North Stand Flow */}
                <path
                  d="M 250,70 L 250,110"
                  fill="none"
                  stroke="rgba(56, 189, 248, 0.8)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  className="animate-[dash_2s_linear_infinite]"
                />
              </g>

              {/* Layer Overlay: Cameras */}
              {layers.cameras && (
                <g className="fill-cyan-400">
                  <circle cx="250" cy="115" r="4" className="animate-pulse" />
                  <circle cx="350" cy="200" r="4" className="animate-pulse" />
                  <circle cx="250" cy="285" r="4" className="animate-pulse" />
                  <circle cx="150" cy="200" r="4" className="animate-pulse" />
                </g>
              )}

              {/* Layer Overlay: Incidents (Pulsing Warning Circles) */}
              {incidents.length > 0 && (
                <g className="cursor-pointer">
                  {incidents.map((inc) => {
                    let cx = 250;
                    let cy = 200;
                    if (inc.zoneName === 'North Stand') {
                      cx = 250;
                      cy = 110;
                    } else if (inc.zoneName === 'East Stand') {
                      cx = 350;
                      cy = 200;
                    } else if (inc.zoneName === 'Gate C') {
                      cx = 250;
                      cy = 280;
                    } else if (inc.zoneName === 'West Stand') {
                      cx = 150;
                      cy = 200;
                    }

                    return (
                      <g key={inc.id}>
                        <circle
                          cx={cx}
                          cy={cy}
                          r="12"
                          className="fill-rose-500/10 stroke-rose-500 animate-ping opacity-60"
                        />
                        <circle
                          cx={cx}
                          cy={cy}
                          r="6"
                          className="fill-rose-500 stroke-white/20 stroke-2"
                        />
                        <title>
                          {inc.type}: {inc.description}
                        </title>
                      </g>
                    );
                  })}
                </g>
              )}
            </svg>
          </div>

          {/* Dynamic Layer Switch Toggles */}
          <div className="border border-white/5 bg-slate-900/40 p-5 rounded-2xl font-mono">
            <div className="text-2xs text-ink-subdued uppercase tracking-wider mb-3">
              Overlay Display Layer Controls
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {layerControls.map((item) => (
                <button
                  key={item.key}
                  onClick={() => toggleLayer(item.key)}
                  className={`px-3 py-2 rounded-lg text-3xs font-bold border transition-all duration-200 text-left flex items-center justify-between ${
                    layers[item.key]
                      ? 'border-brand-primary/40 text-brand-primary bg-brand-primary/5'
                      : 'border-white/5 text-ink-subdued hover:text-ink hover:bg-white/5'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className={layers[item.key] ? 'text-brand-primary' : 'text-slate-800'}>
                    ●
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: AI Insights + Selected Stand Diagnostic */}
        <div className="lg:col-span-4 space-y-6">
          {/* AI Insights Card */}
          <div className="border border-purple-500/20 bg-purple-500/5 p-5 rounded-2xl font-mono space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">🤖</span>
              <div>
                <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wide">
                  AI Operations Directive
                </h3>
                <span className="text-[9px] text-purple-500/70 font-semibold">
                  COGNITIVE SUMMARY · CONFIDENCE: 94%
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[9px] text-purple-400/80 block uppercase">
                  Situation Overview
                </span>
                <p className="text-ink leading-relaxed">
                  Gate C ingress spikes are creating a local transit backpressure corridor.
                  Bottleneck risks are highlighted.
                </p>
              </div>

              <div>
                <span className="text-[9px] text-purple-400/80 block uppercase">
                  Recommended Intervention
                </span>
                <p className="text-purple-300 font-bold">
                  Divert incoming spectator flux to West Stand corridors. Activate turnstiles 11-14.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-purple-500/20 text-3xs">
                <div>
                  <span className="text-purple-400/80 block uppercase">Recovery ETA</span>
                  <span className="font-bold text-ink">9 Minutes</span>
                </div>
                <div>
                  <span className="text-purple-400/80 block uppercase">Expected Outcome</span>
                  <span className="font-bold text-ink">Egress Clearance +32%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Stand Telemetry Dashboard */}
          <div className="border border-white/5 bg-slate-900/40 p-5 rounded-2xl font-mono min-h-[260px] flex flex-col justify-between">
            {selectedZone ? (
              <div className="space-y-4">
                <div className="border-b border-white/5 pb-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-ink-subdued uppercase tracking-widest block font-bold">
                      Telemetry Diagnostics
                    </span>
                    <span
                      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[8px] font-bold ${RISK_CLASSES[selectedZone.status]}`}
                    >
                      {selectedZone.status}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-ink uppercase mt-1">
                    {selectedZone.name}
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-ink-subdued text-3xs uppercase block">
                      Occupancy Count
                    </span>
                    <span className="text-sm font-bold text-ink">
                      {selectedZone.occupancy.toLocaleString()} /{' '}
                      {selectedZone.capacity.toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-ink-subdued text-3xs uppercase block">Load density</span>
                    <span className="text-sm font-bold text-brand-primary">
                      {selectedZone.density}%
                    </span>
                  </div>

                  <div>
                    <span className="text-ink-subdued text-3xs uppercase block">
                      Queue Wait Time
                    </span>
                    <span className="text-sm font-bold text-ink">
                      {selectedZone.queueLength} Mins
                    </span>
                  </div>

                  <div>
                    <span className="text-ink-subdued text-3xs uppercase block">
                      Active Incidents
                    </span>
                    <span
                      className={`text-sm font-bold ${selectedZone.openIncidents > 0 ? 'text-rose-400' : 'text-emerald-400'}`}
                    >
                      {selectedZone.openIncidents} Reported
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5">
                  <span className="text-ink-subdued text-3xs uppercase block">
                    Predictive AI Action Plan
                  </span>
                  <p className="text-[10px] text-brand-secondary leading-relaxed mt-1">
                    {selectedZone.aiRecommendation}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-ink-subdued text-[11px] p-6 leading-relaxed">
                <span className="text-2xl mb-2">🏟</span>
                Click on any stand, gate corridor, or parking section in the stadium SVG graphic map
                to inspect active telemetry.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Live Operations Ticker Log */}
      <div className="border border-white/5 bg-slate-900/40 p-5 rounded-2xl font-mono">
        <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
            <h3 className="text-2xs font-bold text-ink uppercase tracking-wider">
              Real-Time Operations Feed Logs
            </h3>
          </div>
          <span className="text-3xs text-ink-subdued uppercase">
            Auto-refreshing every 5 seconds
          </span>
        </div>

        <div className="space-y-2">
          {liveLogs.length > 0 ? (
            liveLogs.map((log, i) => (
              <div
                key={i}
                className="flex justify-between items-center text-3xs border-b border-white/3 py-1.5 last:border-b-0 hover:bg-white/1"
              >
                <div className="flex items-center gap-3">
                  <span className="text-ink-subdued font-bold">[{log.timestamp}]</span>
                  <span className="text-ink">{log.message}</span>
                </div>
                <span
                  className={`inline-flex items-center rounded px-1.5 py-0.5 text-[8px] font-bold border ${
                    log.severity === 'CRITICAL'
                      ? 'border-purple-500/20 text-purple-400 bg-purple-500/5'
                      : log.severity === 'HIGH'
                        ? 'border-rose-500/20 text-rose-400 bg-rose-500/5'
                        : log.severity === 'MEDIUM'
                          ? 'border-amber-500/20 text-amber-400 bg-amber-500/5'
                          : 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5'
                  }`}
                >
                  {log.severity}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center text-3xs text-ink-subdued py-4">
              No active operations feed logs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
