import { useEffect, useState } from 'react';
import { Panel } from '@/components/ui';
import { api, type BackendIncident } from '@/services/api';

const EVENT_ID = 'e0000000-0000-0000-0000-000000000000';

const ZONE_LABELS: Record<string, string> = {
  '00000000-0000-0000-0000-000000000001': 'North Gate',
  '00000000-0000-0000-0000-000000000002': 'East Concourse',
  '00000000-0000-0000-0000-000000000003': 'Gate C',
  '00000000-0000-0000-0000-000000000004': 'West Entrance',
};

interface VolunteerTask {
  id: number;
  text: string;
  completed: boolean;
}

const DEFAULT_TASKS: VolunteerTask[] = [
  { id: 1, text: 'Steward Post #4: Ensure exit lanes at North Gate are clear', completed: false },
  {
    id: 2,
    text: 'Verify dynamically updated signage at East Concourse matches directives',
    completed: false,
  },
  { id: 3, text: 'Standby at Gate C for active crowd redirection support', completed: false },
  { id: 4, text: 'Perform turnstile entry sensor visual checks', completed: false },
];

export function VolunteerPage() {
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

  const [tasks, setTasks] = useState<VolunteerTask[]>(() => {
    const saved = localStorage.getItem('fluxguard-volunteer-tasks');
    return saved ? JSON.parse(saved) : DEFAULT_TASKS;
  });

  const [incidents, setIncidents] = useState<BackendIncident[]>(() => {
    const saved = localStorage.getItem('fluxguard-volunteer-incidents');
    return saved ? JSON.parse(saved) : [];
  });

  // Form State
  const [type, setType] = useState('MEDICAL');
  const [zoneId, setZoneId] = useState('00000000-0000-0000-0000-000000000001');
  const [severity, setSeverity] = useState('LOW');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const [syncedCount, setSyncedCount] = useState(0);

  // Persistence hooks
  useEffect(() => {
    localStorage.setItem('fluxguard-volunteer-queue', JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  useEffect(() => {
    localStorage.setItem('fluxguard-volunteer-tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Sync Queue when transitioning from Offline to Online
  const syncQueue = async (currentQueue: typeof offlineQueue) => {
    if (currentQueue.length === 0) return;
    setIsSubmitting(true);
    let successCount = 0;
    for (const item of currentQueue) {
      try {
        await api.createIncident(EVENT_ID, item.zoneId, item.type, item.severity, item.description);
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
    // Reload incidents log
    loadIncidents(false);
  };

  const loadIncidents = async (silentOfflineCheck: boolean) => {
    if (isOffline || silentOfflineCheck) return;
    try {
      const data = await api.fetchIncidents(EVENT_ID);
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

    // Initial load
    loadIncidents(isOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOffline]);

  // Handle Manual Connection State Toggle
  const toggleOfflineState = () => {
    const nextState = !isOffline;
    setIsOffline(nextState);
    if (!nextState) {
      // Transitioning to online -> sync
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
      // Queue offline
      setOfflineQueue((prev) => [...prev, payload]);
      setDescription('');
    } else {
      setIsSubmitting(true);
      try {
        await api.createIncident(EVENT_ID, zoneId, type, severity, description.trim());
        setDescription('');
        loadIncidents(false);
      } catch (err) {
        console.error('Failed to report incident', err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const toggleTask = (taskId: number) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)));
  };

  return (
    <div className="space-y-6">
      {/* Synchronization Banner Notification */}
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

      {/* Network Status Header Panel */}
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
        {/* Left Side: Duties & Checklist + Observations form */}
        <div className="space-y-6">
          {/* Duties Checklist Panel */}
          <Panel eyebrow="Steward Duty roster" title="My Active Assignments">
            <div className="space-y-3.5">
              {tasks.map((task) => (
                <label
                  key={task.id}
                  className={`flex items-start gap-3 rounded-lg border border-white/5 bg-slate-950/20 p-3.5 cursor-pointer transition-all hover:bg-white/[0.02] ${
                    task.completed ? 'opacity-50' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    className="mt-0.5 w-4 h-4 accent-cyan-500 rounded border-white/10 bg-slate-900 cursor-pointer"
                  />
                  <span
                    className={`text-xs text-ink leading-relaxed ${task.completed ? 'line-through text-ink-muted' : ''}`}
                  >
                    {task.text}
                  </span>
                </label>
              ))}
            </div>
          </Panel>

          {/* Incident Reporter Form */}
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
                    {Object.keys(ZONE_LABELS).map((id) => (
                      <option key={id} value={id}>
                        {ZONE_LABELS[id]}
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
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="volt-desc"
                  className="text-[10px] font-bold text-ink-muted uppercase"
                >
                  Description
                </label>
                <div className="flex gap-2">
                  <input
                    id="volt-desc"
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="E.g., Congestion build-up near gate C entry turnstiles..."
                    className="flex-1 bg-slate-900 border border-white/10 rounded px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !description.trim()}
                    className={`font-bold text-xs px-4 rounded transition-colors disabled:opacity-50 cursor-pointer select-none whitespace-nowrap text-white ${
                      isOffline
                        ? 'bg-amber-600 hover:bg-amber-500'
                        : 'bg-cyan-600 hover:bg-cyan-500'
                    }`}
                  >
                    {isOffline ? 'Queue Report' : 'Send Report'}
                  </button>
                </div>
              </div>
            </form>
          </Panel>
        </div>

        {/* Right Side: Log of incidents (Live or cached) */}
        <div className="space-y-6">
          <Panel eyebrow="Command Incidents Log" title="Local Safety Incident Log">
            <div className="space-y-4">
              {/* Local Offline Queue */}
              {offlineQueue.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Offline Sync Queue ({offlineQueue.length})
                  </h4>
                  {offlineQueue.map((item, idx) => (
                    <div
                      key={idx}
                      className="border border-dashed border-amber-500/20 bg-amber-500/5 rounded-lg p-3 flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-amber-300">{item.type} (PENDING SYNC)</span>
                        <span className="text-ink-muted">
                          {ZONE_LABELS[item.zoneId] || 'Stadium'}
                        </span>
                      </div>
                      <p className="text-xs text-ink">{item.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Incidents Feed */}
              <div className="space-y-2.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                  Cached Active Incident Queue ({incidents.length})
                </h4>

                {incidents.length === 0 ? (
                  <div className="text-center py-8 text-xs text-ink-muted border border-dashed border-white/10 rounded-lg">
                    No safety incidents logged.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {incidents.map((inc) => (
                      <div
                        key={inc.id}
                        className="border border-white/5 bg-slate-950/20 rounded-lg p-3 flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-semibold text-brand-secondary">
                            {inc.type} - {inc.severity}
                          </span>
                          <span className="text-ink-muted">
                            {ZONE_LABELS[inc.zoneId] || 'Stadium'}
                          </span>
                        </div>
                        <p className="text-xs text-ink">{inc.description}</p>
                        <div className="flex items-center justify-between text-[10px] text-ink-muted mt-1 border-t border-white/5 pt-1.5">
                          <span>
                            Status: <strong className="uppercase text-ink">{inc.status}</strong>
                          </span>
                          {inc.responderName && <span>Responder: {inc.responderName}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
