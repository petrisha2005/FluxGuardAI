import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import type {
  AutonomousDecision,
  ExecutionRecord,
  LearningRecord,
  VisionAssessResult,
} from '@/services/api';
import { AgentStatusPanel } from './AgentStatusPanel';
import { ActionApprovalCard } from './ActionApprovalCard';
import { DecisionHistory } from './DecisionHistory';
import { RoleGuard } from '@/features/auth';
import { EmptyState } from '@/components/ui';
export function AutonomousCommandCenter() {
  // Global States
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [decisions, setDecisions] = useState<AutonomousDecision[]>([]);
  const [executionHistory, setExecutionHistory] = useState<ExecutionRecord[]>([]);
  const [learningRecords, setLearningRecords] = useState<LearningRecord[]>([]);

  // CCTV Scanning Form States
  const [selectedCamera, setSelectedCamera] = useState('CAM-101');
  const [mockPeopleCount, setMockPeopleCount] = useState(1200);
  const [mockDensity, setMockDensity] = useState('MEDIUM');
  const [visionResult, setVisionResult] = useState<VisionAssessResult | null>(null);
  const [isAssessorLoading, setIsAssessorLoading] = useState(false);

  // Status message states
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Fetch all initial data
  const fetchData = async () => {
    try {
      const modeData = await api.fetchAutonomousMode();
      setIsAutoMode(modeData.enabled);

      const pending = await api.fetchPendingDecisions();
      setDecisions(pending);

      const history = await api.fetchExecutionHistory();
      setExecutionHistory(history);

      const learning = await api.fetchLearningRecords();
      setLearningRecords(learning);
    } catch (err) {
      console.error('Failed to sync autonomous data:', err);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll data every 4 seconds to sync state
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleMode = async () => {
    const nextState = !isAutoMode;
    try {
      const res = await api.toggleAutonomousMode(nextState);
      setIsAutoMode(res.enabled);
      setStatusMessage({
        text: `Autonomous operations Mode switched to ${res.enabled ? 'ENABLED' : 'DISABLED'}`,
        type: 'info',
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error('Failed to toggle autonomous mode:', err);
    }
  };

  const handleApprove = async (decisionId: string, operatorName: string) => {
    try {
      await api.approveDecision(decisionId, operatorName);
      setStatusMessage({
        text: `Decision ${decisionId} approved and executed successfully.`,
        type: 'success',
      });
      setTimeout(() => setStatusMessage(null), 4000);
      // Immediately refresh list
      fetchData();
    } catch (err) {
      setStatusMessage({
        text: `Approval failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        type: 'error',
      });
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleReject = async (decisionId: string) => {
    try {
      await api.rejectDecision(decisionId);
      setStatusMessage({
        text: `Decision ${decisionId} rejected and cancelled.`,
        type: 'info',
      });
      setTimeout(() => setStatusMessage(null), 4000);
      // Immediately refresh list
      fetchData();
    } catch (err) {
      setStatusMessage({
        text: `Rejection failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        type: 'error',
      });
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleVisionAssess = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAssessorLoading(true);
    try {
      const zoneName =
        selectedCamera === 'CAM-101'
          ? 'Gate A Ingress'
          : selectedCamera === 'CAM-102'
            ? 'Gate B Ingress'
            : 'North Stand Escalators';
      const res = await api.assessCameraFeed({
        cameraId: selectedCamera,
        zone: zoneName,
        estimatedPeople: mockPeopleCount,
        density: mockDensity,
      });
      setVisionResult(res);
    } catch (err) {
      console.error('Failed to run CCTV crowd assessment:', err);
    } finally {
      setIsAssessorLoading(false);
    }
  };

  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-6"
    >
      {/* Page Header with autonomous controls */}
      <section className="rounded-xl border border-white/5 bg-surface-elevated/20 p-6 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="rounded bg-brand-primary/10 px-2 py-0.5 font-mono text-[9px] font-bold text-brand-primary uppercase tracking-wider">
            Self-Optimizing Core
          </span>
          <h1 className="mt-2 text-2xl font-black text-ink uppercase tracking-tight">
            Autonomous Command Center
          </h1>
          <p className="text-xs text-ink-subdued mt-1">
            Observe, predict, decide, approve, and learn via cognitive closed-loop agents.
          </p>
        </div>

        {/* Global Shield State Control */}
        <div className="flex flex-col items-center md:items-end gap-2">
          <div className="flex items-center gap-3">
            <span
              className={`font-mono text-xs font-bold uppercase tracking-wider ${isAutoMode ? 'text-emerald-400' : 'text-amber-500'}`}
            >
              {isAutoMode ? '⚡ Autonomous Mode Active' : '⚠ Operator Verification Shield Active'}
            </span>
            <RoleGuard
              allowedRoles={['GLOBAL_OPERATIONS_DIRECTOR', 'STADIUM_MANAGER', 'SUPER_ADMIN']}
              fallback={
                <button
                  disabled
                  className="relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-zinc-700 opacity-50"
                  aria-label="Toggle autonomous operations mode"
                  title="Verification clearance required to toggle autonomous mode."
                >
                  <span className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-0" />
                </button>
              }
            >
              <button
                onClick={handleToggleMode}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isAutoMode
                    ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                    : 'bg-zinc-700'
                }`}
                aria-label="Toggle autonomous operations mode"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isAutoMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </RoleGuard>
          </div>
          <span className="text-[10px] text-ink-subdued uppercase tracking-widest font-mono">
            {isAutoMode
              ? 'Shield active: AI automatically executes highly confident decisions'
              : 'Shield status: requires explicit operator signatures'}
          </span>
        </div>
      </section>

      {/* Notifications Banner */}
      {statusMessage && (
        <div
          className={`rounded-lg border p-4 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
              : statusMessage.type === 'error'
                ? 'border-red-500/20 bg-red-500/10 text-red-400'
                : 'border-cyan-500/20 bg-cyan-500/10 text-cyan-400'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-current hover:opacity-80">
            [x]
          </button>
        </div>
      )}

      {/* Dual Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns - Decisions & Vision (Width: 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Decisions / Queue */}
          <section className="rounded-xl border border-white/5 bg-surface-elevated/40 p-5 backdrop-blur-md">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-ink">
                  Pending AI Operational Directives
                </h2>
                <p className="text-[11px] text-ink-subdued">
                  Human-in-the-loop decisions awaiting validation signatures
                </p>
              </div>
              <button
                onClick={fetchData}
                className="rounded border border-white/5 bg-surface px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-ink-subdued hover:text-ink hover:bg-white/5"
              >
                Sync Feed
              </button>
            </div>

            {decisions.length === 0 ? (
              <EmptyState
                icon="🛡️"
                title="All Operations Fully Optimized"
                description="Specialized cognitive agents are not proposing any immediate safety or transport overrides."
              />
            ) : (
              <div className="space-y-4">
                {decisions.map((decision) => (
                  <ActionApprovalCard
                    key={decision.id}
                    decision={decision}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                ))}
              </div>
            )}
          </section>

          {/* CCTV Vision Simulation Assessor */}
          <section className="rounded-xl border border-white/5 bg-surface-elevated/40 p-5 backdrop-blur-md">
            <div className="mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-ink">
                Computer Vision Camera Density Assessor
              </h2>
              <p className="text-[11px] text-ink-subdued">
                Simulate CCTV scanner feeds to trigger safety and flow heuristics
              </p>
            </div>

            <form
              onSubmit={handleVisionAssess}
              className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end mb-6"
            >
              <div>
                <label
                  htmlFor="cam-select"
                  className="text-[9px] font-mono text-ink-subdued uppercase tracking-wider block mb-1"
                >
                  Camera Feed
                </label>
                <select
                  id="cam-select"
                  value={selectedCamera}
                  onChange={(e) => setSelectedCamera(e.target.value)}
                  className="w-full rounded border border-white/10 bg-surface px-2.5 py-1.5 text-xs text-ink focus:border-brand-primary focus:outline-none"
                >
                  <option value="CAM-101">CAM-101 (Gate A Ingress)</option>
                  <option value="CAM-102">CAM-102 (Gate B Ingress)</option>
                  <option value="CAM-103">CAM-103 (North Escalator)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="people-count"
                  className="text-[9px] font-mono text-ink-subdued uppercase tracking-wider block mb-1"
                >
                  Estimated People
                </label>
                <input
                  id="people-count"
                  type="number"
                  value={mockPeopleCount}
                  onChange={(e) => setMockPeopleCount(Number(e.target.value))}
                  min={0}
                  max={5000}
                  className="w-full rounded border border-white/10 bg-surface px-2.5 py-1.5 text-xs text-ink focus:border-brand-primary focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="density-select"
                  className="text-[9px] font-mono text-ink-subdued uppercase tracking-wider block mb-1"
                >
                  Density State
                </label>
                <select
                  id="density-select"
                  value={mockDensity}
                  onChange={(e) => setMockDensity(e.target.value)}
                  className="w-full rounded border border-white/10 bg-surface px-2.5 py-1.5 text-xs text-ink focus:border-brand-primary focus:outline-none"
                >
                  <option value="LOW">LOW (Uncongested)</option>
                  <option value="MEDIUM">MEDIUM (Moderate Queue)</option>
                  <option value="HIGH">HIGH (Bottleneck/Heavy)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isAssessorLoading}
                className="w-full rounded bg-brand-secondary px-4 py-2 text-xs font-bold uppercase tracking-wider text-surface hover:bg-brand-secondary/90 transition-colors focus:outline-none disabled:opacity-50"
              >
                {isAssessorLoading ? 'Analyzing...' : 'Analyze CCTV'}
              </button>
            </form>

            {visionResult && (
              <div className="rounded-lg border border-white/5 bg-surface/50 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <span className="font-mono text-xs font-bold text-ink">
                    {visionResult.cameraId} Analysis Report
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 font-mono text-[9px] font-bold uppercase ${
                        visionResult.riskLevel === 'CRITICAL'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/25'
                          : visionResult.riskLevel === 'MEDIUM'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                      }`}
                    >
                      Risk: {visionResult.riskLevel}
                    </span>
                    <span className="font-mono text-[9px] text-ink-subdued uppercase">
                      Movement: {visionResult.abnormalMovementDetected ? '⚠ Anomalous' : '✓ Normal'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[11px]">
                  <div>
                    <span className="text-ink-subdued uppercase tracking-widest text-[9px] font-mono">
                      Assessed People
                    </span>
                    <p className="font-bold text-ink">{visionResult.estimatedPeople}</p>
                  </div>
                  <div>
                    <span className="text-ink-subdued uppercase tracking-widest text-[9px] font-mono">
                      Density Indicator
                    </span>
                    <p className="font-bold text-ink">{visionResult.density}</p>
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-[9px] font-mono text-ink-subdued uppercase">
                    <span>Severity Impact Score</span>
                    <span className="font-bold text-brand-primary">
                      {visionResult.riskScore}/100
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        visionResult.riskScore >= 75
                          ? 'bg-red-500'
                          : visionResult.riskScore >= 45
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                      }`}
                      style={{ width: `${visionResult.riskScore}%` }}
                    />
                  </div>
                </div>

                <div className="rounded border border-brand-primary/10 bg-brand-primary/5 p-3 text-[11px] leading-relaxed text-brand-primary">
                  💡 **CCTV Recommendation**: {visionResult.operationalRecommendation}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right Column - Agent Status Panel (Width: 1/3) */}
        <div>
          <AgentStatusPanel />
        </div>
      </div>

      {/* Full Width Bottom Row - History logs */}
      <section>
        <DecisionHistory executionHistory={executionHistory} learningRecords={learningRecords} />
      </section>
    </main>
  );
}
