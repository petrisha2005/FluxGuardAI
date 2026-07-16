import { useState } from 'react';
import {
  setZoneDetour,
  setZoneStatus,
  useSimulationState,
} from '../../simulation/simulationStore';
import { ZONE_LINKS } from '../../simulation/crowdSimulator';

const ZONE_POSITIONS: Record<string, { x: number; y: number }> = {
  // Event 1 (Lucusa Stadium)
  'north-gate': { x: 20, y: 25 },
  'gate-c': { x: 20, y: 50 },
  'west-entrance': { x: 20, y: 75 },
  'east-concourse': { x: 80, y: 50 },

  // Event 2 (City Arena)
  'main-entry-gate': { x: 20, y: 30 },
  'north-gate-stand': { x: 20, y: 70 },
  'south-concourse': { x: 80, y: 50 },

  // Event 3 (Downtown Fan Zone)
  'transit-egress-gate': { x: 15, y: 50 },
  'screening-plaza': { x: 50, y: 50 },
  'food-&-beverage-court': { x: 85, y: 50 },
};

function getDensityColor(density: number) {
  if (density > 85) return 'text-purple-400 fill-purple-500/20 stroke-purple-500';
  if (density > 70) return 'text-rose-400 fill-rose-500/20 stroke-rose-500';
  if (density > 45) return 'text-amber-400 fill-amber-500/20 stroke-amber-500';
  return 'text-emerald-400 fill-emerald-500/20 stroke-emerald-500';
}

function getDensityPulseColor(density: number) {
  if (density > 85) return 'bg-purple-500';
  if (density > 70) return 'bg-rose-500';
  if (density > 45) return 'bg-amber-500';
  return 'bg-emerald-500';
}

