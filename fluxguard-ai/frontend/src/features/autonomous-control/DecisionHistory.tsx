import React, { useState } from 'react';
import type { ExecutionRecord, LearningRecord } from '@/services/api';

interface DecisionHistoryProps {
  executionHistory: ExecutionRecord[];
  learningRecords: LearningRecord[];
}

export function DecisionHistory({ executionHistory, learningRecords }: DecisionHistoryProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'learning'>('history');

  const formatTimestamp = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="rounded-xl border border-white/5 bg-surface-elevated/40 p-5 backdrop-blur-md">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-ink">Intelligence Logs</h3>
          <p className="text-[11px] text-ink-subdued">
            Traceability and machine learning feedback outcomes
          </p>
        </div>
        <div className="flex rounded-lg bg-surface p-0.5 border border-white/5">
          <button
            onClick={() => setActiveTab('history')}
            className={`rounded px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
              activeTab === 'history'
                ? 'bg-brand-primary text-surface font-black'
                : 'text-ink-subdued hover:text-ink'
            }`}
          >
            Action Logs
          </button>
          <button
            onClick={() => setActiveTab('learning')}
            className={`rounded px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
              activeTab === 'learning'
                ? 'bg-brand-primary text-surface font-black'
                : 'text-ink-subdued hover:text-ink'
            }`}
          >
            Learning System
          </button>
        </div>
      </div>

      {activeTab === 'history' ? (
        <div className="overflow-x-auto">
          {executionHistory.length === 0 ? (
            <div className="py-8 text-center text-xs text-ink-subdued font-mono">
              No executed autonomous actions logged. Approve decisions to trigger operations.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 font-mono text-[9px] uppercase tracking-wider text-ink-subdued">
                  <th className="pb-2 font-bold">Time</th>
                  <th className="pb-2 font-bold">Action</th>
                  <th className="pb-2 font-bold">Result</th>
                  <th className="pb-2 font-bold">Impact</th>
                  <th className="pb-2 font-bold">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {executionHistory.map((rec) => (
                  <tr key={rec.id} className="text-[11px] hover:bg-white/5">
                    <td className="py-2.5 font-mono text-brand-secondary">
                      {formatTimestamp(rec.timestamp)}
                    </td>
                    <td className="py-2.5 font-bold text-ink">
                      {rec.actionType} <span className="text-ink-subdued">({rec.target})</span>
                    </td>
                    <td className="py-2.5 text-ink-subdued">{rec.result}</td>
                    <td className="py-2.5 font-mono text-emerald-400">{rec.impact}</td>
                    <td className="py-2.5 font-mono text-ink-subdued">{rec.operator}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded border border-emerald-500/20 bg-emerald-500/5 p-3 text-[11px] leading-relaxed text-emerald-400 font-medium">
            💡 **Reinforcement Learning Loop Active**: Outlying events adjust future confidence
            bounds. Successful actions dynamically shift policy weighting by +1.5% success
            likelihood.
          </div>
          {learningRecords.length === 0 ? (
            <div className="py-8 text-center text-xs text-ink-subdued font-mono">
              No learning traces available in memory.
            </div>
          ) : (
            <div className="space-y-3">
              {learningRecords.map((record, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-white/5 bg-surface/30 p-3.5 hover:border-brand-primary/10 transition-colors duration-200"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-ink">{record.action}</span>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-brand-primary/10 px-1.5 py-0.5 font-mono text-[9px] text-brand-primary">
                        Rate: {record.historicalSuccessRate}
                      </span>
                      <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9px] text-emerald-400">
                        Score: {record.effectivenessScore}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] font-medium text-ink-subdued leading-relaxed">
                    Outcome: <span className="text-ink">{record.outcome}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
