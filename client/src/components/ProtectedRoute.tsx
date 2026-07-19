import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { RefreshCw } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('FAN' | 'VOLUNTEER' | 'OPERATIONS')[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-950 text-white">
        <div className="relative flex flex-col items-center p-8 text-center">
          <RefreshCw className="h-10 w-10 text-blue-500 animate-spin mb-4" />
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Restoring ArenaFlow Session</h2>
          <p className="text-[11px] text-slate-500 mt-1">Verifying telemetry links & credentials...</p>
        </div>
      </div>
    );
  }

  // 1. Unauthenticated -> redirect to Tournament Access Portal
  if (!user) {
    return <Navigate to="/access" state={{ from: location }} replace />;
  }

  // 2. Authenticated but lacks required roles -> redirect to Unauthorized
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
