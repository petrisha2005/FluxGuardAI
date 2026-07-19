import React from 'react';

interface AgentInfo {
  name: string;
  role: string;
  focus: string;
  confidence: number;
  status: 'ACTIVE' | 'MONITORING' | 'IDLE';
}

const AGENTS: AgentInfo[] = [
  {
    name: 'Crowd Control Agent',
    role: 'Flow Optimization',
    focus: 'Queue thresholds, gate congestion, density bottlenecks',
    confidence: 94,
    status: 'ACTIVE',
  },
  {
    name: 'Emergency Response Agent',
    role: 'Incident Dispatcher',
    focus: 'Medical alerts, security hazards, concourse incidents',
    confidence: 95,
    status: 'MONITORING',
  },
  {
    name: 'Transport Coordinator Agent',
    role: 'Transit Sync',
    focus: 'Transit delays, shuttle arrival rates, parking capacity',
    confidence: 91,
    status: 'ACTIVE',
  },
  {
    name: 'Resource Allocator Agent',
    role: 'Staffing Optimizer',
    focus: 'Steward placements, volunteer task density matching',
    confidence: 89,
    status: 'MONITORING',
  },
  {
    name: 'Safety Hazard Agent',
    role: 'Critical Protection',
    focus: 'Evacuation corridors, exit bottlenecks, heat map anomalies',
    confidence: 96,
    status: 'ACTIVE',
  },
];

export function AgentStatusPanel() {
  return (
    <div className="rounded-xl border border-white/5 bg-surface-elevated/40 p-5 backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
            Autonomous Agent Grid
          </h3>
          <p className="text-[11px] text-ink-subdued">
            Live telemetry from localized cognitive operators
          </p>
        </div>
        <span className="rounded bg-brand-primary/10 px-2 py-0.5 font-mono text-[9px] font-bold text-brand-primary uppercase tracking-wider">
          Orchestrated
        </span>
      </div>

      <div className="space-y-4">
        {AGENTS.map((agent) => (
          <div
            key={agent.name}
            className="group relative overflow-hidden rounded-lg border border-white/5 bg-surface/50 p-4 transition-all duration-300 hover:border-brand-primary/20 hover:bg-surface-elevated/80"
          >
            {/* Status indicator pill */}
            <div className="absolute right-4 top-4 flex items-center gap-1.5">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  agent.status === 'ACTIVE'
                    ? 'bg-emerald-500 animate-pulse'
                    : agent.status === 'MONITORING'
                      ? 'bg-sky-400'
                      : 'bg-zinc-600'
                }`}
              />
              <span className="font-mono text-[9px] font-bold tracking-wider text-ink-subdued">
                {agent.status}
              </span>
            </div>

            <div className="mb-2">
              <h4 className="text-xs font-bold text-ink transition-colors duration-200 group-hover:text-brand-primary">
                {agent.name}
              </h4>
              <span className="font-mono text-[9px] text-brand-secondary/80 uppercase tracking-widest">
                {agent.role}
              </span>
            </div>

            <p className="mb-3 text-[11px] leading-relaxed text-ink-subdued">{agent.focus}</p>

            <div>
              <div className="mb-1 flex items-center justify-between text-[9px] font-mono font-bold uppercase text-ink-subdued">
                <span>Confidence Index</span>
                <span className="text-brand-primary">{agent.confidence}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-secondary to-brand-primary transition-all duration-500"
                  style={{ width: `${agent.confidence}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
