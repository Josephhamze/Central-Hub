import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Factory,
  Calculator,
  Warehouse,
  FileText,
  Truck,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Operations & Production', path: '/operations-production', icon: Factory },
  { name: 'Finance & Reporting', path: '/finance-reporting', icon: Calculator },
  { name: 'Inventory & Assets', path: '/inventory-assets', icon: Warehouse },
  { name: 'Logistics', path: '/logistics', icon: Truck },
  { name: 'Quotes', path: '/sales/quotes', icon: FileText },
];

export function Sidebar({ collapsed, onToggle, mobileOpen = false, onMobileClose }: SidebarProps) {
  const handleLinkClick = () => {
    // Close mobile sidebar when a link is clicked
    if (onMobileClose && window.innerWidth < 1024) {
      onMobileClose();
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          'fixed left-0 top-0 h-full z-50',
          'bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)]',
          'transition-all duration-300 ease-in-out',
          // Mobile: overlay from left, hidden by default
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          // Desktop: width based on collapsed state
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
        {/* Mobile close button */}
        <button
          onClick={onMobileClose}
          className="lg:hidden p-1.5 rounded-lg hover:bg-[var(--sidebar-item-hover)] transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5 text-content-secondary" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={handleLinkClick}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                'transition-all duration-200',
                'group',
                'touch-manipulation', // Better touch handling on mobile
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

      {/* Collapse toggle - hidden on mobile */}
      <div className="hidden lg:block p-3 border-t border-[var(--sidebar-border)]">
        <button
          onClick={onToggle}
          className={clsx(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
            'text-content-tertiary hover:bg-[var(--sidebar-item-hover)] hover:text-content-primary',
            'transition-all duration-200 touch-manipulation',
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
    </>
  );
}
