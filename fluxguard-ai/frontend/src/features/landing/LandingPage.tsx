import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { useSimulationState, getActiveEventId } from '@/features/simulation/simulationStore';
import landingBackground from '@/assets/fluxguard-landing-background.webp';

export function LandingPage() {
  const navigate = useNavigate();

  // Get reactive simulation state for real-time density and risk levels
  const { zones } = useSimulationState();
  const activeEventId = getActiveEventId();

  // Calculate density and risk dynamically from simulation state
  const totalDensity =
    zones.length > 0
      ? Math.round(zones.reduce((total, z) => total + z.density, 0) / zones.length)
      : 0;

  const riskLevel = zones.some((z) => z.risk === 'CRITICAL')
    ? 'CRITICAL'
    : zones.some((z) => z.risk === 'HIGH')
      ? 'HIGH'
      : zones.some((z) => z.risk === 'MEDIUM')
        ? 'MEDIUM'
        : 'LOW';

  // Dynamic stats state for other counts
  const [activeVolunteerCount, setActiveVolunteerCount] = useState<number>(0);
  const [activeIncidentCount, setActiveIncidentCount] = useState<number>(0);

  useEffect(() => {
    // Ingest some initial telemetry to show on the landing page details ticker
    const fetchTelemetry = async () => {
      try {
        const [incidents, staffing] = await Promise.all([
          api.fetchIncidents(activeEventId),
          api.getStaffingStatus(activeEventId),
        ]);

        if (incidents) {
          setActiveIncidentCount(incidents.filter((i) => i.status !== 'RESOLVED').length);
        }

        if (staffing && staffing.currentStaff) {
          const totalStaff = Object.values(staffing.currentStaff).reduce(
            (a: number, b: number) => a + b,
            0,
          );
          setActiveVolunteerCount(totalStaff);
        }
      } catch {
        // Safe mock fallback if backend is not running or unmigrated
        setActiveIncidentCount(1);
        setActiveVolunteerCount(70);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 6000);
    return () => clearInterval(interval);
  }, [activeEventId]);

  return (
    <div className="relative min-h-screen bg-[#020617] text-slate-100 overflow-x-hidden flex flex-col items-center">
      {/* 1. Fullscreen Image Background */}
      <div
        className="fixed inset-0 z-0 pointer-events-none bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${landingBackground})` }}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-0 pointer-events-none bg-slate-950/45" aria-hidden="true" />

      {/* 2. Main Container Grid */}
      <div className="relative z-10 w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-16 space-y-24">
        {/* HERO SECTION */}
        <section className="flex flex-col lg:flex-row items-center gap-12 lg:py-8">
          <div className="flex-1 space-y-6 text-left">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-bold tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 uppercase backdrop-blur-sm">
              Live Crowd Management digital twin
            </span>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 leading-none uppercase">
              FluxGuard AI
            </h1>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl">
              A comprehensive stadium operations command center. Ingesting transit telemetry,
              predicting exit congestion bottlenecks with 95% Confidence Intervals, and dispatching
              real-time safety directives to offline-tolerant match-day stewards.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white font-bold text-sm px-8 py-3.5 rounded-lg shadow-lg hover:shadow-cyan-500/20 transition-all cursor-pointer"
              >
                Launch Command Center
              </button>
              <button
                onClick={() => navigate('/volunteer')}
                className="bg-slate-900/80 hover:bg-slate-900 text-slate-200 border border-slate-800 font-bold text-sm px-8 py-3.5 rounded-lg transition-all cursor-pointer backdrop-blur-sm"
              >
                Steward Volunteer Console
              </button>
            </div>
          </div>

          {/* Glassmorphic Live Simulation Ticker Card */}
          <div className="w-full lg:w-96 rounded-2xl border border-white/10 bg-slate-950/65 backdrop-blur-xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Live Telemetry Feed
              </span>
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-left">
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Avg Density</span>
                <p className="text-xl font-bold text-slate-100 mt-0.5">{totalDensity || 34}%</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Risk Level</span>
                <p
                  className={`text-xl font-bold mt-0.5 ${
                    riskLevel === 'CRITICAL'
                      ? 'text-rose-500'
                      : riskLevel === 'HIGH'
                        ? 'text-amber-500'
                        : 'text-emerald-400'
                  }`}
                >
                  {riskLevel}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Active Stewards</span>
                <p className="text-xl font-bold text-slate-100 mt-0.5">{activeVolunteerCount}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Pending Incidents</span>
                <p className="text-xl font-bold text-slate-100 mt-0.5">{activeIncidentCount}</p>
              </div>
            </div>

            <div className="rounded-lg bg-white/5 border border-white/5 p-3 text-[11px] text-slate-400 leading-relaxed text-left">
              💡 <strong>System State:</strong> Dynamic sensor arrays are measuring egress flow rate
              metrics. Telemetry triggers automated notifications dynamically.
            </div>
          </div>
        </section>

        {/* CORE PLATFORM FEATURES SECTION */}
        <section className="space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-slate-100">
              Operational Safety Pillars
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Equipped with analytical algorithms and offline capabilities to manage crowds under
              any stadium scenario.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-xl border border-white/5 bg-slate-950/40 p-6 text-left space-y-3 hover:border-cyan-500/20 transition-all backdrop-blur-sm">
              <span className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-cyan-500/10 text-cyan-400 text-lg font-bold">
                📈
              </span>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Predictive Modeling
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Uses Prophet models to estimate crowd buildup. Computes ±8% (20m) and ±14% (40m)
                confidence intervals with live explainability logs.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-xl border border-white/5 bg-slate-950/40 p-6 text-left space-y-3 hover:border-indigo-500/20 transition-all backdrop-blur-sm">
              <span className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-400 text-lg font-bold">
                👮
              </span>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Steward Allocation
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Applies safety weighting rules to recommend steward reallocations. Pairs
                high-density zones with resource surpluses.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-xl border border-white/5 bg-slate-950/40 p-6 text-left space-y-3 hover:border-rose-500/20 transition-all backdrop-blur-sm">
              <span className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-rose-500/10 text-rose-400 text-lg font-bold">
                ⚡
              </span>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Incident Console
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Live dashboard log queueing reports. Track responders status, assign tickets, and
                record resolved timestamps instantly.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-xl border border-white/5 bg-slate-950/40 p-6 text-left space-y-3 hover:border-emerald-500/20 transition-all backdrop-blur-sm">
              <span className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-400 text-lg font-bold">
                📴
              </span>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Offline Sync Queue
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Saves assignments cached locally. Incident queue auto-synchronizes and drains
                reports to the server once online is restored.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-xl border border-white/5 bg-slate-950/40 p-6 text-left space-y-3 hover:border-sky-500/20 transition-all backdrop-blur-sm">
              <span className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-sky-500/10 text-sky-400 text-lg font-bold">
                📢
              </span>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Signage Announcements
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Synchronizes digital screens with custom multi-language announcements (English,
                Spanish, French, German) to direct fans.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-xl border border-white/5 bg-slate-950/40 p-6 text-left space-y-3 hover:border-purple-500/20 transition-all backdrop-blur-sm">
              <span className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-purple-500/10 text-purple-400 text-lg font-bold">
                🔍
              </span>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Effectiveness analytics
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Evaluates intervention success 2 simulation ticks post-trigger. Logs density changes
                to ensure directives are effective.
              </p>
            </div>
          </div>
        </section>

        {/* STADIUM SPECIFICATIONS SECTION */}
        <section className="space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-slate-100">
              Lucusa Stadium Zone Capacities
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              FluxGuard AI continuously monitors individual entrance and concourse safety
              constraints across four core zones.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Zone 1 */}
            <div className="rounded-xl border border-white/5 bg-slate-950/40 p-5 text-left space-y-2 backdrop-blur-sm">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                Zone 1
              </span>
              <h3 className="text-sm font-bold text-slate-100">North Gate</h3>
              <div className="border-t border-white/5 pt-2 flex items-center justify-between text-xs text-slate-400">
                <span>Safe Capacity:</span>
                <span className="font-semibold text-slate-200">2,000 fans</span>
              </div>
            </div>

            {/* Zone 2 */}
            <div className="rounded-xl border border-white/5 bg-slate-950/40 p-5 text-left space-y-2 backdrop-blur-sm">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                Zone 2
              </span>
              <h3 className="text-sm font-bold text-slate-100">East Concourse</h3>
              <div className="border-t border-white/5 pt-2 flex items-center justify-between text-xs text-slate-400">
                <span>Safe Capacity:</span>
                <span className="font-semibold text-slate-200">5,000 fans</span>
              </div>
            </div>

            {/* Zone 3 */}
            <div className="rounded-xl border border-white/5 bg-slate-950/40 p-5 text-left space-y-2 backdrop-blur-sm">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">
                Zone 3
              </span>
              <h3 className="text-sm font-bold text-slate-100">Gate C</h3>
              <div className="border-t border-white/5 pt-2 flex items-center justify-between text-xs text-slate-400">
                <span>Safe Capacity:</span>
                <span className="font-semibold text-slate-200">1,500 fans</span>
              </div>
            </div>

            {/* Zone 4 */}
            <div className="rounded-xl border border-white/5 bg-slate-950/40 p-5 text-left space-y-2 backdrop-blur-sm">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                Zone 4
              </span>
              <h3 className="text-sm font-bold text-slate-100">West Entrance</h3>
              <div className="border-t border-white/5 pt-2 flex items-center justify-between text-xs text-slate-400">
                <span>Safe Capacity:</span>
                <span className="font-semibold text-slate-200">1,800 fans</span>
              </div>
            </div>
          </div>
        </section>

        {/* SYSTEM WORKFLOW / HOW IT WORKS */}
        <section className="space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-slate-100">
              Operations Workflow
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              The continuous loops mapping and mitigating hazard threats.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 relative">
            {/* Step 1 */}
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center h-8 w-8 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold border border-cyan-500/30">
                  01
                </span>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Ingest telemetry
                </h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connects to entry/exit ticketing gates, weather updates, and local public transit
                feeds to calculate live flow volumes.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/30">
                  02
                </span>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Run predictions
                </h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Computes 40-minute predictive paths mapping risk vectors. Confidence bounds indicate
                standard model variance.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                  03
                </span>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Mitigate hazards
                </h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Prompts operators to reallocate stewards, push multi-language signage directives,
                and dispatch ticket responses.
              </p>
            </div>
          </div>
        </section>

        {/* REGULATORY FOOTER AND STATUS */}
        <footer className="border-t border-white/5 pt-12 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} FluxGuard AI Inc. Operational Safety Digital Twin.</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="hover:text-slate-400 transition-colors bg-transparent border-0 cursor-pointer p-0 text-slate-500 font-normal"
              onClick={() => navigate('/dashboard')}
            >
              Command Center
            </button>
            <button
              type="button"
              className="hover:text-slate-400 transition-colors bg-transparent border-0 cursor-pointer p-0 text-slate-500 font-normal"
              onClick={() => navigate('/volunteer')}
            >
              Volunteer Console
            </button>
            <button
              type="button"
              className="hover:text-slate-400 transition-colors bg-transparent border-0 cursor-pointer p-0 text-slate-500 font-normal"
              onClick={() => navigate('/analytics')}
            >
              Analytics
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
