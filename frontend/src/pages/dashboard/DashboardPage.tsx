import {
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Package,
  DollarSign,
  Clock,
  Factory,
  Calculator,
  Warehouse,
  FileText,
  ArrowRight,
  Settings,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@components/layout/PageContainer';
import { Card, CardHeader } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { EmptyState } from '@components/ui/EmptyState';
import { useAuth } from '@contexts/AuthContext';
import { PERMISSIONS } from '@config/permissions';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
}

function StatCard({ title, value, change, trend, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-content-tertiary">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-content-primary">
            {value}
          </p>
          {change && (
            <div className="mt-2 flex items-center gap-1">
              {trend === 'up' && (
                <TrendingUp className="w-4 h-4 text-status-success" />
              )}
              {trend === 'down' && (
                <TrendingDown className="w-4 h-4 text-status-error" />
              )}
              <span
                className={`text-xs font-medium ${
                  trend === 'up'
                    ? 'text-status-success'
                    : trend === 'down'
                    ? 'text-status-error'
                    : 'text-content-tertiary'
                }`}
              >
                {change}
              </span>
            </div>
          )}
        </div>
        <div className="p-3 rounded-xl bg-background-tertiary">
          <Icon className="w-5 h-5 text-content-secondary" />
        </div>
      </div>
    </Card>
  );
}

interface QuickAccessSection {
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  color: string;
  permissions?: string[];
  adminOnly?: boolean;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { hasPermission, hasRole } = useAuth();

  const isAdmin = hasRole('Administrator') || hasRole('Admin');

  // Placeholder stats for demonstration
  const stats: StatCardProps[] = [
    {
      title: 'Active Operations',
      value: '—',
      icon: Activity,
    },
    {
      title: 'Total Users',
      value: '—',
      icon: Users,
    },
    {
      title: 'Inventory Items',
      value: '—',
      icon: Package,
    },
    {
      title: 'Monthly Costs',
      value: '—',
      icon: DollarSign,
    },
  ];

  // Quick access sections matching new navigation
  const allQuickAccessSections: QuickAccessSection[] = [
    {
      title: 'Operations & Production',
      description: 'Manage operational activities and production processes',
      icon: Factory,
      path: '/operations-production',
      color: 'bg-blue-500/10 text-blue-500',
      permissions: [PERMISSIONS.QUOTES_VIEW, PERMISSIONS.LOGISTICS_ROUTES_VIEW],
    },
    {
      title: 'Finance & Reporting',
      description: 'Track costs, budgets, and generate analytical reports',
      icon: Calculator,
      path: '/finance-reporting',
      color: 'bg-green-500/10 text-green-500',
      permissions: [PERMISSIONS.REPORTING_VIEW_SALES_KPIS],
    },
    {
      title: 'Inventory & Assets',
      description: 'Manage stock levels, warehouses, and asset maintenance',
      icon: Warehouse,
      path: '/inventory-assets',
      color: 'bg-purple-500/10 text-purple-500',
      permissions: [PERMISSIONS.WAREHOUSES_VIEW, PERMISSIONS.STOCK_VIEW, PERMISSIONS.ASSETS_VIEW],
    },
    {
      title: 'Quotes',
      description: 'Manage sales quotes, customers, and logistics',
      icon: FileText,
      path: '/sales/quotes',
      color: 'bg-orange-500/10 text-orange-500',
      permissions: [PERMISSIONS.QUOTES_VIEW],
    },
    {
      title: 'Administration',
      description: 'Manage users, roles, and system settings',
      icon: Settings,
      path: '/administration',
      color: 'bg-red-500/10 text-red-500',
      permissions: [PERMISSIONS.USERS_VIEW, PERMISSIONS.ROLES_VIEW],
      adminOnly: true,
    },
  ];

  // Filter sections based on permissions
  const quickAccessSections = allQuickAccessSections.filter((section) => {
    if (isAdmin) return true;
    if (section.adminOnly) return false;
    if (!section.permissions || section.permissions.length === 0) return true;
    return section.permissions.some((p) => hasPermission(p));
  });

  return (
    <PageContainer
      title="Dashboard"
      description="Overview of your operations"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Quick Access Sections */}
      <Card className="mb-6">
        <CardHeader
          title="Quick Access"
          description="Navigate to main sections"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickAccessSections.map((section) => (
            <Card
              key={section.path}
              className="p-4 cursor-pointer hover:shadow-lg transition-all border-2 border-border-default hover:border-accent-primary"
              onClick={() => navigate(section.path)}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${section.color}`}>
                  <section.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-content-primary mb-1">
                    {section.title}
                  </h3>
                  <p className="text-xs text-content-secondary line-clamp-2">
                    {section.description}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-content-tertiary flex-shrink-0 mt-1" />
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent Activity"
            description="Latest updates across all modules"
            action={
              <Badge variant="info">
                <Clock className="w-3 h-3 mr-1" />
                Live
              </Badge>
            }
          />
          <EmptyState
            icon={<Activity className="w-8 h-8" />}
            title="No recent activity"
            description="Activity will appear here once modules are implemented"
          />
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader
            title="System Status"
            description="Platform health overview"
          />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-content-secondary">API Status</span>
              <Badge variant="success">Operational</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-content-secondary">Database</span>
              <Badge variant="success">Connected</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-content-secondary">Modules</span>
              <Badge variant="default">4 Active</Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Module Status - only show modules user has access to */}
      {quickAccessSections.length > 0 && (
        <Card className="mt-6">
          <CardHeader
            title="Available Modules"
            description="Modules you have access to"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickAccessSections.map((module) => (
              <div
                key={module.path}
                className="p-4 rounded-lg bg-background-secondary border border-border-subtle cursor-pointer hover:border-accent-primary transition-colors"
                onClick={() => navigate(module.path)}
              >
                <p className="text-sm font-medium text-content-primary mb-2">
                  {module.title}
                </p>
                <Badge variant="success" size="sm">
                  Active
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </PageContainer>
  );
}
