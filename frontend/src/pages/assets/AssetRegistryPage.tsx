import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, Eye, Edit, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Badge } from '@components/ui/Badge';
import { assetsApi } from '@services/assets/assets';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@contexts/ToastContext';

export function AssetRegistryPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { success } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['assets', 'list', search, statusFilter],
    queryFn: () => assetsApi.findAll(1, 50, search || undefined, statusFilter || undefined),
  });

  const canCreate = hasPermission('assets:create');
  const canUpdate = hasPermission('assets:update');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPERATIONAL':
        return <Badge variant="success">Operational</Badge>;
      case 'MAINTENANCE':
        return <Badge variant="warning">Maintenance</Badge>;
      case 'BROKEN':
        return <Badge variant="error">Broken</Badge>;
      case 'RETIRED':
        return <Badge variant="default">Retired</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getCriticalityBadge = (criticality: string) => {
    switch (criticality) {
      case 'HIGH':
        return <Badge variant="error" size="sm">High</Badge>;
      case 'MEDIUM':
        return <Badge variant="warning" size="sm">Medium</Badge>;
      case 'LOW':
        return <Badge variant="default" size="sm">Low</Badge>;
      default:
        return null;
    }
  };

  return (
    <PageContainer
      title="Asset Registry"
      description="View and manage all assets"
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
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-content-tertiary" />
          <Input
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            aria-label="Search assets by tag, name, category, or manufacturer"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-border-default bg-background-primary text-content-primary"
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="OPERATIONAL">Operational</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="BROKEN">Broken</option>
          <option value="RETIRED">Retired</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-content-secondary">Loading...</div>
      ) : !data || data.items.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-content-tertiary" />
          <h3 className="text-lg font-semibold text-content-primary mb-2">No assets found</h3>
          <p className="text-content-secondary mb-4">
            {search || statusFilter ? 'Try adjusting your search or filters' : 'Get started by creating your first asset'}
          </p>
          {canCreate && (
            <Button variant="primary" onClick={() => navigate('/assets/registry?action=create')} leftIcon={<Plus className="w-4 h-4" />}>
              Create Asset
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {data.items.map((asset) => (
            <Card key={asset.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-content-primary">{asset.name}</h3>
                    {getStatusBadge(asset.status)}
                    {getCriticalityBadge(asset.criticality)}
                    <span className="text-sm text-content-tertiary font-mono">{asset.assetTag}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-content-tertiary">Category:</span>
                      <p className="text-content-primary font-medium">{asset.category}</p>
                    </div>
                    {asset.manufacturer && (
                      <div>
                        <span className="text-content-tertiary">Manufacturer:</span>
                        <p className="text-content-primary font-medium">{asset.manufacturer}</p>
                      </div>
                    )}
                    {asset.location && (
                      <div>
                        <span className="text-content-tertiary">Location:</span>
                        <p className="text-content-primary font-medium">{asset.location}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-content-tertiary">Value:</span>
                      <p className="text-content-primary font-medium">${Number(asset.currentValue).toLocaleString()}</p>
                    </div>
                  </div>
                  {asset._count && (
                    <div className="flex gap-4 text-xs text-content-tertiary">
                      <span>{asset._count.workOrders || 0} work orders</span>
                      <span>{asset._count.maintenanceSchedules || 0} schedules</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(`/assets/${asset.id}`)}
                    leftIcon={<Eye className="w-4 h-4" />}
                    aria-label={`View ${asset.name}`}
                  >
                    View
                  </Button>
                  {canUpdate && asset.status !== 'RETIRED' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/assets/${asset.id}?action=edit`)}
                      leftIcon={<Edit className="w-4 h-4" />}
                      aria-label={`Edit ${asset.name}`}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
