import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { notificationsApi, type Notification } from '@services/notifications/notifications';
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
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await notificationsApi.findAll();
      return res.data.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: unreadCountData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await notificationsApi.getUnreadCount();
      return res.data.data;
    },
    refetchInterval: 30000,
  });

  const unreadCount = unreadCountData?.count || 0;

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    markAsReadMutation.mutate(notification.id);
    if (notification.link) {
      navigate(notification.link);
      setNotificationMenuOpen(false);
    }
  };

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationMenuRef.current &&
        !notificationMenuRef.current.contains(event.target as Node)
      ) {
        setNotificationMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get page title from path
  const pathSegments = location.pathname.split('/').filter(Boolean);

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
          <div className="relative" ref={notificationMenuRef}>
            <button
              onClick={() => setNotificationMenuOpen(!notificationMenuOpen)}
              className={clsx(
                'relative p-2 rounded-lg transition-colors',
                'hover:bg-background-hover',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40'
              )}
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-content-secondary" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-status-error rounded-full text-xs text-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notificationMenuOpen && (
              <div
                className={clsx(
                  'absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto',
                  'bg-background-elevated border border-border-default rounded-lg shadow-elevation-3',
                  'animate-scale-in origin-top-right'
                )}
              >
                <div className="p-4 border-b border-border-default flex items-center justify-between">
                  <h3 className="font-semibold text-content-primary">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsReadMutation.mutate()}
                      className="text-xs text-accent-primary hover:underline"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="py-2">
                  {notifications && notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={clsx(
                          'w-full text-left px-4 py-3 hover:bg-background-hover transition-colors',
                          'border-b border-border-default last:border-b-0',
                          !notification.read && 'bg-status-info-bg/30'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={clsx(
                            'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                            !notification.read ? 'bg-accent-primary' : 'bg-transparent'
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className={clsx(
                              'text-sm font-medium',
                              !notification.read ? 'text-content-primary' : 'text-content-secondary'
                            )}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-content-tertiary mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-content-tertiary mt-1">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-content-secondary text-sm">
                      No notifications
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

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
