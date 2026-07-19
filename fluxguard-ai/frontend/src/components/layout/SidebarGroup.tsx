import type { ReactNode } from 'react';

interface SidebarGroupProps {
  label: string;
  collapsed: boolean;
  children: ReactNode;
}

export function SidebarGroup({ label, collapsed, children }: SidebarGroupProps) {
  // Check if all children are rendered (in case RoleGuard filters all out)
  return (
    <div className="space-y-1.5">
      {!collapsed ? (
        <h3 className="text-[9px] font-bold text-ink-subdued uppercase tracking-widest px-3 select-none">
          {label}
        </h3>
      ) : (
        <div className="border-t border-white/5 my-2 mx-2" />
      )}
      <div className="space-y-1">{children}</div>
    </div>
  );
}
