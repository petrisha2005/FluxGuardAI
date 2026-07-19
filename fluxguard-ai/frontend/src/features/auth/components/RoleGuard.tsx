import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { checkRoleAccess } from './roleAccess';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  children,
  fallback = null,
}) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  const hasAccess = checkRoleAccess(user.role, allowedRoles);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
