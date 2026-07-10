import { AlertCard, Panel } from '@/components/ui';
import type { EventFeedItem } from '../types/dashboard';

export interface LiveEventFeedProps {
  items: EventFeedItem[];
}

export function LiveEventFeed({ items }: LiveEventFeedProps) {
  return (
    <Panel eyebrow="Live event feed" title="Operations log" aria-label="Live event feed">
      <div className="space-y-3" aria-live="polite">
        {items.map((item) => (
          <AlertCard
            key={item.id}
            severity={item.severity}
            title={item.title}
            description={item.description}
            timestamp={item.timestamp}
          />
        ))}
      </div>
    </Panel>
  );
}
