import { useEffect, useState } from 'react';

import { Panel } from '@/components/ui';
import { api } from '@/services/api';
import type { BackendIncident } from '@/services/api';

import { useSimulationState, getActiveEventId } from '@/features/simulation/simulationStore';

const ZONE_LABELS: Record<string, string> = {
  '00000000-0000-0000-0000-000000000001': 'North Gate',
  '00000000-0000-0000-0000-000000000002': 'East Concourse',
  '00000000-0000-0000-0000-000000000003': 'Gate C',
  '00000000-0000-0000-0000-000000000004': 'West Entrance',
};

const RESPONDERS = ['Steward Dave', 'Steward Sarah', 'Medic Unit 1', 'Security Team Alpha'];

// Child component for a ticket with an active timer
function IncidentCard({
  incident,
  onDispatch,
  onResolve,
}: {
  incident: BackendIncident;
  onDispatch: (id: string, name: string) => Promise<void>;
  onResolve: (id: string) => Promise<void>;
}) {
  const [selectedResponder, setSelectedResponder] = useState(RESPONDERS[0]);
  const [elapsed, setElapsed] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (incident.status === 'RESOLVED') {
      setElapsed('Resolved');
      return;
    }

    const updateTimer = () => {
      const start = new Date(incident.createdAt).getTime();
      const now = Date.now();
      const diffSec = Math.floor((now - start) / 1000);
      if (diffSec < 0) {
        setElapsed('Just now');
        return;
      }
      const mins = Math.floor(diffSec / 60);
      const secs = diffSec % 60;
      setElapsed(`${mins}m ${secs}s ago`);
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [incident.createdAt, incident.status]);

  const handleDispatch = async () => {
    setIsSubmitting(true);
    try {
      await onDispatch(incident.id, selectedResponder);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async () => {
    setIsSubmitting(true);
    try {
      await onResolve(incident.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  const severityColors: Record<string, string> = {
    LOW: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse',
  };

  const statusColors: Record<string, string> = {
    REPORTED: 'border-red-500/30 bg-red-500/5',
    DISPATCHED: 'border-amber-500/30 bg-amber-500/5',
    RESOLVED: 'border-emerald-500/20 bg-emerald-500/5 opacity-60',
  };

  return (
    <div
      className={`rounded-lg border p-4 space-y-3 transition-all duration-300 ${
        statusColors[incident.status] || 'border-white/10'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${
                severityColors[incident.severity]
              }`}
            >
              {incident.severity}
            </span>
            <span className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">
              {incident.type}
            </span>
            <span className="text-xs font-semibold text-ink">
              {ZONE_LABELS[incident.zoneId] || 'Unknown Zone'}
            </span>
          </div>
          <p className="text-xs text-ink-muted">{incident.description}</p>
        </div>
        <div className="text-right text-[10px] font-mono text-ink-muted">
          <div>{elapsed}</div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-white/5 pt-3">
        <div className="text-[10px] text-ink-muted font-mono">
          {incident.status === 'REPORTED' && 'Status: Awaiting Dispatch'}
          {incident.status === 'DISPATCHED' && `Responder: ${incident.responderName}`}
          {incident.status === 'RESOLVED' && 'Status: Resolved successfully'}
        </div>

        <div className="flex items-center gap-2">
          {incident.status === 'REPORTED' && (
            <>
              <select
                value={selectedResponder}
                onChange={(e) => setSelectedResponder(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded px-2 py-1 text-xs text-ink cursor-pointer focus:outline-none"
              >
                {RESPONDERS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <button
                onClick={handleDispatch}
                disabled={isSubmitting}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] px-3 py-1 rounded transition-colors cursor-pointer select-none"
              >
                Dispatch
              </button>
            </>
          )}

          {incident.status === 'DISPATCHED' && (
            <button
              onClick={handleResolve}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] px-3 py-1 rounded transition-colors cursor-pointer select-none"
            >
              Resolve
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function IncidentConsole() {
  useSimulationState();
  const activeEventId = getActiveEventId();

  const [incidents, setIncidents] = useState<BackendIncident[]>([]);
  const [type, setType] = useState('MEDICAL');
  const [zoneId, setZoneId] = useState('00000000-0000-0000-0000-000000000001');
  const [severity, setSeverity] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTickets = async () => {
    try {
      const response = await api.fetchIncidents(activeEventId);
      // Sort: Critical/High/Medium/Low, and then active before resolved
      const severityOrder: Record<string, number> = {
        CRITICAL: 4,
        HIGH: 3,
        MEDIUM: 2,
        LOW: 1,
      };
      const sorted = [...response].sort((a, b) => {
        if (a.status === 'RESOLVED' && b.status !== 'RESOLVED') return 1;
        if (a.status !== 'RESOLVED' && b.status === 'RESOLVED') return -1;
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
      setIncidents(sorted);
    } catch (err) {
      console.warn('Failed to load incident tickets:', err);
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEventId]);

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    try {
      await api.createIncident(activeEventId, zoneId, type, severity, description);
      setDescription('');
      await fetchTickets();
    } catch (err) {
      console.error('Failed to report incident ticket:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDispatch = async (incidentId: string, responderName: string) => {
    try {
      await api.dispatchResponder(activeEventId, incidentId, responderName);
      await fetchTickets();
    } catch (err) {
      console.error('Failed to dispatch responder:', err);
    }
  };

  const handleResolve = async (incidentId: string) => {
    try {
      await api.resolveIncident(activeEventId, incidentId);
      await fetchTickets();
    } catch (err) {
      console.error('Failed to resolve incident:', err);
    }
  };

  return (
    <Panel
      eyebrow="Incident Control"
      title="Active Dispatch Console"
      aria-label="Incident tickets dispatch console"
    >
      <div className="space-y-6">
        {/* Report Form */}
        <form onSubmit={handleReport} className="rounded-xl border border-white/10 p-4 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            Report New Incident
          </h3>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label
                htmlFor="report-type"
                className="text-[10px] font-bold text-ink-muted uppercase"
              >
                Type
              </label>
              <select
                id="report-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="MEDICAL">Medical concern</option>
                <option value="SECURITY">Security issue</option>
                <option value="FACILITY">Facility hazard</option>
                <option value="CROWD_FLOW">Crowd bottleneck</option>
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="report-location"
                className="text-[10px] font-bold text-ink-muted uppercase"
              >
                Location
              </label>
              <select
                id="report-location"
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {Object.keys(ZONE_LABELS).map((id) => (
                  <option key={id} value={id}>
                    {ZONE_LABELS[id]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="report-severity"
                className="text-[10px] font-bold text-ink-muted uppercase"
              >
                Severity
              </label>
              <select
                id="report-severity"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="report-description"
              className="text-[10px] font-bold text-ink-muted uppercase"
            >
              Description
            </label>
            <div className="flex gap-2">
              <input
                id="report-description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="E.g., Spill on concourse floor, minor slip risk..."
                className="flex-1 bg-slate-900 border border-white/10 rounded px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={isSubmitting || !description.trim()}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs px-4 rounded transition-colors disabled:opacity-50 cursor-pointer select-none whitespace-nowrap"
              >
                Report
              </button>
            </div>
          </div>
        </form>

        {/* Incidents Queue */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            Incident queue ({incidents.length})
          </h3>

          {incidents.length === 0 ? (
            <div className="rounded-lg border border-white/5 bg-white/[0.01] p-6 text-center text-xs text-ink-muted">
              No reported safety incidents. Operations running smoothly.
            </div>
          ) : (
            <div className="grid gap-3 max-h-96 overflow-y-auto pr-1">
              {incidents.map((incident) => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  onDispatch={handleDispatch}
                  onResolve={handleResolve}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}
