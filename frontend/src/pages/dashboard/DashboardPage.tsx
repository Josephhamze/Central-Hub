import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Package,
  DollarSign,
  Clock,
} from 'lucide-react';
import { PageContainer } from '@components/layout/PageContainer';
import { Card, CardHeader } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { EmptyState } from '@components/ui/EmptyState';
import { api } from '@services/api';

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

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await api.get('/dashboard');
      return response.data.data;
    },
  });

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
              <Badge variant="default">10 Placeholder</Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Module Status */}
      <Card className="mt-6">
        <CardHeader
          title="Module Implementation Status"
          description="Current state of each module in the system"
        />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            'Dashboard',
            'Administration',
            'Operations',
            'Production',
            'Costing',
            'Inventory',
            'Assets',
            'Logistics',
            'Customers',
            'Reporting',
          ].map((module) => (
            <div
              key={module}
              className="p-4 rounded-lg bg-background-secondary border border-border-subtle"
            >
              <p className="text-sm font-medium text-content-primary mb-2">
                {module}
              </p>
              <Badge variant="default" size="sm">
                Placeholder
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </PageContainer>
  );
}
