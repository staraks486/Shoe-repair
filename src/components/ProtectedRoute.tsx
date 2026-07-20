import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppStore } from '../store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, userProfile } = useAppStore();
  
  // Also check userProfile because 'user' might not persist properly due to complex Firebase object not serializing well
  if (!user && !userProfile) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireAdmin && userProfile?.role !== 'Admin' && !userProfile?.isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}
