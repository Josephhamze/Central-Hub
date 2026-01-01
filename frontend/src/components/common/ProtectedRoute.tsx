import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
}

export function ProtectedRoute({
  children,
  requiredPermissions = [],
  requiredRoles = [],
}: ProtectedRouteProps) {
  const { isAuthenticated, hasPermission, hasRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check permissions
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every((p) => hasPermission(p));
    if (!hasAllPermissions) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-content-primary mb-2">
              Access Denied
            </h2>
            <p className="text-content-tertiary">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      );
    }
  }

  // Check roles
  if (requiredRoles.length > 0) {
    const hasAnyRole = requiredRoles.some((r) => hasRole(r));
    if (!hasAnyRole) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-content-primary mb-2">
              Access Denied
            </h2>
            <p className="text-content-tertiary">
              You don't have the required role to access this page.
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
