import { motion } from 'framer-motion';

import { Badge, Panel, StatusIndicator } from '@/components/ui';
import { cn } from '@/utils/classNames';
import type { StadiumZone, ZoneTrend } from '../types/dashboard';

export interface CrowdZonePanelProps {
  zones: StadiumZone[];
}

const trendLabel: Record<ZoneTrend, string> = {
  rising: 'Rising',
  stable: 'Stable',
  falling: 'Falling',
};

const trendClass: Record<ZoneTrend, string> = {
  rising: 'text-risk-warning',
  stable: 'text-brand-secondary',
  falling: 'text-risk-safe',
};

const riskBadgeVariant: Record<StadiumZone['riskState'], 'safe' | 'warning' | 'critical'> = {
  green: 'safe',
  amber: 'warning',
  red: 'critical',
};

export function CrowdZonePanel({ zones }: CrowdZonePanelProps) {
  return (
    <Panel eyebrow="Crowd zones" title="Live stadium zones" aria-label="Crowd zone status panel">
      <div className="grid gap-3 md:grid-cols-2">
        {zones.map((zone, index) => (
          <motion.article
            key={zone.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16, delay: index * 0.03, ease: 'easeOut' }}
            className="rounded-command border border-white/10 bg-white/5 p-4"
            aria-labelledby={`${zone.id}-title`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id={`${zone.id}-title`} className="font-semibold text-ink">
                  {zone.name}
                </h3>
                <StatusIndicator
                  state={zone.riskState}
                  accessibilityText={`${zone.name} risk state is ${zone.riskState}`}
                  className="mt-2"
                />
              </div>
              <Badge variant={riskBadgeVariant[zone.riskState]}>{zone.riskState}</Badge>
            </div>
            <div className="mt-4" aria-label={`${zone.name} density ${zone.densityPercentage}%`}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-ink-muted">Density</span>
                <span className="font-semibold text-ink">{zone.densityPercentage}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-brand-primary"
                  style={{ width: `${zone.densityPercentage}%` }}
                />
              </div>
            </div>
            <p className={cn('mt-3 text-sm font-medium', trendClass[zone.trend])}>
              Trend: {trendLabel[zone.trend]}
            </p>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-md bg-white/5 p-2">
                <dt className="text-ink-subdued">Queue</dt>
                <dd className="mt-1 font-semibold text-ink">{zone.queueLength}</dd>
              </div>
              <div className="rounded-md bg-white/5 p-2">
                <dt className="text-ink-subdued">Entry/min</dt>
                <dd className="mt-1 font-semibold text-ink">{zone.entryRate}</dd>
              </div>
              <div className="rounded-md bg-white/5 p-2">
                <dt className="text-ink-subdued">Exit/min</dt>
                <dd className="mt-1 font-semibold text-ink">{zone.exitRate}</dd>
              </div>
            </dl>
          </motion.article>
        ))}
      </div>
    </Panel>
  );
}
