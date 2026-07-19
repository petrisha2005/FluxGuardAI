import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/classNames';

interface SearchResult {
  id: string;
  category: 'Incidents' | 'Stadiums' | 'AI Decisions' | 'Users' | 'Reports';
  title: string;
  subtitle: string;
  path: string;
  icon: string;
}

const SEARCH_DATABASE: SearchResult[] = [
  // Incidents
  {
    id: 'inc-1',
    category: 'Incidents',
    title: 'Incident #101: Gate C Crowd Surge',
    subtitle: 'High density congestion detected at entry turnstiles. Action pending.',
    path: '/operations',
    icon: '🚨',
  },
  {
    id: 'inc-2',
    category: 'Incidents',
    title: 'Incident #102: Concourse Power Fluctuation',
    subtitle: 'Secondary power unit backup initialized on East Concourse signage.',
    path: '/operations',
    icon: '⚡',
  },
  {
    id: 'inc-3',
    category: 'Incidents',
    title: 'Incident #103: Medical Assistance Dispatch',
    subtitle: 'Steward dispatched first-aid responder to North Stand Sector 4.',
    path: '/operations',
    icon: '🚑',
  },
  // Stadiums
  {
    id: 'std-1',
    category: 'Stadiums',
    title: 'Lucusa Stadium (Zambia)',
    subtitle: 'Primary tournament venue. Capacity: 60,000 seats. Active Event: Simulation.',
    path: '/dashboard',
    icon: '🏟️',
  },
  {
    id: 'std-2',
    category: 'Stadiums',
    title: 'City Arena (Zambia)',
    subtitle: 'Secondary indoor arena venue. Capacity: 15,000 seats. Egress: Safe.',
    path: '/global-command',
    icon: '🏀',
  },
  {
    id: 'std-3',
    category: 'Stadiums',
    title: 'Downtown Fan Zone',
    subtitle: 'Open-air screening park. Capacity: 30,000 fans. Transit link: High flow.',
    path: '/global-command',
    icon: '🌳',
  },
  // AI Decisions
  {
    id: 'dec-1',
    category: 'AI Decisions',
    title: 'AI Decision #201: Redirect 500 attendees from Gate C',
    subtitle: 'Redirect load to West Entrance. Confidence: 94%. Impact: Delay ↓ 18m.',
    path: '/autonomous-control',
    icon: '🤖',
  },
  {
    id: 'dec-2',
    category: 'AI Decisions',
    title: 'AI Decision #202: Allocate 5 volunteer stewards to North Gate',
    subtitle: 'Redeploy volunteer supervisors from low density areas to assist queues.',
    path: '/autonomous-control',
    icon: '👥',
  },
  {
    id: 'dec-3',
    category: 'AI Decisions',
    title: 'AI Decision #203: Switch LED displays to Warning posture',
    subtitle: 'Broadcasting egress path directive language to East Concourse LED display.',
    path: '/autonomous-control',
    icon: '📢',
  },
  // Users
  {
    id: 'usr-1',
    category: 'Users',
    title: 'Alice Smith (Stadium Manager)',
    subtitle: 'Clearance level: STADIUM_MANAGER. Assigned venue: Lucusa Stadium.',
    path: '/users',
    icon: '👤',
  },
  {
    id: 'usr-2',
    category: 'Users',
    title: 'John Doe (Security Supervisor)',
    subtitle: 'Clearance level: SECURITY_SUPERVISOR. Response lead.',
    path: '/users',
    icon: '👮',
  },
  {
    id: 'usr-3',
    category: 'Users',
    title: 'Bob Johnson (Global Operations Director)',
    subtitle: 'Clearance level: GLOBAL_OPERATIONS_DIRECTOR. Multi-stadium oversight.',
    path: '/users',
    icon: '👔',
  },
  // Reports
  {
    id: 'rep-1',
    category: 'Reports',
    title: 'Egress Clearance Compliance Audit',
    subtitle: 'PDF Safety Report. Evaluates exit corridor speeds and queue clearing limits.',
    path: '/analytics',
    icon: '📋',
  },
  {
    id: 'rep-2',
    category: 'Reports',
    title: 'AI Decision Effectiveness Report',
    subtitle: 'Statistical telemetry evaluation comparing AI actions vs manual overrides.',
    path: '/analytics',
    icon: '📊',
  },
];

export function CommandPalette() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Shortcut listener (Ctrl + K / Cmd + K)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setQuery('');
        setSelectedIndex(0);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Autofocus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredResults =
    query.trim() === ''
      ? SEARCH_DATABASE.slice(0, 5) // Show top 5 suggestions if empty
      : SEARCH_DATABASE.filter(
          (item) =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
            item.category.toLowerCase().includes(query.toLowerCase()),
        );

  // Scroll active item into view
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeElement = scrollContainerRef.current.children[selectedIndex] as HTMLElement;
      if (activeElement) {
        const container = scrollContainerRef.current;
        const elemTop = activeElement.offsetTop;
        const elemBottom = elemTop + activeElement.offsetHeight;
        const containerTop = container.scrollTop;
        const containerBottom = containerTop + container.offsetHeight;

        if (elemTop < containerTop) {
          container.scrollTop = elemTop;
        } else if (elemBottom > containerBottom) {
          container.scrollTop = elemBottom - container.offsetHeight;
        }
      }
    }
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        handleAction(filteredResults[selectedIndex]);
      }
    }
  };

  const handleAction = (item: SearchResult) => {
    navigate(item.path);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center bg-slate-950/80 px-4 pt-[10vh] font-mono backdrop-blur-sm select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Command Search Palette"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close command search palette"
        onClick={() => setIsOpen(false)}
      />
      {/* Search Input Container */}
      <div className="relative flex w-full max-w-xl flex-col overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-command">
        {/* Input area */}
        <div className="flex items-center border-b border-white/5 px-4 py-3 gap-3">
          <span className="text-sm shrink-0 text-ink-subdued">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-0 text-ink focus:outline-none text-xs placeholder-white/20 font-mono"
            placeholder="Type stadiums, incidents, users or directives to search..."
          />
          <span className="text-4xs text-ink-subdued border border-white/10 px-1.5 py-0.5 rounded bg-slate-950 select-none">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div
          ref={scrollContainerRef}
          className="max-h-[300px] overflow-y-auto divide-y divide-white/2 p-2"
        >
          {filteredResults.length === 0 ? (
            <div className="p-8 text-center text-ink-subdued text-xs font-sans">
              No results found for "<span className="text-white font-bold">{query}</span>"
            </div>
          ) : (
            filteredResults.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => handleAction(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    'w-full p-2.5 rounded-lg flex items-start gap-3 transition-colors cursor-pointer text-left',
                    isSelected
                      ? 'bg-brand-primary/10 border border-brand-primary/20 text-ink'
                      : 'border border-transparent',
                  )}
                >
                  <div className="text-sm shrink-0 mt-0.5" aria-hidden="true">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-2xs truncate">{item.title}</span>
                      <span className="text-4xs text-ink-subdued bg-white/5 px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-4xs text-ink-muted leading-relaxed font-sans line-clamp-1 mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Tips Footer */}
        <div className="p-2 border-t border-white/5 bg-slate-950 text-center text-[8px] text-ink-muted flex items-center justify-center gap-4">
          <span>↓↑ to navigate</span>
          <span>↵ to execute</span>
          <span>Click to select</span>
        </div>
      </div>
    </div>
  );
}
