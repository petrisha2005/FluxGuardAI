import { useEffect, useRef, useState } from 'react';
import { useSimulationState } from '@/features/simulation/simulationStore';
import { cn } from '@/utils/classNames';

interface NotificationItem {
  id: string;
  category: 'critical' | 'warning' | 'info' | 'resolved';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}

export function NotificationCenter() {
  const simState = useSimulationState();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'init-notif-1',
      category: 'critical',
      title: 'Gate C Capacity Warning',
      description: 'Density has reached 86% capacity threshold. Egress warning triggered.',
      timestamp: '14:24:02',
      read: false,
    },
    {
      id: 'init-notif-2',
      category: 'warning',
      title: 'AI Action Verification Required',
      description: 'Steward redeployment suggested to redirect incoming flows.',
      timestamp: '14:24:15',
      read: false,
    },
    {
      id: 'init-notif-3',
      category: 'info',
      title: 'Transit Egress Surge Incoming',
      description: 'Metro Line train arrived at station: +450 incoming passengers estimated.',
      timestamp: '14:23:45',
      read: true,
    },
    {
      id: 'init-notif-4',
      category: 'resolved',
      title: 'Gate C Flow Stabilized',
      description: 'Crowd diversion directive successfully executed.',
      timestamp: '14:22:10',
      read: true,
    },
  ]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen to simulation events and push them as real-time notifications
  useEffect(() => {
    if (simState.events.length === 0) return;

    // Get the latest event
    const latestEvent = simState.events[0];
    const mappingCategory = (sev: string): NotificationItem['category'] => {
      const lower = sev.toLowerCase();
      if (lower === 'critical') return 'critical';
      if (lower === 'high') return 'warning';
      if (lower === 'medium') return 'info';
      return 'info';
    };

    setNotifications((prev) => {
      // Check if already exists
      const exists = prev.some((n) => n.id === latestEvent.id);
      if (exists) return prev;

      const newNotif: NotificationItem = {
        id: latestEvent.id,
        category: mappingCategory(latestEvent.severity),
        title: latestEvent.title,
        description: latestEvent.description,
        timestamp: latestEvent.timestamp,
        read: false,
      };

      // Put new notification at the top
      return [newNotif, ...prev];
    });
  }, [simState.events]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handleToggleRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)));
  };

  const getCategoryStyles = (category: NotificationItem['category']) => {
    switch (category) {
      case 'critical':
        return {
          bg: 'bg-rose-500/10 border-rose-500/30',
          text: 'text-rose-400',
          dot: 'bg-rose-400 animate-ping',
          icon: '🚨',
        };
      case 'warning':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30',
          text: 'text-amber-400',
          dot: 'bg-amber-400',
          icon: '⚠️',
        };
      case 'resolved':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30',
          text: 'text-emerald-400',
          dot: 'bg-emerald-400',
          icon: '✅',
        };
      case 'info':
      default:
        return {
          bg: 'bg-sky-500/10 border-sky-500/30',
          text: 'text-sky-400',
          dot: 'bg-sky-400',
          icon: 'ℹ️',
        };
    }
  };

  return (
    <div className="relative shrink-0 select-none z-40" ref={containerRef}>
      {/* Bell Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 relative rounded-lg border border-white/5 hover:border-white/10 bg-white/3 hover:bg-white/5 text-ink-subdued hover:text-ink cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-primary"
        aria-label={`System notifications center. ${unreadCount} unread.`}
      >
        <span className="text-sm">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 font-mono text-[9px] font-black text-white shadow-glow">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Overlay Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-white/5 bg-slate-950/95 backdrop-blur-md shadow-command z-50 overflow-hidden font-mono text-xs text-ink">
          {/* Header */}
          <div className="p-3 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
            <span className="font-bold uppercase tracking-wider text-2xs text-ink-subdued">
              Notifications ({notifications.length})
            </span>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[9px] font-bold text-sky-400 hover:text-sky-300 transition-colors uppercase border-0 bg-transparent cursor-pointer p-0"
                >
                  Mark All Read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-[9px] font-bold text-rose-400 hover:text-rose-350 transition-colors uppercase border-0 bg-transparent cursor-pointer p-0"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Notifications feed */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-ink-subdued font-sans flex flex-col items-center justify-center space-y-2">
                <span className="text-xl">📭</span>
                <span className="text-2xs font-bold uppercase tracking-wider font-mono">
                  Operations Feed Empty
                </span>
                <p className="text-3xs text-ink-muted leading-relaxed max-w-[200px]">
                  No warning triggers, incidents, or logs currently pending.
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const styles = getCategoryStyles(item.category);
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => handleToggleRead(item.id)}
                    className={cn(
                      'relative flex w-full cursor-pointer items-start gap-3 p-3 text-left transition-colors hover:bg-white/2',
                      !item.read && 'bg-brand-primary/2',
                    )}
                  >
                    {/* Unread indicator bar */}
                    {!item.read && (
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand-primary" />
                    )}

                    {/* Category indicator dot */}
                    <div
                      className={cn(
                        'h-6 w-6 rounded border flex items-center justify-center shrink-0',
                        styles.bg,
                        styles.text,
                      )}
                    >
                      {styles.icon}
                    </div>

                    {/* Message block */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            'font-bold tracking-wide text-2xs truncate font-sans',
                            styles.text,
                          )}
                        >
                          {item.title}
                        </span>
                        <span className="text-[8px] text-ink-muted shrink-0 font-mono">
                          {item.timestamp}
                        </span>
                      </div>
                      <p className="text-4xs text-ink-subdued leading-relaxed font-sans font-medium line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer briefing indicator */}
          <div className="p-2 border-t border-white/5 bg-slate-900/30 text-center text-[8px] text-ink-muted select-none">
            FluxGuard AI Real-Time Stream Integration
          </div>
        </div>
      )}
    </div>
  );
}
