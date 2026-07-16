import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Panel } from '@/components/ui';
import { api } from '@/services/api';
import type { BackendStaffingStatus, BackendStaffingSuggestion } from '@/services/api';

import { useSimulationState, getActiveEventId } from '@/features/simulation/simulationStore';

const ZONE_LABELS: Record<string, string> = {
  '00000000-0000-0000-0000-000000000001': 'North Gate',
  '00000000-0000-0000-0000-000000000002': 'East Concourse',
  '00000000-0000-0000-0000-000000000003': 'Gate C',
  '00000000-0000-0000-0000-000000000004': 'West Entrance',
};

export function StaffingPanel() {
  const sim = useSimulationState();
  const activeEventId = getActiveEventId();

  const [data, setData] = useState<BackendStaffingStatus | null>(null);
  const [isRedeploying, setIsRedeploying] = useState<string | null>(null);

  const fetchStaffing = async () => {
    try {
      const response = await api.getStaffingStatus(activeEventId);
      setData(response);
    } catch (err) {
      console.warn('Failed to load staffing status:', err);
    }
  };

  useEffect(() => {
    fetchStaffing();
    const interval = setInterval(fetchStaffing, 4000);
    return () => clearInterval(interval);
  }, [activeEventId]);

  const handleRedeploy = async (suggestion: BackendStaffingSuggestion, index: number) => {
    const key = `${suggestion.fromZoneId}-${suggestion.toZoneId}-${index}`;
    setIsRedeploying(key);
    try {
      await api.redeployStaff(
        activeEventId,
        suggestion.fromZoneId,
        suggestion.toZoneId,
        suggestion.count,
      );
      // Immediately refresh staffing allocations
      await fetchStaffing();
    } catch (err) {
      console.error('Failed to redeploy staff:', err);
    } finally {
      setIsRedeploying(null);
    }
  };

  if (!data) {
    return (
      <Panel
        eyebrow="Resources Allocation"
        title="Dynamic Staffing Optimizer"
        aria-label="Loading staffing recommendations"
      >
        <div className="flex h-64 items-center justify-center">
          <span className="text-sm text-ink-muted">Loading staffing status...</span>
        </div>
      </Panel>
    );
  }

  // Map backend stats into Recharts format
  const chartData = Object.keys(data.currentStaff).map((zoneId) => ({
    name: ZONE_LABELS[zoneId] || zoneId.substring(0, 8),
    current: data.currentStaff[zoneId] || 0,
    recommended: data.recommendedStaff[zoneId] || 0,
  }));

  return (
    <Panel
      eyebrow="Resources Allocation"
      title="Dynamic Staffing Optimizer"
      aria-label="Staffing and resources allocation console"
    >
      <div className="space-y-6">
        {/* Current vs Recommended Bar Chart */}
        <div className="h-64" role="img" aria-label="Staff allocation bar chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 18, bottom: 8, left: -20 }}>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.16)" vertical={false} />
              <XAxis dataKey="name" stroke="#a7b4c8" tickLine={false} axisLine={false} />
              <YAxis stroke="#a7b4c8" tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: '#0d1b2e',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '8px',
                  color: '#f8fafc',
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Bar name="Current Stewards" dataKey="current" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              <Bar
                name="Recommended Allocation"
                dataKey="recommended"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Predictive Staffing Alerts */}
        {data.alerts && data.alerts.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500">
              Predictive Staffing Alerts ({data.alerts.length})
            </h3>
            <div className="grid gap-2">
              {data.alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-400 flex items-start gap-2.5"
                  data-testid="predictive-staffing-alert"
                >
                  <span className="text-sm">⚠️</span>
                  <span>{alert}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Redeployment Suggestions */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            Optimization Directives ({data.suggestions.length})
          </h3>
          {data.suggestions.length === 0 ? (
            <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-4 text-center">
              <span className="text-xs font-medium text-emerald-400">
                ✓ Staffing levels are fully optimized for all active zone risk profiles.
              </span>
            </div>
          ) : (
            <div className="grid gap-3 max-h-64 overflow-y-auto pr-1">
              {data.suggestions.map((suggestion, index) => {
                const key = `${suggestion.fromZoneId}-${suggestion.toZoneId}-${index}`;
                const loading = isRedeploying === key;
                return (
                  <div
                    key={key}
                    className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between hover:border-white/20 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
                          Redeploy Count: {suggestion.count}
                        </span>
                        <span className="text-xs font-semibold text-ink">
                          {ZONE_LABELS[suggestion.fromZoneId]} → {ZONE_LABELS[suggestion.toZoneId]}
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted">{suggestion.reason}</p>
                    </div>
                    <button
                      onClick={() => handleRedeploy(suggestion, index)}
                      disabled={loading || isRedeploying !== null}
                      className="inline-flex items-center justify-center rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-cyan-500 disabled:opacity-50 transition-colors cursor-pointer select-none"
                    >
                      {loading ? 'Dispatching...' : 'Dispatch stewards'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}
