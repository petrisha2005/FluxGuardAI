import { NavLink } from 'react-router-dom';
import { RoleGuard } from '@/features/auth';

interface SidebarItemProps {
  to: string;
  icon: string;
  label: string;
  collapsed: boolean;
  allowedRoles?: string[];
}

export function SidebarItem({ to, icon, label, collapsed, allowedRoles }: SidebarItemProps) {
  const content = (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-mono font-bold tracking-wide transition-all duration-200 group relative ${
          isActive
            ? 'bg-brand-primary/10 border border-brand-primary/25 text-brand-primary shadow-[0_0_15px_rgba(56,189,248,0.08)]'
            : 'text-ink-subdued hover:text-ink hover:bg-white/5 border border-transparent'
        }`
      }
      title={collapsed ? label : undefined}
    >
      <span className="text-sm font-normal select-none">{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}
      {collapsed && (
        <span className="absolute left-14 scale-0 rounded bg-slate-950 border border-white/10 px-2 py-1 text-[10px] font-bold text-ink transition-all group-hover:scale-100 whitespace-nowrap z-50 shadow-glow">
          {label}
        </span>
      )}
    </NavLink>
  );

  if (allowedRoles) {
    return (
      <RoleGuard allowedRoles={allowedRoles} fallback={null}>
        {content}
      </RoleGuard>
    );
  }

  return content;
}
