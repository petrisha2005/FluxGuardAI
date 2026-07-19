import { useEffect, useState } from 'react';
import { Panel } from '@/components/ui';

interface HistoricalEvent {
  event_type: string;
  date: string;
  crowd_size: number;
  weather: string;
  incidents: number;
  actions_taken: string;
  outcome: string;
}

export function HistoricalInsightPanel() {
  const [history, setHistory] = useState<HistoricalEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/history/similar-events')
      .then((res) => res.json())
      .then((payload) => {
        setHistory(payload.data || []);
      })
      .catch((err) => console.warn('Failed to load similar history events:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Panel eyebrow="Historical Memory" title="Similar Event Resolutions">
      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-xs font-mono text-ink-subdued py-4">
            Querying memory indexes...
          </div>
        ) : history.length === 0 ? (
          <div className="text-center text-xs font-mono text-ink-subdued py-4">
            No matching historical patterns.
          </div>
        ) : (
          <div className="space-y-3 font-mono">
            {history.map((h, i) => (
              <div
                key={i}
                className="p-3 bg-surface border border-white/5 rounded space-y-1.5 hover:border-white/10 transition-all text-xs"
              >
                <div className="flex items-center justify-between text-brand-primary font-bold uppercase text-[9px] tracking-wider">
                  <span>{h.event_type}</span>
                  <span className="text-ink-subdued">{h.date}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-ink-muted text-[10px] pb-1 border-b border-white/5">
                  <div>Crowd: {h.crowd_size.toLocaleString()}</div>
                  <div>Weather: {h.weather}</div>
                </div>
                <div className="text-ink text-[11px] leading-relaxed">
                  <span className="text-brand-secondary font-bold">Action Taken: </span>
                  {h.actions_taken}
                </div>
                <div className="text-ink-muted text-[10px] leading-relaxed">
                  <span className="text-risk-safe font-bold">Outcome: </span>
                  {h.outcome}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}
