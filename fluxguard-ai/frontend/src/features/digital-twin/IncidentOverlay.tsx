import { EmptyState } from '@/components/ui';

interface IncidentItem {
  id: string;
  type: string;
  zoneId: string;
  severity: string;
  description: string;
}

const ZONE_NAMES: Record<string, string> = {
  '00000000-0000-0000-0000-000000000001': 'North Gate',
  '00000000-0000-0000-0000-000000000002': 'East Concourse',
  '00000000-0000-0000-0000-000000000003': 'Gate C',
  '00000000-0000-0000-0000-000000000004': 'West Entrance',
};

export function IncidentOverlay({ incidents }: { incidents: IncidentItem[] }) {
  return (
    <div className="p-4 bg-surface rounded border border-white/5 space-y-3 font-mono text-xs">
      <h3 className="text-[9px] font-bold text-ink-subdued uppercase tracking-widest">
        Live Incident Overlays ({incidents.length})
      </h3>
      {incidents.length === 0 ? (
        <EmptyState
          icon="🛡️"
          title="No Incident Overlays"
          description="All zones operating normally. No active incidents."
        />
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className="flex items-center justify-between text-ink border-l border-risk-critical pl-2 py-0.5"
            >
              <div className="space-y-0.5">
                <div className="font-bold text-[10px]">
                  {inc.type} in {ZONE_NAMES[inc.zoneId] || 'Unknown'}
                </div>
                <div className="text-[9px] text-ink-muted">{inc.description}</div>
              </div>
              <span className="text-[9px] font-bold text-risk-critical animate-pulse uppercase">
                {inc.severity}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
