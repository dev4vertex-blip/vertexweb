import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';
import { UnauthorizedView } from './UnauthorizedView';
import { LoadingState } from '../ui/LoadingState';

interface ProtectedRouteProps {
  path: string;
  allowedRoles?: UserRole[];
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  path,
  allowedRoles,
  children,
}) => {
  const { user, isAuthenticated, isLoading, canAccessRoute } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-8">
        <LoadingState text="Verifying credentials and security clearance..." />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return <UnauthorizedView attemptedPath={path} />;
  }

  // Role check if explicitly provided
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <UnauthorizedView attemptedPath={path} />;
  }

  // Permissions & path check
  if (!canAccessRoute(path)) {
    return <UnauthorizedView attemptedPath={path} />;
  }

  return <>{children}</>;
};
