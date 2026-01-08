import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Eye, Edit, Package, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Badge } from '@components/ui/Badge';
import { Modal, ModalFooter } from '@components/ui/Modal';
import { assetsApi, type CreateAssetDto } from '@services/assets/assets';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@contexts/ToastContext';
import { companiesApi } from '@services/sales/companies';
import { projectsApi } from '@services/sales/projects';
import { warehousesApi } from '@services/sales/warehouses';

export function AssetRegistryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasPermission } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState<CreateAssetDto>({
    assetTag: '',
    name: '',
    category: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    acquisitionDate: new Date().toISOString().split('T')[0],
    acquisitionCost: 0,
    currentValue: 0,
    status: 'OPERATIONAL',
    location: '',
    projectId: '',
    warehouseId: '',
    assignedTo: '',
    criticality: 'MEDIUM',
    expectedLifeYears: undefined,
    notes: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['assets', 'list', search, statusFilter],
    queryFn: () => assetsApi.findAll(1, 50, search || undefined, statusFilter || undefined),
  });

  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await companiesApi.findAll(1, 100);
      return res.data.data;
    },
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects', formData.projectId ? 'all' : ''],
    queryFn: async () => {
      const res = await projectsApi.findAll(undefined, 1, 100);
      return res.data.data;
    },
  });

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await warehousesApi.findAll(undefined, undefined, 1, 100);
      return res.data.data;
    },
  });

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'create') {
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

  const canCreate = hasPermission('assets:create');
  const canUpdate = hasPermission('assets:update');

  const createMutation = useMutation({
    mutationFn: (data: CreateAssetDto) => assetsApi.create(data),
    onSuccess: () => {
      success('Asset created successfully');
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setIsCreateModalOpen(false);
      setSearchParams({});
      setFormData({
        assetTag: '',
        name: '',
        category: '',
        manufacturer: '',
        model: '',
        serialNumber: '',
        acquisitionDate: new Date().toISOString().split('T')[0],
        acquisitionCost: 0,
        currentValue: 0,
        status: 'OPERATIONAL',
        location: '',
        projectId: '',
        warehouseId: '',
        assignedTo: '',
        criticality: 'MEDIUM',
        expectedLifeYears: undefined,
        notes: '',
      });
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to create asset');
    },
  });

  const handleCreate = () => {
    if (!formData.assetTag.trim() || !formData.name.trim() || !formData.category.trim()) {
      showError('Asset tag, name, and category are required');
      return;
    }
    const submitData: CreateAssetDto = {
      ...formData,
      manufacturer: formData.manufacturer || undefined,
      model: formData.model || undefined,
      serialNumber: formData.serialNumber || undefined,
      location: formData.location || undefined,
      projectId: formData.projectId || undefined,
      warehouseId: formData.warehouseId || undefined,
      assignedTo: formData.assignedTo || undefined,
      expectedLifeYears: formData.expectedLifeYears || undefined,
      notes: formData.notes || undefined,
    };
    createMutation.mutate(submitData);
  };

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
          )          )}
        </div>
      )}

      {/* Create Asset Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSearchParams({});
        }}
        title="Create Asset"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Asset Tag *"
              value={formData.assetTag}
              onChange={(e) => setFormData({ ...formData, assetTag: e.target.value })}
              required
            />
            <Input
              label="Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Category *"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            />
            <Input
              label="Manufacturer"
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Model"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            />
            <Input
              label="Serial Number"
              value={formData.serialNumber}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Acquisition Date *"
              type="date"
              value={formData.acquisitionDate}
              onChange={(e) => setFormData({ ...formData, acquisitionDate: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium mb-1 text-content-primary">Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-2 rounded-lg border border-border-default bg-background-primary text-content-primary"
              >
                <option value="OPERATIONAL">Operational</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="BROKEN">Broken</option>
                <option value="RETIRED">Retired</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Acquisition Cost *"
              type="number"
              step="0.01"
              min="0"
              value={formData.acquisitionCost}
              onChange={(e) => setFormData({ ...formData, acquisitionCost: parseFloat(e.target.value) || 0 })}
              required
            />
            <Input
              label="Current Value *"
              type="number"
              step="0.01"
              min="0"
              value={formData.currentValue}
              onChange={(e) => setFormData({ ...formData, currentValue: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium mb-1 text-content-primary">Criticality</label>
              <select
                value={formData.criticality}
                onChange={(e) => setFormData({ ...formData, criticality: e.target.value as any })}
                className="w-full px-4 py-2 rounded-lg border border-border-default bg-background-primary text-content-primary"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-content-primary">Project</label>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-border-default bg-background-primary text-content-primary"
              >
                <option value="">No project</option>
                {projectsData?.items.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-content-primary">Warehouse</label>
              <select
                value={formData.warehouseId}
                onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-border-default bg-background-primary text-content-primary"
              >
                <option value="">No warehouse</option>
                {warehousesData?.items.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Assigned To"
            value={formData.assignedTo}
            onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
            placeholder="Operator or department"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Expected Life (years)"
              type="number"
              min="1"
              value={formData.expectedLifeYears || ''}
              onChange={(e) => setFormData({ ...formData, expectedLifeYears: e.target.value ? parseInt(e.target.value) : undefined })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-content-primary">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border-default bg-background-primary text-content-primary"
              rows={3}
            />
          </div>
        </div>

        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setIsCreateModalOpen(false);
              setSearchParams({});
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreate}
            isLoading={createMutation.isPending}
          >
            Create Asset
          </Button>
        </ModalFooter>
      </Modal>
    </PageContainer>
  );
}
