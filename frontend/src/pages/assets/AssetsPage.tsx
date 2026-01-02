import { useQuery } from '@tanstack/react-query';
import { Wrench, AlertTriangle, Clock, CheckCircle2, Package, ArrowRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';
import { assetsApi, type AssetOverview } from '@services/assets/assets';
import { maintenanceSchedulesApi } from '@services/assets/maintenance';
import { workOrdersApi } from '@services/assets/work-orders';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@contexts/ToastContext';

export function AssetsPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const { data: overview, isLoading: overviewLoading } = useQuery<AssetOverview>({
    queryKey: ['assets', 'overview'],
    queryFn: () => assetsApi.getOverview(),
  });

  const { data: overdueMaintenance, isLoading: maintenanceLoading } = useQuery({
    queryKey: ['maintenance', 'overdue'],
    queryFn: () => maintenanceSchedulesApi.getOverdue(),
  });

  const { data: openWorkOrders, isLoading: workOrdersLoading } = useQuery({
    queryKey: ['work-orders', 'open'],
    queryFn: () => workOrdersApi.findAll(1, 10, 'OPEN'),
  });

  const canCreate = hasPermission('assets:create');

  if (overviewLoading || maintenanceLoading || workOrdersLoading) {
    return (
      <PageContainer title="Assets & Maintenance" description="Manage assets and maintenance activities">
        <div className="text-center py-12 text-content-secondary">Loading...</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Assets & Maintenance"
      description="Manage assets, maintenance schedules, and work orders"
      actions={
        canCreate ? (
          <Button
            variant="primary"
            onClick={() => navigate('/assets/registry?action=create')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Asset
          </Button>
        ) : undefined
      }
    >
      {/* Asset Health Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-content-secondary">Total Assets</h3>
            <Package className="w-5 h-5 text-content-tertiary" />
          </div>
          <p className="text-2xl font-bold text-content-primary">{overview?.totalAssets || 0}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-content-secondary">Operational</h3>
            <CheckCircle2 className="w-5 h-5 text-status-success" />
          </div>
          <p className="text-2xl font-bold text-status-success">{overview?.operationalAssets || 0}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-content-secondary">In Maintenance</h3>
            <Wrench className="w-5 h-5 text-status-warning" />
          </div>
          <p className="text-2xl font-bold text-status-warning">{overview?.maintenanceAssets || 0}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-content-secondary">Broken</h3>
            <AlertTriangle className="w-5 h-5 text-status-error" />
          </div>
          <p className="text-2xl font-bold text-status-error">{overview?.brokenAssets || 0}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Upcoming Maintenance */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-content-primary">Overdue Maintenance</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/assets/maintenance/schedules')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              View All
            </Button>
          </div>
          {overdueMaintenance && overdueMaintenance.length > 0 ? (
            <div className="space-y-3">
              {overdueMaintenance.slice(0, 5).map((schedule) => (
                <div
                  key={schedule.id}
                  className="p-3 rounded-lg bg-status-warning-bg border border-status-warning cursor-pointer hover:bg-background-secondary transition-colors"
                  onClick={() => navigate(`/assets/${schedule.assetId}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-content-primary">{schedule.asset?.name || 'Unknown Asset'}</p>
                      <p className="text-sm text-content-secondary">
                        {schedule.asset?.assetTag} • Due {schedule.nextDueAt ? new Date(schedule.nextDueAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <Badge variant="error">Overdue</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-content-secondary">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No overdue maintenance</p>
            </div>
          )}
        </Card>

        {/* Open Work Orders */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-content-primary">Open Work Orders</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/assets/work-orders')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              View All
            </Button>
          </div>
          {openWorkOrders && openWorkOrders.items.length > 0 ? (
            <div className="space-y-3">
              {openWorkOrders.items.slice(0, 5).map((wo) => (
                <div
                  key={wo.id}
                  className="p-3 rounded-lg bg-background-secondary cursor-pointer hover:bg-background-tertiary transition-colors"
                  onClick={() => navigate(`/assets/work-orders/${wo.id}`)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-content-primary">{wo.asset?.name || 'Unknown Asset'}</p>
                    <Badge
                      variant={
                        wo.priority === 'CRITICAL'
                          ? 'error'
                          : wo.priority === 'HIGH'
                          ? 'warning'
                          : 'default'
                      }
                      size="sm"
                    >
                      {wo.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-content-secondary line-clamp-1">{wo.description}</p>
                  <p className="text-xs text-content-tertiary mt-1">
                    {wo.assignedTo ? `${wo.assignedTo.firstName} ${wo.assignedTo.lastName}` : 'Unassigned'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-content-secondary">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No open work orders</p>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <h2 className="text-lg font-semibold text-content-primary mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="ghost"
            className="justify-start h-auto p-4"
            onClick={() => navigate('/assets/registry')}
          >
            <div className="text-left">
              <p className="font-medium text-content-primary">Asset Registry</p>
              <p className="text-sm text-content-secondary">View and manage all assets</p>
            </div>
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>

          <Button
            variant="ghost"
            className="justify-start h-auto p-4"
            onClick={() => navigate('/assets/work-orders')}
          >
            <div className="text-left">
              <p className="font-medium text-content-primary">Work Orders</p>
              <p className="text-sm text-content-secondary">Manage maintenance work orders</p>
            </div>
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>

          <Button
            variant="ghost"
            className="justify-start h-auto p-4"
            onClick={() => navigate('/assets/parts')}
          >
            <div className="text-left">
              <p className="font-medium text-content-primary">Spare Parts</p>
              <p className="text-sm text-content-secondary">Manage spare parts inventory</p>
            </div>
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>
        </div>
      </Card>
    </PageContainer>
  );
}
