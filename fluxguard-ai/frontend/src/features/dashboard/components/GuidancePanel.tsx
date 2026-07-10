import { Badge, Panel } from '@/components/ui';
import type { GuidanceRecommendation } from '../types/dashboard';

export interface GuidancePanelProps {
  guidance: GuidanceRecommendation;
}

export function GuidancePanel({ guidance }: GuidancePanelProps) {
  return (
    <Panel
      eyebrow="Operational guidance"
      title="Simulated AI recommendation"
      aria-label="Guidance panel"
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-2xl text-sm leading-6 text-ink-muted">{guidance.message}</p>
          <Badge variant="info">
            {guidance.confidence}% confidence · {guidance.risk}
          </Badge>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-ink">Recommended actions</h3>
          <ul className="mt-3 space-y-2">
            {guidance.recommendedActions.map((action) => (
              <li
                key={action}
                className="rounded-command border border-white/10 bg-white/5 px-3 py-2 text-sm text-ink-muted"
              >
                {action}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Panel>
  );
}
