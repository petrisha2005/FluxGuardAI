import { Panel } from '@/components/ui';

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

interface StadiumNetworkMapProps {
  stadiums: Stadium[];
  onSelectStadium: (stadium: Stadium) => void;
  selectedStadiumId?: string;
}

export function StadiumNetworkMap({
  stadiums,
  onSelectStadium,
  selectedStadiumId,
}: StadiumNetworkMapProps) {
  const getCoordinates = (city: string) => {
    switch (city) {
      case 'New York':
        return { x: 300, y: 80 };
      case 'Los Angeles':
        return { x: 80, y: 180 };
      case 'Atlanta':
        return { x: 260, y: 170 };
      case 'Miami':
        return { x: 310, y: 240 };
      default:
        return { x: 200, y: 150 };
    }
  };

  const getMarkerColor = (risk: string) => {
    if (risk === 'high') return 'fill-risk-critical animate-pulse';
    if (risk === 'medium') return 'fill-risk-warning';
    return 'fill-brand-primary';
  };

  return (
    <Panel eyebrow="Global Map" title="FIFA 2026 Stadium Command Network">
      <div className="flex items-center justify-center bg-surface border border-white/5 rounded p-4 min-h-[300px] font-mono">
        <svg viewBox="0 0 400 300" className="w-full max-w-[400px] h-auto">
          {/* Map contours */}
          <rect
            x="10"
            y="10"
            width="380"
            height="280"
            rx="6"
            className="fill-slate-950/20 stroke-white/5"
          />
          <path
            d="M50 120 Q120 80 200 100 T350 90 T370 200 T280 250 T100 240 Z"
            className="fill-white/[0.02] stroke-white/5"
          />

          {/* Markers */}
          {stadiums.map((s) => {
            const { x, y } = getCoordinates(s.city);
            const isSelected = selectedStadiumId === s.id;
            return (
              <g key={s.id} className="cursor-pointer" onClick={() => onSelectStadium(s)}>
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 8 : 5}
                  className={`${getMarkerColor(s.riskLevel)} transition-all duration-300`}
                />
                {isSelected && (
                  <circle
                    cx={x}
                    cy={y}
                    r={14}
                    className="fill-none stroke-brand-primary/40 stroke-1 animate-ping"
                  />
                )}
                <text
                  x={x}
                  y={y - 12}
                  textAnchor="middle"
                  className="fill-ink font-bold text-[8px] font-mono select-none"
                >
                  {s.name.replace(' Stadium', '')}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </Panel>
  );
}
