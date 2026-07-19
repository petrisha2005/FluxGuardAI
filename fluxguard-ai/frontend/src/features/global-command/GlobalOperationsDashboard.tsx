import { useEffect, useState } from 'react';
import { Panel } from '@/components/ui';
import { StadiumNetworkMap } from './StadiumNetworkMap';
import { StadiumRiskOverview } from './StadiumRiskOverview';
import { EventStatusPanel } from './EventStatusPanel';
import { GlobalAlertFeed } from './GlobalAlertFeed';
import { CityTwinMap } from '../city-twin/CityTwinMap';
import { TransportHeatmap } from '../city-twin/TransportHeatmap';
import { FanZoneMonitor } from '../city-twin/FanZoneMonitor';
import { TrafficFlowLayer } from '../city-twin/TrafficFlowLayer';
import { RoleGuard } from '@/features/auth';
interface Stadium {
  id: string;
  name: string;
  city: string;
  country: string;
  capacity: number;
  currentAttendance: number;
  riskLevel: string;
  predictionStatus: string;
}

interface AlertItem {
  id: string;
  source: string;
  type: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  timestamp: string;
}

interface DispatchResult {
  priority: string;
  actions: string[];
}

export function GlobalOperationsDashboard() {
  const [stadiums, setStadiums] = useState<Stadium[]>([]);
  const [selectedStadium, setSelectedStadium] = useState<Stadium | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [emergencyInput, setEmergencyInput] = useState('');
  const [dispatchResult, setDispatchResult] = useState<DispatchResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 1. Fetch stadiums
    fetch('/api/stadiums')
      .then((res) => res.json())
      .then((payload) => {
        const rawStadiums = Array.isArray(payload.data) ? payload.data : [];
        setStadiums(rawStadiums);
        if (rawStadiums.length > 0) {
          setSelectedStadium(rawStadiums[0]);
        }
      })
      .catch((err) => console.warn('Failed to load global stadiums:', err));

    // 2. Mock alerts
    setAlerts([
      {
        id: '1',
        source: 'Lusaka Stadium',
        type: 'Crowd Congestion',
        message: 'North gate capacity exceeded limits.',
        severity: 'high',
        timestamp: '14:24',
      },
      {
        id: '2',
        source: 'City Arena',
        type: 'Transit Delay',
        message: 'Metro line 2 operating with 12 min headway.',
        severity: 'medium',
        timestamp: '14:15',
      },
    ]);
  }, []);

  const handleDispatch = () => {
    if (!emergencyInput.trim()) return;
    setLoading(true);
    fetch('/api/emergency/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incidentDescription: emergencyInput }),
    })
      .then((res) => res.json())
      .then((payload) => {
        setDispatchResult(payload.data || null);
        if (payload.data) {
          const rawPriority = String(payload.data.priority).toLowerCase();
          const mappedSeverity: 'high' | 'medium' | 'low' =
            rawPriority === 'high' || rawPriority === 'medium' || rawPriority === 'low'
              ? (rawPriority as 'high' | 'medium' | 'low')
              : 'low';

          const newAlert: AlertItem = {
            id: Date.now().toString(),
            source: 'Emergency Dispatch',
            type: 'Dispatch Action',
            message: `Priority: ${payload.data.priority} - ${payload.data.actions.join(', ')}`,
            severity: mappedSeverity,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setAlerts((prev) => [newAlert, ...prev]);
        }
      })
      .catch((err) => console.warn('Emergency dispatch failed:', err))
      .finally(() => {
        setLoading(false);
        setEmergencyInput('');
      });
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-semibold uppercase tracking-wide border-brand-primary/50 bg-brand-primary/10 text-sky-100">
              FIFA 2026 Enterprise Command Center
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Global Operations Network
          </h1>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            City-scale crowd monitoring, emergency coordination, and multi-stadium operations
            metrics.
          </p>
        </div>
      </header>

      {/* Global alert input dispatcher */}
      <RoleGuard
        allowedRoles={['SECURITY_SUPERVISOR', 'STADIUM_MANAGER', 'SUPER_ADMIN']}
        fallback={
          <Panel eyebrow="Emergency Coordinator" title="AI Emergency Dispatch System">
            <div className="text-xs font-mono text-ink-subdued py-4 uppercase text-center border border-dashed border-white/5 rounded-md">
              ⚠ Insufficient clearance level to dispatch emergency resources.
            </div>
          </Panel>
        }
      >
        <Panel eyebrow="Emergency Coordinator" title="AI Emergency Dispatch System">
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="E.g. Medical emergency near Gate C, fire alarm in Sector 4..."
                value={emergencyInput}
                onChange={(e) => setEmergencyInput(e.target.value)}
                className="flex-1 bg-surface border border-white/5 rounded px-3 py-2 text-xs text-ink placeholder-ink-subdued focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
              <button
                onClick={handleDispatch}
                disabled={loading}
                className="bg-brand-primary hover:bg-brand-primary/85 text-slate-950 font-bold uppercase px-4 py-2.5 rounded transition-all text-[10px]"
              >
                {loading ? 'Dispatched...' : 'Trigger Dispatch'}
              </button>
            </div>
            {dispatchResult && (
              <div className="p-3 bg-surface border border-white/5 rounded space-y-1.5">
                <div className="flex justify-between text-[9px] uppercase tracking-wider text-brand-primary font-bold">
                  <span>Dispatch Result</span>
                  <span className="text-risk-critical animate-pulse">
                    Priority: {dispatchResult.priority}
                  </span>
                </div>
                <ul className="space-y-1 text-ink-muted">
                  {dispatchResult.actions.map((act: string, i: number) => (
                    <li key={i}>✓ {act}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Panel>
      </RoleGuard>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Left column: SVG Network Map and Risk overview */}
        <div className="md:col-span-8 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <StadiumNetworkMap
              stadiums={stadiums}
              onSelectStadium={setSelectedStadium}
              selectedStadiumId={selectedStadium?.id}
            />
            <StadiumRiskOverview
              stadiums={stadiums}
              onSelectStadium={setSelectedStadium}
              selectedStadiumId={selectedStadium?.id}
            />
          </div>

          <CityTwinMap />
        </div>

        {/* Right column: feeds, heats and schedules */}
        <div className="md:col-span-4 space-y-6">
          <EventStatusPanel />
          <TransportHeatmap />
          <FanZoneMonitor />
          <TrafficFlowLayer />
          <GlobalAlertFeed alerts={alerts} />
        </div>
      </div>
    </div>
  );
}
