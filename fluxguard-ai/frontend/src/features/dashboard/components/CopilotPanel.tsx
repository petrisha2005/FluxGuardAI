import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { Button, Panel, Badge } from '@/components/ui';
import { api } from '@/services/api';
import { cn } from '@/utils/classNames';
import { useSimulationState, getActiveEventId } from '@/features/simulation/simulationStore';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  actions?: string[];
}

const SUGGESTIONS = [
  { label: 'Explain Gate C risks', query: 'Why is Gate C high risk?' },
  { label: 'Which zone needs attention?', query: 'Which zone needs immediate attention?' },
  { label: 'Evacuation route suggestions', query: 'What is the safest evacuation route?' },
  { label: 'Summarize last 15 minutes', query: 'Summarize the last 15 minutes.' },
  { label: 'How many staff are deployed?', query: 'How many staff are currently deployed?' },
  { label: 'How will weather affect flow?', query: 'How will weather affect crowd flow?' },
];

export function CopilotPanel({ className }: { className?: string }) {
  const sim = useSimulationState();
  const activeEventId = getActiveEventId();

  const [activeTab, setActiveTab] = useState<'DIRECTIVES' | 'TIMELINE' | 'BRIEFING'>('DIRECTIVES');
  const [selectedPoint, setSelectedPoint] = useState<'CURRENT' | '20MIN' | '40MIN'>('CURRENT');
  const [briefingText, setBriefingText] = useState<string>('');

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-msg',
      sender: 'assistant',
      text: 'Hello! I am your FluxGuard AI Command Assistant. I monitor real-time crowd densities, ticketing rates, transit schedules, and weather conditions. Ask me about zone risks, evacuation routes, or operational summaries.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Auto-generate briefing text if tab is chosen or on load
  useEffect(() => {
    if (activeTab === 'BRIEFING' && !briefingText) {
      handleGenerateBriefing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, briefingText]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.submitCopilotMessage(activeEventId, textToSend);
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: response.response,
        actions: response.suggested_actions,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: 'assistant',
        text: 'Sorry, I encountered an issue resolving your query. Please check your backend connection and try again.',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateBriefing = () => {
    const elevatedCount = sim.zones.filter((z) => z.density > 70).length;
    const activeAlertsCount = sim.events.length;
    const isEvac = sim.isEvacuationActive
      ? 'ACTIVE CRITICAL EVACUATION BROADCAST'
      : 'Normal venue health is stable';

    setBriefingText(
      `EXECUTIVE BRIEFING\nGenerated at: ${new Date().toLocaleTimeString()}\n\n` +
        `* Venue Egress Status: ${isEvac}.\n` +
        `* Elevated Risk Zones: ${elevatedCount} detected.\n` +
        `* Unresolved events: ${activeAlertsCount} alerts registered.\n` +
        `* Staffing levels are sufficient. Average queue times decreased by 18%.\n` +
        `* Evacuation risk: No immediate structural evacuation warning.`,
    );
  };

  // Derive highest density zone for decision directives
  const highestZone =
    sim.zones.length > 0
      ? sim.zones.reduce((prev, curr) => (curr.density > prev.density ? curr : prev), sim.zones[0])
      : null;

  const isElevated = highestZone && highestZone.density > 75;

  return (
    <div className={cn('grid gap-5 md:grid-cols-12', className)}>
      {/* Left Column: Chat Assistant Console */}
      <Panel
        eyebrow="Decision Support"
        title="Interactive Q&A Console"
        aria-label="AI Copilot Chat Assistant"
        className="md:col-span-5 flex flex-col h-[650px] border border-white/5 bg-surface-elevated"
      >
        <div className="flex-1 min-h-0 flex flex-col justify-between h-full">
          {/* Messages list container */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 scrollbar-thin scrollbar-thumb-white/10"
            role="log"
            aria-live="polite"
          >
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={cn(
                      'max-w-[90%] rounded px-3 py-2 border text-xs leading-relaxed font-mono',
                      msg.sender === 'user'
                        ? 'bg-brand-primary text-slate-950 border-brand-primary/50 shadow-glow font-bold'
                        : 'bg-white/5 text-ink border-white/5',
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Operational Recommendations buttons */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-white/5 space-y-1.5">
                        <span className="block text-[8px] font-bold uppercase tracking-widest text-brand-primary">
                          Suggested Operator Actions:
                        </span>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {msg.actions.map((act) => (
                            <button
                              key={act}
                              onClick={() => handleSend(`Proceeding with action: "${act}"`)}
                              className="text-[9px] font-mono font-bold px-2 py-0.5 rounded border border-white/5 bg-white/5 hover:bg-brand-primary hover:text-slate-950 transition-all text-left"
                              aria-label={`Execute: ${act}`}
                            >
                              ⚙️ {act}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="rounded px-3 py-2 bg-white/5 border border-white/5 text-ink-subdued text-xs flex items-center gap-2 font-mono">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-bounce delay-100" />
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-bounce delay-200" />
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-bounce delay-300" />
                    </div>
                    <span>Analyzing telemetry logs...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dynamic suggestion chips */}
          <div className="mb-3 border-t border-white/5 pt-3">
            <span className="block text-[9px] font-bold uppercase tracking-widest text-ink-subdued mb-2 font-mono">
              Ask Copilot:
            </span>
            <div className="flex flex-wrap gap-1">
              {SUGGESTIONS.map((sug) => (
                <button
                  key={sug.label}
                  onClick={() => handleSend(sug.query)}
                  className="text-[9px] font-mono font-bold rounded border border-white/5 bg-white/5 hover:bg-brand-primary hover:text-slate-950 hover:border-brand-primary transition-all duration-150 px-2 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
                >
                  {sug.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input submission form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex items-center gap-2 border-t border-white/5 pt-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Query FluxGuard AI copilot..."
              disabled={isLoading}
              className="flex-1 rounded border border-white/5 bg-surface px-3 py-2 text-xs text-ink placeholder-ink-subdued/40 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50 font-mono"
              aria-label="Message Input"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim() || isLoading}
              className="font-mono font-bold uppercase tracking-wider text-[10px]"
            >
              Send
            </Button>
          </form>
        </div>
      </Panel>

      {/* Right Column: AI Operations Deck */}
      <Panel
        eyebrow="Intelligence Deck"
        title="Command Decisions Center"
        className="md:col-span-7 flex flex-col h-[650px] border border-white/5 bg-surface-elevated overflow-y-auto"
      >
        <div className="flex flex-col h-full space-y-4">
          {/* Navigation tabs */}
          <div className="flex border-b border-white/5 pb-2 gap-2 text-xs font-mono">
            {(['DIRECTIVES', 'TIMELINE', 'BRIEFING'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-3 py-1 rounded font-bold uppercase tracking-widest transition-all',
                  activeTab === tab
                    ? 'bg-brand-primary text-slate-950'
                    : 'text-ink-subdued bg-white/5 border border-white/5 hover:bg-white/10',
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0">
            {activeTab === 'DIRECTIVES' && (
              <div className="space-y-4">
                {/* Situation Summary */}
                <div className="p-3 bg-surface rounded border border-white/5 space-y-1">
                  <span className="text-[8px] font-bold font-mono text-ink-subdued uppercase tracking-widest">
                    Situation Summary
                  </span>
                  <p className="text-xs text-ink leading-relaxed font-mono">
                    {isElevated && highestZone
                      ? `Overall stadium operating under elevated density stress. ${highestZone.name} is experiencing heavy congestion (${highestZone.density}%) caused by arrival surges. Predicted congestion window: 8 minutes.`
                      : 'Overall stadium operating normally. All gates and concourses are within safe capacity limits. Turnstiles running at regular flow rate.'}
                  </p>
                </div>

                {/* AI Recommendation Details */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="p-3 bg-surface rounded border border-white/5 space-y-1">
                    <span className="text-[8px] font-bold font-mono text-ink-subdued uppercase tracking-widest">
                      AI Directive Recommendation
                    </span>
                    <div className="flex items-center gap-1.5 py-1">
                      <Badge variant={isElevated ? 'critical' : 'info'}>
                        {isElevated ? 'HIGH PRIORITY' : 'ROUTINE'}
                      </Badge>
                      <span className="text-[10px] font-mono text-brand-primary font-bold">
                        92% CONFIDENCE
                      </span>
                    </div>
                    <p className="text-xs text-ink leading-relaxed font-mono">
                      {isElevated && highestZone
                        ? `Open Gate C Secondary Entrance to redistribute ${highestZone.name} visitor load.`
                        : 'Maintain current gate configuration and monitor gate entry flow rates.'}
                    </p>
                  </div>

                  <div className="p-3 bg-surface rounded border border-white/5 space-y-1">
                    <span className="text-[8px] font-bold font-mono text-ink-subdued uppercase tracking-widest">
                      Explain Recommendation
                    </span>
                    <p className="text-xs text-ink-muted leading-relaxed font-mono">
                      {isElevated && highestZone
                        ? `Entry volume exceeds discharge capacity at ${highestZone.name} by 37%. Delay to resolve this zone results in safety threshold breaches.`
                        : 'Current flow rates remain within standard deviations of optimal throughput.'}
                    </p>
                  </div>
                </div>

                {/* Decision Support Option comparisons */}
                <div className="p-3 bg-surface rounded border border-white/5 space-y-2">
                  <span className="text-[8px] font-bold font-mono text-ink-subdued uppercase tracking-widest block">
                    Alternative Actions comparison
                  </span>
                  <div className="space-y-2">
                    <div className="border-l-2 border-brand-primary pl-2.5 py-1 text-xs font-mono">
                      <div className="font-bold text-ink">Option A: Steward redeployment</div>
                      <div className="text-ink-muted text-[10px] leading-relaxed">
                        Advantages: Low cost, direct assistance. Disadvantages: Deficit in other
                        gates. Impact: Density ↓ 15%.
                      </div>
                    </div>
                    <div className="border-l-2 border-brand-secondary pl-2.5 py-1 text-xs font-mono">
                      <div className="font-bold text-ink">Option B: Divert new arrivals</div>
                      <div className="text-ink-muted text-[10px] leading-relaxed">
                        Advantages: Clears gate area. Disadvantages: West gate line queue increases.
                        Impact: Queue ↓ 24%.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decision Support estimate projections */}
                <div className="p-3 bg-surface border border-white/5 rounded grid gap-3 sm:grid-cols-2 text-xs font-mono">
                  <div className="border-r border-white/5 pr-3">
                    <span className="text-brand-primary font-bold block uppercase text-[8px] tracking-wider">
                      If Approved
                    </span>
                    <p className="text-ink-muted text-[10px] mt-1">
                      Queue ↓ 22%, Density ↓ 17%, Est. Recovery: 9 mins.
                    </p>
                  </div>
                  <div>
                    <span className="text-risk-critical font-bold block uppercase text-[8px] tracking-wider">
                      If Ignored
                    </span>
                    <p className="text-ink-muted text-[10px] mt-1">
                      Risk escalates to CRITICAL within 6 minutes.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'TIMELINE' && (
              <div className="space-y-4 font-mono">
                <div className="p-3 bg-surface rounded border border-white/5 space-y-2">
                  <span className="text-[8px] font-bold text-ink-subdued uppercase tracking-widest block">
                    Select Prediction Horizon Point
                  </span>
                  <div className="flex gap-2">
                    {(['CURRENT', '20MIN', '40MIN'] as const).map((pt) => (
                      <button
                        key={pt}
                        onClick={() => setSelectedPoint(pt)}
                        className={cn(
                          'px-2.5 py-1 rounded text-[10px] font-bold border',
                          selectedPoint === pt
                            ? 'bg-brand-primary text-slate-950 border-brand-primary'
                            : 'text-ink-muted bg-white/5 border-white/5 hover:bg-white/10',
                        )}
                      >
                        {pt === 'CURRENT'
                          ? 'Current T-0'
                          : pt === '20MIN'
                            ? '20 min Forecast'
                            : '40 min Forecast'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-surface rounded border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-primary uppercase">
                      {selectedPoint === 'CURRENT'
                        ? 'T-0 Diagnostic State'
                        : selectedPoint === '20MIN'
                          ? 'T+20 Minute Forecast Analysis'
                          : 'T+40 Minute Forecast Analysis'}
                    </span>
                    <Badge
                      variant={
                        selectedPoint === 'CURRENT'
                          ? 'safe'
                          : selectedPoint === '20MIN'
                            ? 'warning'
                            : 'info'
                      }
                    >
                      Trend:{' '}
                      {selectedPoint === 'CURRENT'
                        ? 'STABLE'
                        : selectedPoint === '20MIN'
                          ? 'RISING'
                          : 'DISPERSING'}
                    </Badge>
                  </div>

                  <p className="text-xs text-ink leading-relaxed">
                    {selectedPoint === 'CURRENT' &&
                      'Currently, overall density metrics are normal. Focus zone entry gates are logging constant scan speeds under local baseline limits.'}
                    {selectedPoint === '20MIN' &&
                      'Congestion peak projected due to passenger transit waves arriving from the north station. Inflow is expected to scale by +24%.'}
                    {selectedPoint === '40MIN' &&
                      'Halftime disperse vectors predict crowd relocation from gates towards snack concourses. Risk profiles are anticipated to descend at key entry points.'}
                  </p>

                  <div className="border-t border-white/5 pt-3 space-y-2 text-xs">
                    <div className="text-[9px] font-bold text-ink-subdued uppercase tracking-wider">
                      Telemetry Influences
                    </div>
                    <ul className="space-y-1 text-ink-muted text-[10px]">
                      <li>• Transit arrivals schedules (42% weight)</li>
                      <li>• Turnstile tickets scan rates (38% weight)</li>
                      <li>• Concourse historical flow patterns (20% weight)</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'BRIEFING' && (
              <div className="space-y-4 font-mono">
                <div className="flex justify-between items-center bg-surface border border-white/5 p-3 rounded">
                  <span className="text-xs font-bold text-ink-muted">
                    Executive Operations Summary
                  </span>
                  <button
                    onClick={handleGenerateBriefing}
                    className="bg-brand-primary hover:bg-brand-primary/85 text-slate-950 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider"
                  >
                    Regenerate
                  </button>
                </div>

                <div className="p-4 bg-surface rounded border border-white/5 text-xs text-ink-muted leading-relaxed whitespace-pre-wrap">
                  {briefingText || 'Click Regenerate to generate live brief report.'}
                </div>
              </div>
            )}
          </div>
        </div>
      </Panel>
    </div>
  );
}
