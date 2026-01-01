import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  ChevronRight,
  User,
  LogOut,
  Settings,
  Bell,
} from 'lucide-react';
import { useAuth } from '@contexts/AuthContext';
import { ThemeToggle } from '@components/ui/ThemeToggle';

interface HeaderProps {
  sidebarCollapsed: boolean;
}

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/administration': 'Administration',
  '/operations': 'Operations',
  '/production': 'Production Tracking',
  '/costing': 'Costing',
  '/inventory': 'Inventory & Warehousing',
  '/assets': 'Assets & Maintenance',
  '/logistics': 'Logistics & Transport',
  '/customers': 'Customers & Sales',
  '/reporting': 'Reporting & Analytics',
  '/profile': 'Profile',
};

export function Header({ sidebarCollapsed }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get page title from path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const basePath = '/' + (pathSegments[0] || '');
  const _pageTitle = pageTitles[basePath] || 'Page';

  // Build breadcrumbs
  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    const title = pageTitles[path] || segment.charAt(0).toUpperCase() + segment.slice(1);
    return { path, title };
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-background-primary/80 backdrop-blur-md border-b border-border-default">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left: Breadcrumb */}
        <div className="flex items-center gap-2">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.path} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 mx-2 text-content-muted" />
              )}
              {index === breadcrumbs.length - 1 ? (
                <h1 className="text-lg font-semibold text-content-primary">
                  {crumb.title}
                </h1>
              ) : (
                <Link
                  to={crumb.path}
                  className="text-sm text-content-tertiary hover:text-content-primary transition-colors"
                >
                  {crumb.title}
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button
            className={clsx(
              'p-2 rounded-lg transition-colors',
              'hover:bg-background-hover',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40'
            )}
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-content-secondary" />
          </button>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className={clsx(
                'flex items-center gap-3 p-2 rounded-lg transition-colors',
                'hover:bg-background-hover',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40'
              )}
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
            >
              <div className="w-8 h-8 rounded-full bg-accent-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-accent-primary">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </span>
              </div>
              {!sidebarCollapsed && (
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-content-primary">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-content-tertiary truncate max-w-[120px]">
                    {user?.email}
                  </p>
                </div>
              )}
            </button>

            {userMenuOpen && (
              <div
                className={clsx(
                  'absolute right-0 mt-2 w-56 py-1',
                  'bg-background-elevated border border-border-default rounded-lg shadow-elevation-3',
                  'animate-scale-in origin-top-right'
                )}
                role="menu"
              >
                <div className="px-4 py-3 border-b border-border-default">
                  <p className="text-sm font-medium text-content-primary">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-content-tertiary truncate">
                    {user?.email}
                  </p>
                </div>

                <div className="py-1">
                  <Link
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-content-secondary hover:bg-background-hover transition-colors"
                    role="menuitem"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                  <Link
                    to="/administration"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-content-secondary hover:bg-background-hover transition-colors"
                    role="menuitem"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                </div>

                <div className="border-t border-border-default py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-status-error hover:bg-background-hover transition-colors"
                    role="menuitem"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
