import { motion } from 'framer-motion';

import { Badge, StatusIndicator } from '@/components/ui';

export function DashboardHeader() {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-3">
        <Badge variant="info">Simulated operations</Badge>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Operations Command Center
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted sm:text-base">
            Monitor simulated crowd density, congestion risk, predictive analytics, and operational
            guidance in one command-center view.
          </p>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="rounded-command border border-white/10 bg-white/5 px-4 py-3"
      >
        <StatusIndicator
          state="amber"
          label="Live simulation"
          accessibilityText="Dashboard is using live simulated operations data"
        />
      </motion.div>
    </header>
  );
}
