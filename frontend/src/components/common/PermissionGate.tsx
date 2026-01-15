import { type ReactNode } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { ShieldX } from 'lucide-react';

interface PermissionGateProps {
  children: ReactNode;
  permissions?: string[];
  roles?: string[];
  requireAll?: boolean; // If true, requires all permissions; if false, requires any
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}

/**
 * PermissionGate component that conditionally renders children based on user permissions/roles.
 *
 * @example
 * // Require any of the permissions
 * <PermissionGate permissions={['users:view', 'users:create']}>
 *   <UserList />
 * </PermissionGate>
 *
 * @example
 * // Require all permissions
 * <PermissionGate permissions={['users:view', 'users:create']} requireAll>
 *   <UserList />
 * </PermissionGate>
 *
 * @example
 * // With custom fallback
 * <PermissionGate permissions={['admin:view']} fallback={<UpgradePrompt />}>
 *   <AdminPanel />
 * </PermissionGate>
 */
export function PermissionGate({
  children,
  permissions = [],
  roles = [],
  requireAll = false,
  fallback = null,
  showAccessDenied = false,
}: PermissionGateProps) {
  const { hasPermission, hasRole } = useAuth();

  // Check permissions
  let hasRequiredPermissions = true;
  if (permissions.length > 0) {
    hasRequiredPermissions = requireAll
      ? permissions.every(p => hasPermission(p))
      : permissions.some(p => hasPermission(p));
  }

  // Check roles
  let hasRequiredRoles = true;
  if (roles.length > 0) {
    hasRequiredRoles = requireAll
      ? roles.every(r => hasRole(r))
      : roles.some(r => hasRole(r));
  }

  const hasAccess = hasRequiredPermissions && hasRequiredRoles;

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showAccessDenied) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-status-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldX className="w-8 h-8 text-status-error" />
          </div>
          <h2 className="text-xl font-semibold text-content-primary mb-2">
            Access Denied
          </h2>
          <p className="text-content-tertiary max-w-md">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Higher-order component for page-level permission checks
 */
export function withPermissions<P extends object>(
  Component: React.ComponentType<P>,
  permissions: string[],
  requireAll = false
) {
  return function PermissionWrapper(props: P) {
    return (
      <PermissionGate permissions={permissions} requireAll={requireAll} showAccessDenied>
        <Component {...props} />
      </PermissionGate>
    );
  };
}
