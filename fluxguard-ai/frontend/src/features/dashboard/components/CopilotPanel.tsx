import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { Button, Panel } from '@/components/ui';
import { api } from '@/services/api';

const EVENT_ID = 'e0000000-0000-0000-0000-000000000000';

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
  { label: 'Summarize last 10 minutes', query: 'Summarize the last 10 minutes.' },
];

export function CopilotPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-msg',
      sender: 'assistant',
      text: 'Hello! I am your FluxGuard AI Command Assistant. I monitor real-time crowd densities, ticketing rates, transit schedules, and weather conditions. Ask me about zone risks, evacuation routes, or operational summaries.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

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
      // Offline/online unified copilot endpoint
      const response = await api.submitCopilotMessage(EVENT_ID, textToSend);
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

  return (
    <Panel
      eyebrow="Decision Support"
      title="FluxGuard AI Copilot"
      aria-label="AI Copilot Chat Assistant"
      className="flex flex-col h-[520px]"
    >
      <div className="flex flex-col h-full justify-between">
        {/* Messages list container */}
        <div
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
                  className={`max-w-[85%] rounded-command px-4 py-3 border text-sm leading-6 ${
                    msg.sender === 'user'
                      ? 'bg-brand-primary text-slate-950 border-brand-primary/50 shadow-glow font-medium'
                      : 'bg-white/5 text-ink border-white/10'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Operational Recommendations buttons */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-white/10 space-y-1.5">
                      <span className="block text-3xs font-semibold uppercase text-brand-secondary">
                        Suggested Operator Actions:
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.actions.map((act) => (
                          <button
                            key={act}
                            onClick={() => handleSend(`Proceeding with action: "${act}"`)}
                            className="text-2xs font-semibold px-2 py-1 rounded border border-white/10 bg-white/5 hover:bg-brand-secondary/20 hover:text-brand-secondary transition-colors text-left"
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
                <div className="rounded-command px-4 py-3 bg-white/5 border border-white/10 text-ink-muted text-sm flex items-center gap-2">
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
          <div ref={messagesEndRef} />
        </div>

        {/* Dynamic suggestion chips */}
        <div className="mb-4">
          <span className="block text-3xs font-semibold uppercase text-ink-subdued mb-2">
            Ask Copilot:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((sug) => (
              <button
                key={sug.label}
                onClick={() => handleSend(sug.query)}
                className="text-2xs font-semibold rounded border border-white/10 bg-white/5 hover:bg-brand-primary hover:text-slate-950 hover:border-brand-primary transition-all duration-150 px-2.5 py-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
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
          className="flex items-center gap-2 border-t border-white/10 pt-4"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Query FluxGuard AI copilot..."
            disabled={isLoading}
            className="flex-1 rounded-command border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-ink placeholder-ink-muted focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50"
            aria-label="Message Input"
          />
          <Button type="submit" size="md" disabled={!input.trim() || isLoading}>
            Send
          </Button>
        </form>
      </div>
    </Panel>
  );
}
