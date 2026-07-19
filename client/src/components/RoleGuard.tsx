import React from 'react';
import { useAuth } from '../hooks/useAuth';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('FAN' | 'VOLUNTEER' | 'OPERATIONS')[];
  fallback?: React.ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
export default RoleGuard;
