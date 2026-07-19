import { useState } from 'react';
import { Panel } from '@/components/ui';

interface CrowdZone {
  id: string;
  name: string;
  density: number;
  capacity?: number;
  risk: string;
}

export function StadiumTwinView({ zones }: { zones: CrowdZone[] }) {
  const [selectedZone, setSelectedZone] = useState<CrowdZone | null>(null);

  // Map zone names to specific quadrants for the SVG outline
  const getZoneColor = (name: string) => {
    const zone = zones.find((z) => z.name.toLowerCase() === name.toLowerCase());
    if (!zone) return 'fill-slate-800';
    if (zone.risk === 'CRITICAL') return 'fill-red-500/20 stroke-red-500';
    if (zone.risk === 'HIGH') return 'fill-orange-500/20 stroke-orange-500';
    if (zone.risk === 'MEDIUM') return 'fill-amber-500/20 stroke-amber-500';
    return 'fill-emerald-500/20 stroke-emerald-500';
  };

  const getZoneDetails = (name: string) => {
    return zones.find((z) => z.name.toLowerCase() === name.toLowerCase()) || null;
  };

  return (
    <Panel eyebrow="Digital Twin" title="Lucusa Stadium Operations Twin">
      <div className="grid gap-5 md:grid-cols-12 font-mono text-xs">
        {/* Interactive SVG Quadrants */}
        <div className="md:col-span-8 flex items-center justify-center bg-surface rounded border border-white/5 p-4 min-h-[300px]">
          <svg viewBox="0 0 400 300" className="w-full max-w-[360px] h-auto">
            {/* Outer stadium shape */}
            <rect
              x="20"
              y="20"
              width="360"
              height="260"
              rx="130"
              className="fill-none stroke-white/10 stroke-2"
            />
            {/* Inner stadium pitch outline */}
            <rect
              x="120"
              y="90"
              width="160"
              height="120"
              rx="30"
              className="fill-none stroke-white/5 stroke-1"
            />

            {/* Quadrant 1: North Gate (Top) */}
            <path
              d="M 120,30 L 280,30 A 130,130 0 0,1 320,90 L 200,150 L 80,90 A 130,130 0 0,1 120,30 Z"
              className={`cursor-pointer transition-all duration-300 stroke-2 ${getZoneColor('North Gate')}`}
              onClick={() => setSelectedZone(getZoneDetails('North Gate'))}
            />
            {/* Quadrant 2: East Concourse (Right) */}
            <path
              d="M 320,90 A 130,130 0 0,1 370,190 L 280,210 L 200,150 L 320,90 Z"
              className={`cursor-pointer transition-all duration-300 stroke-2 ${getZoneColor('East Concourse')}`}
              onClick={() => setSelectedZone(getZoneDetails('East Concourse'))}
            />
            {/* Quadrant 3: Gate C (Bottom) */}
            <path
              d="M 80,210 A 130,130 0 0,1 120,270 L 280,270 A 130,130 0 0,1 320,210 L 200,150 Z"
              className={`cursor-pointer transition-all duration-300 stroke-2 ${getZoneColor('Gate C')}`}
              onClick={() => setSelectedZone(getZoneDetails('Gate C'))}
            />
            {/* Quadrant 4: West Entrance (Left) */}
            <path
              d="M 30,110 A 130,130 0 0,1 80,210 L 200,150 L 80,90 A 130,130 0 0,1 30,110 Z"
              className={`cursor-pointer transition-all duration-300 stroke-2 ${getZoneColor('West Entrance')}`}
              onClick={() => setSelectedZone(getZoneDetails('West Entrance'))}
            />

            {/* Labels overlay */}
            <text
              x="200"
              y="60"
              textAnchor="middle"
              className="fill-ink text-[10px] font-bold pointer-events-none select-none font-mono"
            >
              NORTH GATE
            </text>
            <text
              x="290"
              y="155"
              textAnchor="middle"
              className="fill-ink text-[10px] font-bold pointer-events-none select-none font-mono"
            >
              EAST CONCOURSE
            </text>
            <text
              x="200"
              y="240"
              textAnchor="middle"
              className="fill-ink text-[10px] font-bold pointer-events-none select-none font-mono"
            >
              GATE C
            </text>
            <text
              x="110"
              y="155"
              textAnchor="middle"
              className="fill-ink text-[10px] font-bold pointer-events-none select-none font-mono"
            >
              WEST ENTRANCE
            </text>
          </svg>
        </div>

        {/* Selected Zone telemetry diagnostics */}
        <div className="md:col-span-4 space-y-4">
          <div className="p-4 bg-surface rounded border border-white/5 min-h-[300px] flex flex-col justify-between">
            {selectedZone ? (
              <div className="space-y-3">
                <div className="border-b border-white/5 pb-2">
                  <span className="text-[8px] font-bold text-ink-subdued uppercase tracking-widest block">
                    Quadrant Diagnostic
                  </span>
                  <h4 className="text-sm font-bold text-ink">{selectedZone.name}</h4>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Population density:</span>
                    <span className="text-brand-primary font-bold">{selectedZone.density}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Active risk profile:</span>
                    <span
                      className={
                        selectedZone.risk === 'CRITICAL'
                          ? 'text-risk-critical font-bold'
                          : selectedZone.risk === 'HIGH'
                            ? 'text-risk-warning font-bold'
                            : 'text-risk-safe'
                      }
                    >
                      {selectedZone.risk}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Total Capacity:</span>
                    <span className="text-ink">{selectedZone.capacity || 2000} pax</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-white/5 space-y-1">
                  <span className="text-[8px] font-bold text-ink-subdued uppercase tracking-widest block">
                    Predictive Horizon
                  </span>
                  <p className="text-[10px] text-brand-secondary">
                    {selectedZone.risk === 'CRITICAL'
                      ? 'Density forecast to remain high. Recommendation: reroute exit channels.'
                      : 'Density forecast within standard limits. Egress operations stable.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center text-ink-subdued text-[11px] p-6 leading-relaxed">
                Click on any quadrant segment inside the stadium twin SVG graphic to view live
                diagnostic feeds.
              </div>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}
