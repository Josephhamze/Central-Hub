import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Factory,
  Calculator,
  Warehouse,
  FileText,
  Truck,
  Mountain,
  ChevronLeft,
  ChevronRight,
  Settings
} from 'lucide-react';
import { useAuth } from '@contexts/AuthContext';
import { PERMISSIONS } from '@config/permissions';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  permissions?: string[]; // Any of these permissions grants access
  adminOnly?: boolean;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { hasPermission, hasRole } = useAuth();

  const isAdmin = hasRole('Administrator') || hasRole('Admin');

  const navigation: NavItem[] = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    {
      name: 'Operations & Production',
      path: '/operations-production',
      icon: Factory,
      permissions: [PERMISSIONS.QUOTES_VIEW, PERMISSIONS.LOGISTICS_ROUTES_VIEW]
    },
    {
      name: 'Finance & Reporting',
      path: '/finance-reporting',
      icon: Calculator,
      permissions: [PERMISSIONS.REPORTING_VIEW_SALES_KPIS]
    },
    {
      name: 'Inventory & Assets',
      path: '/inventory-assets',
      icon: Warehouse,
      permissions: [PERMISSIONS.WAREHOUSES_VIEW, PERMISSIONS.STOCK_VIEW, PERMISSIONS.ASSETS_VIEW]
    },
    {
      name: 'Logistics',
      path: '/logistics',
      icon: Truck,
      permissions: [PERMISSIONS.LOGISTICS_ROUTES_VIEW, PERMISSIONS.LOGISTICS_TOLLS_VIEW, PERMISSIONS.LOGISTICS_COSTING_VIEW]
    },
    {
      name: 'Quotes',
      path: '/sales/quotes',
      icon: FileText,
      permissions: [PERMISSIONS.QUOTES_VIEW]
    },
    {
      name: 'Quarry Production',
      path: '/quarry-production',
      icon: Mountain,
      permissions: [PERMISSIONS.QUARRY_DASHBOARD_VIEW]
    },
    {
      name: 'Administration',
      path: '/administration',
      icon: Settings,
      permissions: [PERMISSIONS.USERS_VIEW, PERMISSIONS.ROLES_VIEW],
      adminOnly: true
    },
  ];

  // Filter navigation items based on permissions
  const visibleNavigation = navigation.filter((item) => {
    // Admins can see everything
    if (isAdmin) return true;

    // Admin-only items require admin role
    if (item.adminOnly) return false;

    // No permissions required = visible to all authenticated users
    if (!item.permissions || item.permissions.length === 0) return true;

    // Check if user has any of the required permissions
    return item.permissions.some((p) => hasPermission(p));
  });

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 h-full z-40',
        'bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)]',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--sidebar-border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">O</span>
          </div>
          {!collapsed && (
            <span className="font-semibold text-content-primary truncate">
              OCP
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {visibleNavigation.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                'transition-all duration-200',
                'group',
                collapsed && 'justify-center',
                isActive
                  ? 'bg-[var(--sidebar-item-active)] text-[var(--sidebar-item-active-text)]'
                  : 'text-content-secondary hover:bg-[var(--sidebar-item-hover)] hover:text-content-primary'
              )
            }
            title={collapsed ? item.name : undefined}
          >
            <item.icon
              className={clsx(
                'w-5 h-5 flex-shrink-0',
                'transition-transform duration-200',
                'group-hover:scale-105'
              )}
            />
            {!collapsed && (
              <span className="text-sm font-medium truncate">{item.name}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-[var(--sidebar-border)]">
        <button
          onClick={onToggle}
          className={clsx(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
            'text-content-tertiary hover:bg-[var(--sidebar-item-hover)] hover:text-content-primary',
            'transition-all duration-200',
            collapsed && 'justify-center'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
