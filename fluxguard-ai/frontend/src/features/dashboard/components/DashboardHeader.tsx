import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

import { Badge, StatusIndicator } from '@/components/ui';
import { api } from '@/services/api';

const EVENT_ID = 'e0000000-0000-0000-0000-000000000000';

export function DashboardHeader() {
  const [integrations, setIntegrations] = useState<{
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
  } | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await api.fetchIntegrationsStatus(EVENT_ID);
        setIntegrations(response);
      } catch (err) {
        console.warn('Failed to fetch integrations status:', err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between border-b border-white/10 pb-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="info">Enriched operations v2.0</Badge>
          <StatusIndicator
            state="amber"
            label="Live simulation"
            accessibilityText="Dashboard is using live simulated operations data"
          />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Operations Command Center
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted sm:text-base">
            Enriched with external real-time indicators.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {/* Weather Indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 rounded-command border border-white/10 bg-white/5 px-4 py-3 min-w-[180px]"
        >
          <div className="text-2xl" aria-hidden="true">
            {integrations?.weather.status === 'rainy'
              ? '🌧️'
              : integrations?.weather.status === 'stormy'
                ? '⛈️'
                : '☀️'}
          </div>
          <div className="space-y-0.5">
            <span className="block text-3xs font-semibold uppercase text-ink-subdued">Weather</span>
            <span className="block text-xs font-bold text-ink">
              {integrations?.weather.temperature_celsius}°C ·{' '}
              <span className="capitalize">{integrations?.weather.status || 'Clear'}</span>
            </span>
            <span className="block text-4xs text-ink-muted">
              {integrations?.weather.status !== 'clear'
                ? `Flow scale: ${integrations?.weather.exit_rate_modifier}`
                : 'Normal flow speed'}
            </span>
          </div>
        </motion.div>

        {/* Transit Surges Indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="flex items-center gap-3 rounded-command border border-white/10 bg-white/5 px-4 py-3 min-w-[180px]"
        >
          <div className="text-2xl" aria-hidden="true">
            🚆
          </div>
          <div className="space-y-0.5">
            <span className="block text-3xs font-semibold uppercase text-ink-subdued">Transit</span>
            <span className="block text-xs font-bold text-ink">
              {integrations?.transit.status === 'arriving' ? (
                <span className="text-amber-400 animate-pulse">Train Arrived (+450)</span>
              ) : (
                `Next train: ${integrations?.transit.next_arrival || 'loading'}`
              )}
            </span>
            <span className="block text-4xs text-ink-muted">
              {integrations?.transit.status === 'arriving'
                ? 'Wave approaching Gate C'
                : 'Terminal gates normal'}
            </span>
          </div>
        </motion.div>

        {/* Ticketing scans Indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-3 rounded-command border border-white/10 bg-white/5 px-4 py-3 min-w-[180px]"
        >
          <div className="text-2xl" aria-hidden="true">
            🎫
          </div>
          <div className="space-y-0.5">
            <span className="block text-3xs font-semibold uppercase text-ink-subdued">
              Turnstiles
            </span>
            <span className="block text-xs font-bold text-ink">
              {integrations?.ticketScans.total_scans_last_minute || 0} scans/min
            </span>
            <span className="block text-4xs text-ink-muted">
              {integrations?.ticketScans.active_turnstiles || 0} turnstiles active
            </span>
          </div>
        </motion.div>
      </div>
    </header>
  );
}
