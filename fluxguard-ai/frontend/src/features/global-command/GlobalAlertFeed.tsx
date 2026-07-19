import { Panel, Badge } from '@/components/ui';

interface AlertItem {
  id: string;
  source: string;
  type: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  timestamp: string;
}

interface GlobalAlertFeedProps {
  alerts: AlertItem[];
}

export function GlobalAlertFeed({ alerts }: GlobalAlertFeedProps) {
  return (
    <Panel eyebrow="Global Feed" title="Real-Time Network Activity">
      <div className="space-y-3 font-mono text-xs max-h-[400px] overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="text-center text-ink-subdued py-6">No network alerts logged.</div>
        ) : (
          alerts.map((a) => (
            <div
              key={a.id}
              className="p-3 bg-surface rounded border border-white/5 space-y-1 hover:border-white/10 transition-all"
            >
              <div className="flex items-center justify-between text-[9px] uppercase tracking-wider">
                <span className="text-brand-primary font-bold">
                  {a.source} ({a.type})
                </span>
                <span className="text-ink-subdued">{a.timestamp}</span>
              </div>
              <p className="text-ink font-sans text-xs leading-relaxed">{a.message}</p>
              <div className="flex items-center justify-between pt-1 text-[9px]">
                <span className="text-ink-subdued">Priority:</span>
                <Badge
                  variant={
                    a.severity === 'high'
                      ? 'critical'
                      : a.severity === 'medium'
                        ? 'warning'
                        : 'safe'
                  }
                >
                  {a.severity.toUpperCase()}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}
