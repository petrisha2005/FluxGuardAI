import { useState } from 'react';
import { Panel } from '@/components/ui';

export function CityTwinMap() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  return (
    <Panel eyebrow="City Twin" title="New York Metro Egress Digital Twin">
      <div className="grid gap-5 md:grid-cols-12 font-mono text-xs">
        <div className="md:col-span-8 flex items-center justify-center bg-surface rounded border border-white/5 p-4 min-h-[300px]">
          <svg viewBox="0 0 400 300" className="w-full max-w-[360px] h-auto">
            {/* Grid overlay */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" className="stroke-white/[0.02] stroke-1" />
              </pattern>
            </defs>
            <rect width="400" height="300" fill="url(#grid)" />

            {/* Metro Rail Line Corridor */}
            <path
              d="M 50,150 L 350,150"
              className="fill-none stroke-brand-primary/20 stroke-[4px]"
            />
            <path
              d="M 50,150 L 350,150"
              className="fill-none stroke-brand-primary/60 stroke-[1px] stroke-dasharray-[4,4] animate-pulse"
            />

            {/* Feeder line connecting Fan Zone B to the main line */}
            <path
              d="M 200,150 L 310,80"
              className="fill-none stroke-brand-primary/20 stroke-[3px]"
            />
            <path
              d="M 200,150 L 310,80"
              className="fill-none stroke-brand-primary/60 stroke-[1px] stroke-dasharray-[4,4] animate-pulse"
            />

            {/* Node 1: MetLife Stadium */}
            <g className="cursor-pointer" onClick={() => setSelectedNode('MetLife Stadium')}>
              <rect
                x="40"
                y="125"
                width="50"
                height="50"
                rx="8"
                className="fill-risk-warning/10 stroke-risk-warning stroke-2"
              />
              <text
                x="65"
                y="155"
                textAnchor="middle"
                className="fill-ink text-[7px] font-bold font-mono pointer-events-none select-none"
              >
                METLIFE
              </text>
            </g>

            {/* Node 2: Times Square Fan Zone */}
            <g className="cursor-pointer" onClick={() => setSelectedNode('Times Square Fan Zone')}>
              <circle
                cx="200"
                cy="150"
                r="22"
                className="fill-brand-primary/10 stroke-brand-primary stroke-2"
              />
              <text
                x="200"
                y="153"
                textAnchor="middle"
                className="fill-ink text-[7px] font-bold font-mono pointer-events-none select-none"
              >
                FAN ZONE A
              </text>
            </g>

            {/* Node 3: Central Park Fan Plaza */}
            <g className="cursor-pointer" onClick={() => setSelectedNode('Central Park Fan Plaza')}>
              <circle
                cx="310"
                cy="80"
                r="22"
                className="fill-brand-secondary/10 stroke-brand-secondary stroke-2"
              />
              <text
                x="310"
                y="83"
                textAnchor="middle"
                className="fill-ink text-[7px] font-bold font-mono pointer-events-none select-none"
              >
                FAN ZONE B
              </text>
            </g>
          </svg>
        </div>

        <div className="md:col-span-4 p-4 bg-surface rounded border border-white/5 flex flex-col justify-between min-h-[300px]">
          {selectedNode ? (
            <div className="space-y-3">
              <div className="border-b border-white/5 pb-2">
                <span className="text-[8px] font-bold text-ink-subdued uppercase tracking-widest block">
                  City Node
                </span>
                <h4 className="text-sm font-bold text-ink">{selectedNode}</h4>
              </div>
              <div className="space-y-2 text-xs text-ink-muted leading-relaxed">
                {selectedNode.includes('MetLife') ? (
                  <>
                    <p>Current state: WARNING</p>
                    <p>Subway Station queue times: 12 minutes.</p>
                    <p>Traffic flow: Egress compressed along Route 3 West.</p>
                  </>
                ) : (
                  <>
                    <p>Current state: STABLE</p>
                    <p>Spectator Attendance: 12,500 / 15,000</p>
                    <p>Digital Signs: Showing transit directions.</p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center text-ink-subdued text-[11px] p-6 leading-relaxed">
              Click on any grid node in the city twin SVG to inspect subway stations, stadiums, and
              spectator plazalandings.
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}
