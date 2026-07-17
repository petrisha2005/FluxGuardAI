import { useEffect, useState } from 'react';
import { Panel } from '@/components/ui';
import { api, type BackendIncident } from '@/services/api';
import {
  getActiveEventId,
  getUuidFromSimId,
  useSimulationState,
} from '@/features/simulation/simulationStore';

const FALLBACK_ZONE_LABELS: Record<string, string> = {
  '00000000-0000-0000-0000-000000000001': 'North Gate',
  '00000000-0000-0000-0000-000000000002': 'East Concourse',
  '00000000-0000-0000-0000-000000000003': 'Gate C',
  '00000000-0000-0000-0000-000000000004': 'West Entrance',
};

interface VolunteerTask {
  id: string;
  text: string;
  completed: boolean;
  priority?: boolean;
}

export function VolunteerPage() {
  const sim = useSimulationState();
  const activeEventId = getActiveEventId();

  const [isOffline, setIsOffline] = useState(() => {
    if (typeof window !== 'undefined') {
      return !window.navigator.onLine;
    }
    return false;
  });

  const [offlineQueue, setOfflineQueue] = useState<
    Omit<
      BackendIncident,
      'id' | 'eventId' | 'createdAt' | 'resolvedAt' | 'responderName' | 'status'
    >[]
  >(() => {
    const saved = localStorage.getItem('fluxguard-volunteer-queue');
    return saved ? JSON.parse(saved) : [];
  });

  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('fluxguard-volunteer-completed-tasks');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [incidents, setIncidents] = useState<BackendIncident[]>(() => {
    const saved = localStorage.getItem('fluxguard-volunteer-incidents');
    return saved ? JSON.parse(saved) : [];
  });

  // Dynamic Zone Labels
  const zoneLabels: Record<string, string> = {};
  sim.zones.forEach((z) => {
    const uuid = getUuidFromSimId(z.id);
    if (uuid) {
      zoneLabels[uuid] = z.name;
    }
  });
  const finalZoneLabels = Object.keys(zoneLabels).length > 0 ? zoneLabels : FALLBACK_ZONE_LABELS;

  // Form State
  const [type, setType] = useState('MEDICAL');
  const [zoneId, setZoneId] = useState('');
  const [severity, setSeverity] = useState('LOW');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const [syncedCount, setSyncedCount] = useState(0);

  // Set default zone ID in dropdown on load
  useEffect(() => {
    const keys = Object.keys(finalZoneLabels);
    if (keys.length > 0 && !zoneId) {
      setZoneId(keys[0]);
    }
  }, [finalZoneLabels, zoneId]);

  // Persistence hooks
  useEffect(() => {
    localStorage.setItem('fluxguard-volunteer-queue', JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  useEffect(() => {
    localStorage.setItem(
      'fluxguard-volunteer-completed-tasks',
      JSON.stringify(Array.from(completedTaskIds)),
    );
  }, [completedTaskIds]);

  // Sync Queue when transitioning from Offline to Online
  const syncQueue = async (currentQueue: typeof offlineQueue) => {
    if (currentQueue.length === 0) return;
    setIsSubmitting(true);
    let successCount = 0;
    for (const item of currentQueue) {
      try {
        await api.createIncident(
          activeEventId,
          item.zoneId,
          item.type,
          item.severity,
          item.description,
        );
        successCount++;
      } catch (err) {
        console.error('Failed to sync offline incident report', err);
      }
    }
    setSyncedCount(successCount);
    setShowSyncSuccess(true);
    setOfflineQueue([]);
    localStorage.removeItem('fluxguard-volunteer-queue');
    setIsSubmitting(false);
    setTimeout(() => setShowSyncSuccess(false), 5000);
    loadIncidents(false);
  };

  const loadIncidents = async (silentOfflineCheck: boolean) => {
    if (isOffline || silentOfflineCheck) return;
    try {
      const data = await api.fetchIncidents(activeEventId);
      setIncidents(data);
      localStorage.setItem('fluxguard-volunteer-incidents', JSON.stringify(data));
    } catch (err) {
      console.error('Failed to fetch incidents', err);
    }
  };

  // Browser Network Events Hook
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      syncQueue(offlineQueue);
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    loadIncidents(isOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOffline, activeEventId]);

  const toggleOfflineState = () => {
    const nextState = !isOffline;
    setIsOffline(nextState);
    if (!nextState) {
      syncQueue(offlineQueue);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const payload = {
      zoneId,
      type,
      severity,
      description: description.trim(),
    };

    if (isOffline) {
      setOfflineQueue((prev) => [...prev, payload]);
      setDescription('');
    } else {
      setIsSubmitting(true);
      try {
        await api.createIncident(activeEventId, zoneId, type, severity, description.trim());
        setDescription('');
        loadIncidents(false);
      } catch (err) {
        console.error('Failed to report incident', err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Generate dynamic posture-driven volunteer tasks checklist
  const dynamicTasks: VolunteerTask[] = [];

  if (sim.isEvacuationActive) {
    dynamicTasks.push({
      id: 'evac-alert-1',
      text: '🚨 EMERGENCY EVACUATION ACTIVE: Direct concourse crowds toward the nearest exits.',
      completed: completedTaskIds.has('evac-alert-1'),
      priority: true,
    });
    dynamicTasks.push({
      id: 'evac-alert-2',
      text: '🚨 Assist stewards at entry gates with turnstile override and safe clearance guides.',
      completed: completedTaskIds.has('evac-alert-2'),
      priority: true,
    });
    dynamicTasks.push({
      id: 'evac-alert-3',
      text: '🚨 Report any exit blockages or casualties directly to the command center.',
      completed: completedTaskIds.has('evac-alert-3'),
      priority: true,
    });
  } else {
    // Detours Check
    const closedDetourZone = sim.zones.find((z) => z.status === 'closed' && z.detourTargetId);
    if (closedDetourZone) {
      const targetZone = sim.zones.find((z) => z.id === closedDetourZone.detourTargetId);
      const targetName = targetZone ? targetZone.name : 'detour gate';
      dynamicTasks.push({
        id: 'detour-task',
        text: `⚡ REDIRECT FLOW: Assist crowd detouring from closed gate ${closedDetourZone.name} to ${targetName}.`,
        completed: completedTaskIds.has('detour-task'),
        priority: true,
      });
    }

    // Congestion Check
    const highDensityZone = sim.zones.find((z) => z.density > 75);
    if (highDensityZone) {
      dynamicTasks.push({
        id: 'congestion-task',
        text: `⚠️ CONGESTION CONTROL: Crowd density is at ${highDensityZone.density}% in ${highDensityZone.name}. Assist with traffic flow.`,
        completed: completedTaskIds.has('congestion-task'),
        priority: true,
      });
    }

    // Default checklist tasks
    const firstConcourse = sim.zones.find((z) => z.type === 'concourse') || { name: 'Concourse' };
    const firstGate = sim.zones.find((z) => z.type === 'gate') || { name: 'Entrance' };

    dynamicTasks.push({
      id: 'default-1',
      text: `Monitor turnstile entry speeds and queue lines at ${firstGate.name}.`,
      completed: completedTaskIds.has('default-1'),
    });
    dynamicTasks.push({
      id: 'default-2',
      text: `Inspect dynamical LED display screens at ${firstConcourse.name} to verify guidance broadcasts.`,
      completed: completedTaskIds.has('default-2'),
    });
    dynamicTasks.push({
      id: 'default-3',
      text: 'Standby for active crowd redirection prompts from AI Advisor.',
      completed: completedTaskIds.has('default-3'),
    });
  }

  const toggleTask = (taskId: string) => {
    setCompletedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Sync Banner */}
      {showSyncSuccess && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-400 text-xs font-semibold flex items-center justify-between shadow-[0_4px_20px_rgba(16,185,129,0.1)] transition-all animate-bounce">
          <div className="flex items-center gap-2">
            <span>🔄</span>
            <span>
              Connection restored! Successfully synchronized {syncedCount} queued reports with
              Command Center.
            </span>
          </div>
          <button
            onClick={() => setShowSyncSuccess(false)}
            className="hover:text-emerald-300 font-bold px-1.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Network Status Header */}
      <div className="rounded-2xl border border-white/10 bg-surface-elevated/40 backdrop-blur p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold tracking-tight text-ink">Volunteer Command Dashboard</h2>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${isOffline ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              {isOffline ? 'Offline Mode Active' : 'Live Connected Mode'}
            </span>
          </div>
        </div>

        <button
          onClick={toggleOfflineState}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all select-none cursor-pointer ${
            isOffline
              ? 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-600/30'
              : 'bg-white/5 hover:bg-white/10 text-ink border border-white/10'
          }`}
        >
          {isOffline ? 'Simulate Online Reconnection' : 'Simulate Network Outage'}
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Active Assignments */}
        <div className="space-y-6">
          <Panel eyebrow="Steward Duty roster" title="My Active Assignments">
            <div className="space-y-3.5">
              {dynamicTasks.map((task) => (
                <label
                  key={task.id}
                  className={`flex items-start gap-3 rounded-lg border p-3.5 cursor-pointer transition-all hover:bg-white/[0.02] ${
                    task.priority
                      ? 'border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10'
                      : 'border-white/5 bg-slate-950/20'
                  } ${task.completed ? 'opacity-40' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    className="mt-0.5 w-4 h-4 accent-cyan-500 rounded border-white/10 bg-slate-900 cursor-pointer"
                  />
                  <span
                    className={`text-xs text-ink leading-relaxed ${
                      task.completed ? 'line-through text-ink-muted' : ''
                    } ${task.priority ? 'font-semibold text-rose-300' : ''}`}
                  >
                    {task.text}
                  </span>
                </label>
              ))}
            </div>
          </Panel>

          {/* Observations Form */}
          <Panel eyebrow="Field Observations" title="Report Crowd Incident">
            <form onSubmit={handleReport} className="space-y-4">
              {isOffline && (
                <div className="rounded-lg border border-amber-500/10 bg-amber-500/5 p-3 text-[10px] text-amber-400 font-semibold leading-relaxed">
                  ⚠️ Device is offline. Observations reported now will be stored locally in queue (
                  {offlineQueue.length} pending) and auto-synced upon reconnecting.
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <label
                    htmlFor="volt-type"
                    className="text-[10px] font-bold text-ink-muted uppercase"
                  >
                    Type
                  </label>
                  <select
                    id="volt-type"
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
                    htmlFor="volt-location"
                    className="text-[10px] font-bold text-ink-muted uppercase"
                  >
                    Location
                  </label>
                  <select
                    id="volt-location"
                    value={zoneId}
                    onChange={(e) => setZoneId(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    {Object.keys(finalZoneLabels).map((id) => (
                      <option key={id} value={id}>
                        {finalZoneLabels[id]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="volt-severity"
                    className="text-[10px] font-bold text-ink-muted uppercase"
                  >
                    Severity
                  </label>
                  <select
                    id="volt-severity"
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="volt-description"
                  className="text-[10px] font-bold text-ink-muted uppercase"
                >
                  Details / Notes
                </label>
                <textarea
                  id="volt-description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe location, crowd sizes, or specific safety concerns..."
                  className="w-full bg-slate-900 border border-white/10 rounded p-2.5 text-xs text-ink focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-black text-xs font-bold transition-all"
              >
                {isSubmitting
                  ? 'Reporting...'
                  : isOffline
                    ? 'Queue Offline Report'
                    : 'Send Report to Command'}
              </button>
            </form>
          </Panel>
        </div>

        {/* Right Side: Log of Reported incidents */}
        <div className="space-y-6">
          <Panel eyebrow="Command Center Feed" title="Recent Field Logs">
            <div className="divide-y divide-white/5 space-y-4">
              {incidents.length === 0 ? (
                <div className="py-8 text-center text-xs text-ink-muted">
                  No incidents reported yet.
                </div>
              ) : (
                incidents.map((incident) => (
                  <div key={incident.id} className="pt-4 first:pt-0 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-2xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded font-black text-3xs border ${
                            incident.severity === 'HIGH'
                              ? 'bg-rose-950 text-rose-400 border-rose-800/40'
                              : incident.severity === 'MEDIUM'
                                ? 'bg-amber-950 text-amber-400 border-amber-800/40'
                                : 'bg-white/5 text-ink-muted border-white/10'
                          }`}
                        >
                          {incident.severity}
                        </span>
                        <span className="font-semibold uppercase tracking-wider text-ink-subdued">
                          {incident.type}
                        </span>
                      </div>
                      <span className="text-ink-muted font-mono">
                        {new Date(incident.createdAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-xs text-ink leading-relaxed">{incident.description}</p>

                    <div className="flex items-center justify-between text-3xs text-ink-muted font-mono">
                      <span>Location: {finalZoneLabels[incident.zoneId] || 'Unknown'}</span>
                      <span className="capitalize">Status: {incident.status.toLowerCase()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
