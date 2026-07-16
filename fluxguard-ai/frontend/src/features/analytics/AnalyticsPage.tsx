import { useEffect, useState } from 'react';
import { Panel } from '@/components/ui';
import { useSimulationState } from '@/features/simulation/simulationStore';
import { PredictionTimeline } from '../dashboard/components/PredictionTimeline';
import { DashboardHeader } from '../dashboard/components/DashboardHeader';
import type { CrowdZone } from '@/features/simulation/simulationTypes';
import type { PredictionPoint } from '../dashboard/types/dashboard';
import { api } from '@/services/api';
import { InterventionEffectiveness } from './components/InterventionEffectiveness';

const EVENT_ID = 'e0000000-0000-0000-0000-000000000000';

function getPredictionData(zones: CrowdZone[]): PredictionPoint[] {
  const averageDensity = Math.round(
    zones.reduce((total, zone) => total + zone.density, 0) / zones.length,
  );
  const averagePressure = zones.reduce((total, zone) => total + zone.entryRate - zone.exitRate, 0);
  const projectedTwenty = Math.min(
    100,
    Math.max(0, Math.round(averageDensity + averagePressure * 0.18)),
  );
  const projectedForty = Math.min(
    100,
    Math.max(0, Math.round(averageDensity + averagePressure * 0.32)),
  );

  return [
    {
      label: 'Current',
      density: averageDensity,
      forecast: averageDensity,
      confidenceLow: averageDensity,
      confidenceHigh: averageDensity,
    },
    {
      label: '20 min',
      density: averageDensity,
      forecast: projectedTwenty,
      confidenceLow: Math.max(0, projectedTwenty - 8),
      confidenceHigh: Math.min(100, projectedTwenty + 8),
    },
    {
      label: '40 min',
      density: averageDensity,
      forecast: projectedForty,
      confidenceLow: Math.max(0, projectedForty - 14),
      confidenceHigh: Math.min(100, projectedForty + 14),
    },
  ];
}

interface IntegrationState {
  weather: {
    status: string;
    exit_rate_modifier: number;
    description: string;
    temperature_celsius: number;
  };
  transit: {
    status: string;
    next_arrival: string;
    passenger_count: number;
    description: string;
  };
  ticketScans: {
    total_scans_last_minute: number;
    active_turnstiles: number;
    average_scans_per_turnstile: number;
    status: string;
  };
}

export function AnalyticsPage() {
  const simulationState = useSimulationState();
  const predictions = getPredictionData(simulationState.zones);

  const [integrations, setIntegrations] = useState<IntegrationState | null>(null);

  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        const data = await api.fetchIntegrationsStatus(EVENT_ID);
        setIntegrations(data);
      } catch (err) {
        console.error('Failed to load telemetry integrations', err);
      }
    };
    fetchIntegrations();
    const interval = setInterval(fetchIntegrations, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <DashboardHeader />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Forecast Timeline Chart & Effectiveness Panel */}
        <div className="lg:col-span-2 space-y-6">
          <PredictionTimeline predictions={predictions} />
          <InterventionEffectiveness eventId={EVENT_ID} />
        </div>

        {/* Environmental & Transit modifiers */}
        <div className="space-y-6">
          <Panel
            eyebrow="Telemetry Indicators"
            title="Surge Modifiers"
            aria-label="Surge Modifiers"
          >
            <div className="space-y-4">
              {/* Weather info */}
              <div className="rounded-command border border-white/5 bg-white/5 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase text-brand-secondary">
                    Weather Metrics
                  </span>
                  <span className="text-lg">☀️</span>
                </div>
                <div className="text-xl font-bold text-ink">
                  {integrations?.weather.temperature_celsius ?? '--'}°C
                </div>
                <div className="text-xs text-ink-muted mt-1 capitalize">
                  {integrations?.weather.description ?? 'Loading environment...'}
                </div>
              </div>

              {/* Transit surge info */}
              <div className="rounded-command border border-white/5 bg-white/5 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase text-brand-secondary">
                    Transit Pressure
                  </span>
                  <span className="text-lg">🚆</span>
                </div>
                <div className="text-xl font-bold text-ink">
                  {integrations?.transit.passenger_count ?? '--'} Egress Passengers
                </div>
                <div className="text-xs text-ink-muted mt-1">
                  Status:{' '}
                  <span className="capitalize">{integrations?.transit.status ?? 'Loading...'}</span>
                </div>
              </div>

              {/* Ticket Scans */}
              <div className="rounded-command border border-white/5 bg-white/5 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase text-brand-secondary">
                    Ticket Inflow
                  </span>
                  <span className="text-lg">🎫</span>
                </div>
                <div className="text-xl font-bold text-ink">
                  {integrations?.ticketScans.total_scans_last_minute ?? '--'} scans/min
                </div>
                <div className="text-xs text-ink-muted mt-1">
                  {integrations?.ticketScans.active_turnstiles ?? '--'} turnstiles active
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
