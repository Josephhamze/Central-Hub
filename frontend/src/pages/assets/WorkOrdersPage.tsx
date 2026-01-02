import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, Wrench, Clock, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Badge } from '@components/ui/Badge';
import { workOrdersApi } from '@services/assets/work-orders';
import { useAuth } from '@contexts/AuthContext';

export function WorkOrdersPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['work-orders', 'list', statusFilter],
    queryFn: () => workOrdersApi.findAll(1, 50, statusFilter || undefined),
  });

  const canCreate = hasPermission('workorders:create');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="default">Open</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="warning">In Progress</Badge>;
      case 'WAITING_PARTS':
        return <Badge variant="info">Waiting Parts</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="default">Cancelled</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return <Badge variant="error" size="sm">Critical</Badge>;
      case 'HIGH':
        return <Badge variant="warning" size="sm">High</Badge>;
      case 'MEDIUM':
        return <Badge variant="default" size="sm">Medium</Badge>;
      case 'LOW':
        return <Badge variant="default" size="sm">Low</Badge>;
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PREVENTIVE':
        return <Clock className="w-4 h-4" />;
      case 'CORRECTIVE':
        return <Wrench className="w-4 h-4" />;
      case 'INSPECTION':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <Wrench className="w-4 h-4" />;
    }
  };

  return (
    <PageContainer
      title="Work Orders"
      description="Manage maintenance work orders"
      actions={
        canCreate ? (
          <Button
            variant="primary"
            onClick={() => navigate('/assets/work-orders?action=create')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Work Order
          </Button>
        ) : undefined
      }
    >
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-content-tertiary" />
          <Input
            placeholder="Search work orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            aria-label="Search work orders"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-border-default bg-background-primary text-content-primary"
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="WAITING_PARTS">Waiting Parts</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-content-secondary">Loading...</div>
      ) : !data || data.items.length === 0 ? (
        <Card className="p-12 text-center">
          <Wrench className="w-12 h-12 mx-auto mb-4 text-content-tertiary" />
          <h3 className="text-lg font-semibold text-content-primary mb-2">No work orders found</h3>
          <p className="text-content-secondary mb-4">
            {statusFilter ? 'Try adjusting your filters' : 'Get started by creating your first work order'}
          </p>
          {canCreate && (
            <Button variant="primary" onClick={() => navigate('/assets/work-orders?action=create')} leftIcon={<Plus className="w-4 h-4" />}>
              Create Work Order
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {data.items.map((wo) => (
            <Card
              key={wo.id}
              className="p-6 cursor-pointer hover:bg-background-secondary transition-colors"
              onClick={() => navigate(`/assets/work-orders/${wo.id}`)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(wo.type)}
                      <h3 className="text-lg font-semibold text-content-primary">{wo.asset?.name || 'Unknown Asset'}</h3>
                    </div>
                    {getStatusBadge(wo.status)}
                    {getPriorityBadge(wo.priority)}
                    <span className="text-sm text-content-tertiary">#{wo.id.slice(0, 8)}</span>
                  </div>
                  <p className="text-content-secondary mb-3">{wo.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-content-tertiary">Type:</span>
                      <p className="text-content-primary font-medium capitalize">{wo.type.toLowerCase()}</p>
                    </div>
                    {wo.assignedTo && (
                      <div>
                        <span className="text-content-tertiary">Assigned To:</span>
                        <p className="text-content-primary font-medium">
                          {wo.assignedTo.firstName} {wo.assignedTo.lastName}
                        </p>
                      </div>
                    )}
                    {wo.totalCost > 0 && (
                      <div>
                        <span className="text-content-tertiary">Total Cost:</span>
                        <p className="text-content-primary font-medium">${Number(wo.totalCost).toLocaleString()}</p>
                      </div>
                    )}
                    {wo.completedAt && (
                      <div>
                        <span className="text-content-tertiary">Completed:</span>
                        <p className="text-content-primary font-medium">
                          {new Date(wo.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
