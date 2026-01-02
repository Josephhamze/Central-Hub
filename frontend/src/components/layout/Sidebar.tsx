import { FileText,  NavLink } from 'react-router-dom';
import { FileText,  clsx } from 'clsx';
import { FileText, 
  LayoutDashboard,
  Settings,
  Cog,
  Factory,
  Calculator,
  Warehouse,
  Wrench,
  Truck,
  Users,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Administration', path: '/administration', icon: Settings },
  { name: 'Operations', path: '/operations', icon: Cog },
  { name: 'Production', path: '/production', icon: Factory },
  { name: 'Costing', path: '/costing', icon: Calculator },
  { name: 'Inventory', path: '/inventory', icon: Warehouse },
  { name: 'Assets', path: '/assets', icon: Wrench },
  { name: 'Logistics', path: '/logistics', icon: Truck },
  { name: 'Customers', path: '/customers', icon: Users },
  { name: 'Reporting', path: '/reporting', icon: BarChart3 },
  { name: 'Sales Quotes', path: '/sales/quotes', icon: FileText },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
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
        {navigation.map((item) => (
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
