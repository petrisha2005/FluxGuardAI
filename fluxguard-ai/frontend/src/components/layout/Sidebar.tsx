import { useAuth } from '@/features/auth';
import { SidebarGroup } from './SidebarGroup';
import { SidebarItem } from './SidebarItem';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onCloseMobile?: () => void;
}

const formatRole = (role: string) => {
  if (role === 'SUPER_ADMIN') return 'Super Admin';
  if (role === 'GLOBAL_OPERATIONS_DIRECTOR') return 'Operations Director';
  if (role === 'STADIUM_MANAGER') return 'Stadium Manager';
  if (role === 'SECURITY_SUPERVISOR') return 'Security Supervisor';
  return role.charAt(0).toUpperCase() + role.slice(1);
};

export function Sidebar({ collapsed, onToggleCollapse, onCloseMobile }: SidebarProps) {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <aside
      className={`h-full border-r border-white/5 bg-slate-950 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 border-b border-white/5 flex items-center justify-between select-none">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <span className="text-base shrink-0 animate-pulse">🛡</span>
          {!collapsed && (
            <span className="text-xs font-black tracking-widest text-ink uppercase truncate">
              FluxGuard{' '}
              <span className="text-brand-primary font-mono text-[9px] bg-brand-primary/10 px-1.5 py-0.5 rounded tracking-normal">
                AI
              </span>
            </span>
          )}
        </div>
        {/* Toggle button on desktop */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex h-6 w-6 items-center justify-center rounded border border-white/5 bg-white/5 hover:bg-white/10 text-ink-subdued hover:text-ink transition-colors cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      <nav
        aria-label="Primary navigation"
        className="flex-1 overflow-y-auto px-2 py-4 space-y-5"
        onClick={onCloseMobile}
      >
        {/* COMMAND CENTER */}
        <SidebarGroup label="Command Center" collapsed={collapsed}>
          <SidebarItem to="/dashboard" icon="◉" label="Dashboard" collapsed={collapsed} />
          <SidebarItem
            to="/global-command"
            icon="🌐"
            label="Global Operations"
            collapsed={collapsed}
            allowedRoles={['SUPER_ADMIN', 'GLOBAL_OPERATIONS_DIRECTOR']}
          />
          <SidebarItem
            to="/autonomous-control"
            icon="🤖"
            label="Autonomous AI"
            collapsed={collapsed}
            allowedRoles={[
              'SUPER_ADMIN',
              'GLOBAL_OPERATIONS_DIRECTOR',
              'STADIUM_MANAGER',
              'SECURITY_SUPERVISOR',
              'operator',
              'organizer',
            ]}
          />
        </SidebarGroup>

        {/* INTELLIGENCE */}
        <SidebarGroup label="Intelligence" collapsed={collapsed}>
          <SidebarItem to="/copilot" icon="💬" label="AI Copilot" collapsed={collapsed} />
          <SidebarItem to="/predictive-twin" icon="📈" label="Predictions" collapsed={collapsed} />
          <SidebarItem to="/city-hub" icon="🏟" label="Digital Twin" collapsed={collapsed} />
        </SidebarGroup>

        {/* OPERATIONS */}
        <SidebarGroup label="Operations" collapsed={collapsed}>
          <SidebarItem to="/operations" icon="🚨" label="Incidents" collapsed={collapsed} />
          <SidebarItem to="/signage" icon="📢" label="Emergency Response" collapsed={collapsed} />
          <SidebarItem to="/volunteer" icon="👥" label="Volunteers" collapsed={collapsed} />
        </SidebarGroup>

        {/* ANALYTICS */}
        <SidebarGroup label="Analytics" collapsed={collapsed}>
          <SidebarItem to="/analytics" icon="📊" label="Risk Analytics" collapsed={collapsed} />
          <SidebarItem to="/analytics" icon="🏛" label="Historical Intel" collapsed={collapsed} />
          <SidebarItem to="/analytics" icon="📋" label="Reports" collapsed={collapsed} />
        </SidebarGroup>

        {/* ADMINISTRATION */}
        <SidebarGroup label="Admin" collapsed={collapsed}>
          <SidebarItem
            to="/users"
            icon="👤"
            label="Users"
            collapsed={collapsed}
            allowedRoles={['SUPER_ADMIN', 'GLOBAL_OPERATIONS_DIRECTOR']}
          />
          <SidebarItem to="/profile" icon="👤" label="Profile" collapsed={collapsed} />
          <SidebarItem to="/change-password" icon="⚙" label="Settings" collapsed={collapsed} />
        </SidebarGroup>
      </nav>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-white/5 bg-slate-950/80 backdrop-blur space-y-2 select-none">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="px-1">
              <div className="text-[10px] font-bold text-ink truncate">{user.name}</div>
              <div className="text-[8px] font-mono text-ink-subdued uppercase tracking-widest mt-0.5 truncate">
                {formatRole(user.role)}
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full text-center rounded border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/15 text-rose-400 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              className="h-7 w-7 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-[10px] font-black text-brand-primary uppercase"
              title={`${user.name} (${formatRole(user.role)})`}
            >
              {user.name.slice(0, 2)}
            </div>
            <button
              onClick={logout}
              className="text-rose-400 text-xs hover:text-rose-300 transition-colors p-1"
              title="Logout"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
