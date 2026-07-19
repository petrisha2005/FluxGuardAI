import { useState } from 'react';
import { Panel } from '@/components/ui';

interface ScenarioResult {
  predictedImpact: string;
  recoveryTime: string;
  recommendations: string[];
}

export function ScenarioSimulator() {
  const [scenarioType, setScenarioType] = useState('gate_closure');
  const [affectedZone, setAffectedZone] = useState('Gate C');
  const [severity, setSeverity] = useState('medium');
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = () => {
    setLoading(true);
    fetch('/api/scenarios/simulate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scenarioType,
        affectedZone,
        severity,
      }),
    })
      .then((res) => res.json())
      .then((payload) => {
        setResult(payload.data || null);
      })
      .catch((err) => console.warn('Failed to run scenario simulation:', err))
      .finally(() => setLoading(false));
  };

  return (
    <Panel eyebrow="Command Simulation" title="What-If Operational Scenario Simulator">
      <div className="space-y-4 font-mono text-xs">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <label
              htmlFor="sim-type"
              className="text-[9px] font-bold text-ink-subdued uppercase tracking-wider"
            >
              Scenario Context
            </label>
            <select
              id="sim-type"
              value={scenarioType}
              onChange={(e) => setScenarioType(e.target.value)}
              className="w-full bg-surface border border-white/5 rounded px-2.5 py-1.5 text-xs text-ink cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-primary"
            >
              <option value="gate_closure">Close Entrance Gate</option>
              <option value="weather_rain">Heavy Rainfall Outbreak</option>
              <option value="scanner_reduction">Scanner Capacity Drop (30%)</option>
              <option value="evacuation">Emergency Egress Evacuation</option>
              <option value="staff_reduction">Staff Count Allocation Drop</option>
            </select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="sim-zone"
              className="text-[9px] font-bold text-ink-subdued uppercase tracking-wider"
            >
              Affected Zone
            </label>
            <select
              id="sim-zone"
              value={affectedZone}
              onChange={(e) => setAffectedZone(e.target.value)}
              className="w-full bg-surface border border-white/5 rounded px-2.5 py-1.5 text-xs text-ink cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-primary"
            >
              <option value="North Gate">North Gate</option>
              <option value="East Concourse">East Concourse</option>
              <option value="Gate C">Gate C</option>
              <option value="West Entrance">West Entrance</option>
            </select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="sim-sev"
              className="text-[9px] font-bold text-ink-subdued uppercase tracking-wider"
            >
              Stress Level
            </label>
            <select
              id="sim-sev"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full bg-surface border border-white/5 rounded px-2.5 py-1.5 text-xs text-ink cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-primary"
            >
              <option value="low">Low Severity</option>
              <option value="medium">Medium Severity</option>
              <option value="high">High Severity</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleSimulate}
          disabled={loading}
          className="w-full bg-brand-primary hover:bg-brand-primary/85 text-slate-950 font-bold uppercase tracking-wider px-4 py-2.5 rounded transition-all select-none text-[10px]"
        >
          {loading ? 'Executing Sim Models...' : 'Run Scenario Simulation'}
        </button>

        {result && (
          <div className="mt-4 border-t border-white/5 pt-4 space-y-3">
            <div className="p-3 bg-surface rounded border border-white/5">
              <span className="text-[8px] font-bold text-ink-subdued uppercase tracking-widest block mb-1">
                Predicted Simulation Impact
              </span>
              <p className="text-xs text-ink leading-relaxed font-sans">{result.predictedImpact}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="p-3 bg-surface rounded border border-white/5">
                <span className="text-[8px] font-bold text-ink-subdued uppercase tracking-widest block mb-1">
                  Est. Egress Recovery Timeline
                </span>
                <p className="text-sm font-bold text-brand-primary">{result.recoveryTime}</p>
              </div>

              <div className="p-3 bg-surface rounded border border-white/5 space-y-1.5">
                <span className="text-[8px] font-bold text-ink-subdued uppercase tracking-widest block mb-1">
                  Recommended Action Directives
                </span>
                <ul className="space-y-1">
                  {result.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-[10px] text-ink-muted leading-relaxed">
                      ✓ {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
