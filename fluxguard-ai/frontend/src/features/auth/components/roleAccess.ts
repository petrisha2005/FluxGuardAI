export const ROLE_GROUPS: Record<string, string[]> = {
  admin: ['SUPER_ADMIN', 'admin'],
  operator: [
    'SECURITY_SUPERVISOR',
    'MEDICAL_COORDINATOR',
    'GLOBAL_OPERATIONS_DIRECTOR',
    'STADIUM_MANAGER',
    'SUPER_ADMIN',
    'operator',
  ],
  organizer: ['GLOBAL_OPERATIONS_DIRECTOR', 'STADIUM_MANAGER', 'SUPER_ADMIN', 'organizer'],
  volunteer: ['VOLUNTEER_COORDINATOR', 'volunteer'],
  fan: ['VIEWER', 'fan'],
};

export const checkRoleAccess = (userRole: string | undefined, allowedRoles: string[]): boolean => {
  if (!userRole) return false;
  for (const allowed of allowedRoles) {
    if (userRole === allowed) return true;

    if (ROLE_GROUPS[allowed]?.includes(userRole)) return true;

    if (ROLE_GROUPS[userRole]?.includes(allowed)) return true;
  }
  return false;
};
