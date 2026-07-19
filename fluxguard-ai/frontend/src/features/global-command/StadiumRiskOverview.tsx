import { Panel, Badge } from '@/components/ui';

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

interface StadiumRiskOverviewProps {
  stadiums: Stadium[];
  onSelectStadium: (stadium: Stadium) => void;
  selectedStadiumId?: string;
}

export function StadiumRiskOverview({
  stadiums,
  onSelectStadium,
  selectedStadiumId,
}: StadiumRiskOverviewProps) {
  return (
    <Panel eyebrow="Command Center" title="Stadium Network Risk Matrix">
      <div className="grid gap-3 font-mono text-xs">
        {stadiums.map((s) => {
          const isSelected = selectedStadiumId === s.id;
          return (
            <div
              key={s.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectStadium(s)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectStadium(s);
                }
              }}
              className={`p-3 rounded border transition-all cursor-pointer ${
                isSelected
                  ? 'border-brand-primary bg-brand-primary/5 shadow-[0_0_12px_rgba(56,189,248,0.05)]'
                  : 'border-white/5 bg-surface hover:border-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-sans font-bold text-ink text-sm">{s.name}</h4>
                  <span className="text-[10px] text-ink-subdued uppercase">
                    {s.city}, {s.country}
                  </span>
                </div>
                <Badge
                  variant={
                    s.riskLevel === 'high'
                      ? 'critical'
                      : s.riskLevel === 'medium'
                        ? 'warning'
                        : 'safe'
                  }
                >
                  {s.riskLevel.toUpperCase()}
                </Badge>
              </div>

              <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-b border-white/5 py-2 text-[10px] text-ink-muted">
                <div>Attendance: {s.currentAttendance.toLocaleString()}</div>
                <div>Capacity: {s.capacity.toLocaleString()}</div>
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px]">
                <span className="text-ink-subdued">Forecast:</span>
                <span
                  className={
                    s.riskLevel === 'high'
                      ? 'text-risk-critical animate-pulse font-bold'
                      : 'text-ink'
                  }
                >
                  {s.predictionStatus}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