export function FlowVisualizer() {
  const sim = useSimulationState();
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  // Filter links applicable to the currently loaded event zones
  const activeLinks = ZONE_LINKS.filter(
    (link) => sim.zones.some((z) => z.id === link.source) && sim.zones.some((z) => z.id === link.target)
  );

  const selectedZone = sim.zones.find((z) => z.id === selectedZoneId);

  const handleToggleStatus = () => {
    if (!selectedZone) return;
    const newStatus = selectedZone.status === 'closed' ? 'open' : 'closed';
    setZoneStatus(selectedZone.id, newStatus);
  };

  const handleSelectDetour = (detourId: string) => {
    if (!selectedZone) return;
    setZoneDetour(selectedZone.id, detourId === 'none' ? undefined : detourId);
  };

  // Find other gates in the active event that could act as a detour target
  const prospectiveDetourGates = sim.zones.filter(
    (z) => z.type === 'gate' && z.id !== selectedZoneId
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 text-ink">
      {/* SVG Flow Map Canvas */}
      <div className="lg:col-span-3 rounded-2xl border border-white/5 bg-surface-elevated/20 p-6 flex flex-col gap-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Pedestrian Flow Network</h2>
            <p className="text-xs text-ink-muted">Digital twin simulator visualizing zone nodes and flow velocities.</p>
          </div>
          <span className="text-[10px] uppercase font-semibold text-brand-primary tracking-wider animate-pulse flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brand-primary"></span> Live Simulation
          </span>
        </div>

        <div className="relative aspect-[2/1] w-full rounded-xl border border-white/5 bg-[#08090d] overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:32px_32px]"></div>

          <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <style>
              {`
                @keyframes flow-dash {
                  from { stroke-dashoffset: 40; }
                  to { stroke-dashoffset: 0; }
                }
                .flow-active {
                  stroke-dasharray: 8 6;
                  animation: flow-dash 1.2s linear infinite;
                }
              `}
            </style>

            {/* Links / Transit Pathways */}
            {activeLinks.map((link, idx) => {
              const srcPos = ZONE_POSITIONS[link.source] || { x: 50, y: 50 };
              const tgtPos = ZONE_POSITIONS[link.target] || { x: 50, y: 50 };

              const srcZone = sim.zones.find((z) => z.id === link.source);
              const tgtZone = sim.zones.find((z) => z.id === link.target);

              const isFlowCut = srcZone?.status === 'closed' || tgtZone?.status === 'closed';
              // Flow rate is represented by the source exit rate (or entry rate if source is gate)
              const flowRate = srcZone?.type === 'gate' ? srcZone.entryRate : srcZone?.exitRate ?? 0;

              return (
                <g key={`${link.source}-${link.target}-${idx}`}>
                  {/* Background shadow path */}
                  <line
                    x1={`${srcPos.x}%`}
                    y1={`${srcPos.y}%`}
                    x2={`${tgtPos.x}%`}
                    y2={`${tgtPos.y}%`}
                    stroke="rgba(255,255,255,0.03)"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  {/* Flow pipeline */}
                  <line
                    x1={`${srcPos.x}%`}
                    y1={`${srcPos.y}%`}
                    x2={`${tgtPos.x}%`}
                    y2={`${tgtPos.y}%`}
                    className={!isFlowCut && flowRate > 0 ? 'flow-active' : ''}
                    stroke={
                      isFlowCut
                        ? 'rgba(239, 68, 68, 0.2)'
                        : flowRate > 60
                        ? 'rgba(168, 85, 247, 0.5)'
                        : 'rgba(56, 189, 248, 0.4)'
                    }
                    strokeWidth={isFlowCut ? 2 : 2.5 + flowRate / 45}
                    strokeLinecap="round"
                  />
                  {/* Flow label */}
                  {!isFlowCut && flowRate > 0 && (
                    <text
                      x={`${(srcPos.x + tgtPos.x) / 2}%`}
                      y={`${(srcPos.y + tgtPos.y) / 2 - 3}%`}
                      fill="rgba(255, 255, 255, 0.4)"
                      fontSize="9"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {flowRate} p/m
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes / Zones */}
            {sim.zones.map((zone) => {
              const pos = ZONE_POSITIONS[zone.id] || { x: 50, y: 50 };
              const colorClasses = getDensityColor(zone.density);
              const isSelected = selectedZoneId === zone.id;

              return (
                <g
                  key={zone.id}
                  className="cursor-pointer group"
                  onClick={() => setSelectedZoneId(zone.id)}
                >
                  {/* Highlight ring if selected */}
                  {isSelected && (
                    <circle
                      cx={`${pos.x}%`}
                      cy={`${pos.y}%`}
                      r="32"
                      className="fill-none stroke-brand-primary/40 animate-pulse"
                      strokeWidth="2.5"
                    />
                  )}
                  {/* Zone base circle */}
                  <circle
                    cx={`${pos.x}%`}
                    cy={`${pos.y}%`}
                    r="22"
                    className={`transition-all duration-300 ${
                      zone.status === 'closed'
                        ? 'fill-rose-500/10 stroke-rose-500/80'
                        : colorClasses
                    }`}
                    strokeWidth="2"
                  />
                  {/* Status indicator badge (Cross if closed) */}
                  {zone.status === 'closed' && (
                    <circle
                      cx={`${pos.x + 4}%`}
                      cy={`${pos.y - 4}%`}
                      r="6"
                      className="fill-rose-600 stroke-black"
                      strokeWidth="1"
                    />
                  )}
                  {/* Node label */}
                  <text
                    x={`${pos.x}%`}
                    y={`${pos.y + 1}%`}
                    fill="white"
                    fontSize="10"
                    fontWeight="700"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {zone.density}%
                  </text>

                  {/* Detour lines indicator */}
                  {zone.status === 'closed' && zone.detourTargetId && (
                    <path
                      d={`M ${pos.x}% ${pos.y}% Q ${
                        (pos.x + (ZONE_POSITIONS[zone.detourTargetId]?.x ?? 50)) / 2
                      }% ${
                        (pos.y + (ZONE_POSITIONS[zone.detourTargetId]?.y ?? 50)) / 2 + 10
                      }% ${(ZONE_POSITIONS[zone.detourTargetId]?.x ?? 50)}% ${
                        (ZONE_POSITIONS[zone.detourTargetId]?.y ?? 50)
                      }%`}
                      fill="none"
                      stroke="rgba(251, 191, 36, 0.4)"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Node Labels Overlay */}
          {sim.zones.map((zone) => {
            const pos = ZONE_POSITIONS[zone.id] || { x: 50, y: 50 };
            return (
              <div
                key={zone.id}
                style={{ left: `${pos.x}%`, top: `${pos.y + 7}%` }}
                className="absolute -translate-x-1/2 rounded bg-surface/90 border border-white/5 px-2 py-0.5 text-[9px] font-semibold text-ink backdrop-blur shadow select-none pointer-events-none"
              >
                {zone.name}
              </div>
            );
          })}
        </div>
      </div>

      {/* Control command card */}
      <div className="lg:col-span-1 flex flex-col gap-4">
        {selectedZone ? (
          <div className="rounded-2xl border border-white/5 bg-surface-elevated/20 p-5 backdrop-blur flex flex-col gap-4 justify-between h-full">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-ink text-base">{selectedZone.name}</h3>
                  <span className="text-[10px] text-ink-muted uppercase font-semibold tracking-wider">
                    {selectedZone.type} Zone
                  </span>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-3xs font-semibold border ${
                    selectedZone.status === 'closed'
                      ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                      : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  }`}
                >
                  {selectedZone.status === 'closed' ? 'Closed' : 'Active'}
                </span>
              </div>

              <div className="border-t border-white/5 pt-4 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-ink-muted">Crowd Density:</span>
                  <span className="font-semibold">{selectedZone.density}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-ink-muted">Capacity Limit:</span>
                  <span className="font-semibold">{selectedZone.capacity || 2000} pax</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-ink-muted">Active Queue:</span>
                  <span className="font-semibold">{selectedZone.queueLength} people</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-ink-muted">Last Flow Tick:</span>
                  <span className="font-semibold text-brand-primary">
                    {selectedZone.entryRate || selectedZone.exitRate || 0} p/m
                  </span>
                </div>
              </div>

              {selectedZone.type === 'gate' && (
                <div className="border-t border-white/5 pt-4 space-y-3">
                  <h4 className="text-xs font-bold">Scenario Control Options</h4>
                  <div className="space-y-1">
                    <label className="text-[10px] text-ink-muted uppercase font-semibold">Detour Reroute Target</label>
                    <select
                      disabled={selectedZone.status !== 'closed'}
                      value={selectedZone.detourTargetId || 'none'}
                      onChange={(e) => handleSelectDetour(e.target.value)}
                      className="w-full bg-surface border border-white/10 text-ink text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50"
                    >
                      <option value="none">No Detour (Force Stacking)</option>
                      {prospectiveDetourGates.map((pg) => (
                        <option key={pg.id} value={pg.id}>
                          Redirect to {pg.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
              <button
                onClick={handleToggleStatus}
                className={`w-full flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-black transition-all duration-200 shadow-md ${
                  selectedZone.status === 'closed'
                    ? 'bg-emerald-400 hover:bg-emerald-500 shadow-emerald-500/10'
                    : 'bg-rose-400 hover:bg-rose-500 shadow-rose-500/10'
                }`}
              >
                {selectedZone.status === 'closed' ? 'Reopen Gate' : 'Close Gate'}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/5 bg-surface-elevated/20 p-5 backdrop-blur flex flex-col items-center justify-center text-center h-full min-h-[250px]">
            <span className="text-brand-primary text-xl mb-2">ℹ</span>
            <h3 className="font-bold text-ink text-sm">No Zone Selected</h3>
            <p className="text-2xs text-ink-muted max-w-[180px] mt-1">
              Click any circular zone node on the network map to inspect metrics and run scenario detours.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
