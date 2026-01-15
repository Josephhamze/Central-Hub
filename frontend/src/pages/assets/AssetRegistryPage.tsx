import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Eye, Edit, Package } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Badge } from '@components/ui/Badge';
import { Modal, ModalFooter } from '@components/ui/Modal';
import { assetsApi, type CreateAssetDto, type IndexType, type AssetLifecycleStatus, type Asset } from '@services/assets/assets';
import { projectsApi } from '@services/sales/projects';
import { companiesApi } from '@services/sales/companies';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@contexts/ToastContext';

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
    // ASSET IDENTITY
    assetName: '',
    category: '',
    type: '',
    manufacturer: '',
    model: '',
    // ALLOCATION
    companyId: '',
    projectId: '',
    companyCode: '',
    // IDENTIFICATION
    serialNumber: '',
    registrationNumber: '',
    // FINANCIAL INFORMATION
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseValue: 0,
    currency: 'USD',
    // LIFECYCLE
    installDate: new Date().toISOString().split('T')[0],
    endOfLifeDate: '',
    // INDEX DETAILS
    indexType: 'HOURS',
    // STATUS
    status: 'OPERATIONAL',
  });

  // Check for action=create in URL params
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'create') {
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

  const { data, isLoading } = useQuery({
    queryKey: ['assets', 'list', search, statusFilter],
    queryFn: () => assetsApi.findAll(1, 50, search || undefined, statusFilter || undefined),
  });

  // Fetch companies, projects, warehouses, and assets for dropdowns
  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await companiesApi.findAll(1, 100);
      return res.data.data;
    },
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await projectsApi.findAll(undefined, 1, 100);
      return res.data.data;
    },
  });

  const { data: assetsData } = useQuery({
    queryKey: ['assets', 'all'],
    queryFn: async () => {
      return await assetsApi.findAll(1, 1000);
    },
  });

  const canCreate = hasPermission('assets:create');
  const canUpdate = hasPermission('assets:update');

  const createMutation = useMutation({
    mutationFn: (data: CreateAssetDto) => assetsApi.create(data),
    onSuccess: () => {
      success('Asset created successfully');
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setIsCreateModalOpen(false);
      setSearchParams({}); // Clear URL params
      // Reset form
      setFormData({
        assetName: '',
        category: '',
        type: '',
        manufacturer: '',
        model: '',
        companyId: '',
        projectId: '',
        companyCode: '',
        serialNumber: '',
        registrationNumber: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        purchaseValue: 0,
        currency: 'USD',
        installDate: new Date().toISOString().split('T')[0],
        endOfLifeDate: '',
        indexType: 'HOURS',
        status: 'OPERATIONAL',
      });
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to create asset');
    },
  });

  const handleCreate = () => {
    // Validate required fields
    if (!formData.assetName || !formData.category || !formData.type || !formData.manufacturer || !formData.model || 
        !formData.companyId || !formData.projectId || !formData.companyCode || 
        (!formData.serialNumber && !formData.registrationNumber) ||
        !formData.purchaseDate || !formData.purchaseValue || !formData.currency ||
        !formData.installDate || !formData.endOfLifeDate || !formData.indexType) {
      showError('Please fill in all required fields. Note: Either Serial Number or Registration Number is required.');
      return;
    }

    createMutation.mutate(formData);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setSearchParams({}); // Clear URL params
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
          ))}
        </div>
      )}

      {/* Create Asset Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        title="Create Asset"
        description="Add a new asset to the registry"
        size="xl"
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          {/* ASSET IDENTITY */}
          <div>
            <h3 className="text-lg font-semibold text-content-primary mb-4 pb-2 border-b border-border-default">ASSET IDENTITY</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Asset Name *"
                value={formData.assetName}
                onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                placeholder="Enter the clear name of the asset"
                required
              />
              <Input
                label="Category *"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Select the main category the asset belongs to"
                required
              />
              <Input
                label="Type *"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                placeholder="Select the specific type of asset"
                required
              />
              <Input
                label="Family"
                value={formData.family || ''}
                onChange={(e) => setFormData({ ...formData, family: e.target.value })}
                placeholder="System generated asset family"
                disabled
              />
              <Input
                label="Manufacturer *"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                placeholder="Enter the manufacturer of the asset"
                required
              />
              <Input
                label="Model *"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Enter the model of the asset"
                required
              />
              <Input
                label="Year Model"
                type="number"
                value={formData.yearModel || ''}
                onChange={(e) => setFormData({ ...formData, yearModel: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Enter the manufacturing year of the asset"
              />
              <Input
                label="Color"
                value={formData.color || ''}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="Enter the primary color of the asset"
              />
            </div>
          </div>

          {/* ALLOCATION */}
          <div>
            <h3 className="text-lg font-semibold text-content-primary mb-4 pb-2 border-b border-border-default">ALLOCATION</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-content-primary mb-1">
                  Company * <span className="text-content-tertiary text-xs">(Select the company that owns this asset)</span>
                </label>
                <select
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-border-default bg-background-primary text-content-primary"
                  required
                >
                  <option value="">Select company</option>
                  {companiesData?.items.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-content-primary mb-1">
                  Project * <span className="text-content-tertiary text-xs">(Select the project the asset is allocated on)</span>
                </label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-border-default bg-background-primary text-content-primary"
                  required
                >
                  <option value="">Select project</option>
                  {projectsData?.items.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Company Code *"
                value={formData.companyCode}
                onChange={(e) => setFormData({ ...formData, companyCode: e.target.value })}
                placeholder="Enter the internal company code for the owning company"
                required
              />
              <Input
                label="Country of Registration"
                value={formData.countryOfRegistration || ''}
                onChange={(e) => setFormData({ ...formData, countryOfRegistration: e.target.value })}
                placeholder="Select the country where the asset is legally registered"
              />
              <Input
                label="Current Location"
                value={formData.currentLocation || ''}
                onChange={(e) => setFormData({ ...formData, currentLocation: e.target.value })}
                placeholder="Enter the site or location where the asset is currently based"
              />
              <div>
                <label className="block text-sm font-medium text-content-primary mb-1">
                  Parent Asset <span className="text-content-tertiary text-xs">(Select the parent asset if this asset is attached to or part of another)</span>
                </label>
                <select
                  value={formData.parentAssetId || ''}
                  onChange={(e) => setFormData({ ...formData, parentAssetId: e.target.value || undefined })}
                  className="w-full px-4 py-2 rounded-lg border border-border-default bg-background-primary text-content-primary"
                >
                  <option value="">None</option>
                  {assetsData?.items.map((asset: Asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.assetTag} - {asset.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* IDENTIFICATION */}
          <div>
            <h3 className="text-lg font-semibold text-content-primary mb-4 pb-2 border-b border-border-default">IDENTIFICATION</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Serial Number *"
                value={formData.serialNumber || ''}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                placeholder="Enter the manufacturer serial number of the asset"
                required={!formData.registrationNumber}
              />
              <Input
                label="Registration Number *"
                value={formData.registrationNumber || ''}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                placeholder="Enter the legal registration or plate number"
                required={!formData.serialNumber}
              />
              <Input
                label="Chassis Number"
                value={formData.chassisNumber || ''}
                onChange={(e) => setFormData({ ...formData, chassisNumber: e.target.value })}
                placeholder="Enter the chassis or frame identification number"
              />
              <Input
                label="Engine Number"
                value={formData.engineNumber || ''}
                onChange={(e) => setFormData({ ...formData, engineNumber: e.target.value })}
                placeholder="Enter the engine serial number"
              />
            </div>
          </div>

          {/* FINANCIAL INFORMATION */}
          <div>
            <h3 className="text-lg font-semibold text-content-primary mb-4 pb-2 border-b border-border-default">FINANCIAL INFORMATION</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Purchase Date *"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                required
              />
              <Input
                label="Purchase Value *"
                type="number"
                step="0.01"
                min="0"
                value={formData.purchaseValue}
                onChange={(e) => setFormData({ ...formData, purchaseValue: Number(e.target.value) })}
                placeholder="Enter the purchase cost of the asset"
                required
              />
              <div>
                <label className="block text-sm font-medium text-content-primary mb-1">
                  Currency * <span className="text-content-tertiary text-xs">(Select the currency of the purchase value)</span>
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-border-default bg-background-primary text-content-primary"
                  required
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="XOF">XOF</option>
                </select>
              </div>
              <Input
                label="Brand New Value"
                type="number"
                step="0.01"
                min="0"
                value={formData.brandNewValue || ''}
                onChange={(e) => setFormData({ ...formData, brandNewValue: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Enter the cost to replace this asset with a new one"
              />
              <Input
                label="Current Market Value"
                type="number"
                step="0.01"
                min="0"
                value={formData.currentMarketValue || ''}
                onChange={(e) => setFormData({ ...formData, currentMarketValue: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Enter the current estimated resale value"
              />
              <Input
                label="Residual Value"
                type="number"
                step="0.01"
                min="0"
                value={formData.residualValue || ''}
                onChange={(e) => setFormData({ ...formData, residualValue: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Enter the expected value of the asset at the end of its life"
              />
              <Input
                label="Purchase Order"
                value={formData.purchaseOrder || ''}
                onChange={(e) => setFormData({ ...formData, purchaseOrder: e.target.value })}
                placeholder="Enter the purchase order reference number"
              />
              <Input
                label="GL Account"
                value={formData.glAccount || ''}
                onChange={(e) => setFormData({ ...formData, glAccount: e.target.value })}
                placeholder="Enter the accounting general ledger account"
              />
            </div>
          </div>

          {/* LIFECYCLE */}
          <div>
            <h3 className="text-lg font-semibold text-content-primary mb-4 pb-2 border-b border-border-default">LIFECYCLE</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Install Date *"
                type="date"
                value={formData.installDate}
                onChange={(e) => setFormData({ ...formData, installDate: e.target.value })}
                required
              />
              <Input
                label="End of Life Date *"
                type="date"
                value={formData.endOfLifeDate}
                onChange={(e) => setFormData({ ...formData, endOfLifeDate: e.target.value })}
                required
              />
              <Input
                label="Disposal Date"
                type="date"
                value={formData.disposalDate || ''}
                onChange={(e) => setFormData({ ...formData, disposalDate: e.target.value || undefined })}
              />
              <div>
                <label className="block text-sm font-medium text-content-primary mb-1">
                  Asset Lifecycle Status <span className="text-content-tertiary text-xs">(Select the current lifecycle phase of the asset)</span>
                </label>
                <select
                  value={formData.assetLifecycleStatus || ''}
                  onChange={(e) => setFormData({ ...formData, assetLifecycleStatus: e.target.value as AssetLifecycleStatus || undefined })}
                  className="w-full px-4 py-2 rounded-lg border border-border-default bg-background-primary text-content-primary"
                >
                  <option value="">Select status</option>
                  <option value="NEW">New</option>
                  <option value="IN_SERVICE">In Service</option>
                  <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                  <option value="IDLE">Idle</option>
                  <option value="RETIRED">Retired</option>
                  <option value="DISPOSED">Disposed</option>
                </select>
              </div>
            </div>
          </div>

          {/* INDEX DETAILS */}
          <div>
            <h3 className="text-lg font-semibold text-content-primary mb-4 pb-2 border-b border-border-default">Index Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-content-primary mb-1">
                  Index Type * <span className="text-content-tertiary text-xs">(Select how usage of the asset is measured)</span>
                </label>
                <select
                  value={formData.indexType}
                  onChange={(e) => setFormData({ ...formData, indexType: e.target.value as IndexType })}
                  className="w-full px-4 py-2 rounded-lg border border-border-default bg-background-primary text-content-primary"
                  required
                >
                  <option value="HOURS">Hours</option>
                  <option value="KILOMETERS">Kilometers</option>
                  <option value="MILES">Miles</option>
                  <option value="CYCLES">Cycles</option>
                  <option value="UNITS">Units</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <Input
                label="Current Index"
                type="number"
                step="0.01"
                min="0"
                value={formData.currentIndex || ''}
                onChange={(e) => setFormData({ ...formData, currentIndex: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Enter the current usage reading"
              />
              <Input
                label="Index at Purchase"
                type="number"
                step="0.01"
                min="0"
                value={formData.indexAtPurchase || ''}
                onChange={(e) => setFormData({ ...formData, indexAtPurchase: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Enter the usage reading when the asset was purchased"
              />
              <Input
                label="Last Index Date"
                type="date"
                value={formData.lastIndexDate || ''}
                onChange={(e) => setFormData({ ...formData, lastIndexDate: e.target.value || undefined })}
              />
            </div>
          </div>

          {/* STATUS */}
          <div>
            <h3 className="text-lg font-semibold text-content-primary mb-4 pb-2 border-b border-border-default">STATUS</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-content-primary mb-1">
                  Status * <span className="text-content-tertiary text-xs">(Select the current operational state of the asset)</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-2 rounded-lg border border-border-default bg-background-primary text-content-primary"
                  required
                >
                  <option value="OPERATIONAL">Operational</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="BROKEN">Broken</option>
                  <option value="RETIRED">Retired</option>
                </select>
              </div>
              <Input
                label="Status Since"
                type="date"
                value={formData.statusSince || ''}
                onChange={(e) => setFormData({ ...formData, statusSince: e.target.value || undefined })}
              />
              <Input
                label="Availability Percent"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.availabilityPercent || ''}
                onChange={(e) => setFormData({ ...formData, availabilityPercent: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Enter the percentage of time the asset is available for use"
              />
              <Input
                label="Last Operator"
                value={formData.lastOperator || ''}
                onChange={(e) => setFormData({ ...formData, lastOperator: e.target.value })}
                placeholder="Enter the name or ID of the last person who operated the asset"
              />
            </div>
          </div>

          {/* MAINTENANCE */}
          <div>
            <h3 className="text-lg font-semibold text-content-primary mb-4 pb-2 border-b border-border-default">MAINTENANCE</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Last Maintenance Date"
                type="date"
                value={formData.lastMaintenanceDate || ''}
                onChange={(e) => setFormData({ ...formData, lastMaintenanceDate: e.target.value || undefined })}
              />
              <Input
                label="Next Maintenance Date"
                type="date"
                value={formData.nextMaintenanceDate || ''}
                onChange={(e) => setFormData({ ...formData, nextMaintenanceDate: e.target.value || undefined })}
              />
              <Input
                label="Maintenance Budget"
                type="number"
                step="0.01"
                min="0"
                value={formData.maintenanceBudget || ''}
                onChange={(e) => setFormData({ ...formData, maintenanceBudget: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Enter the planned maintenance budget for this asset"
              />
            </div>
          </div>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreate} isLoading={createMutation.isPending}>
            Create Asset
          </Button>
        </ModalFooter>
      </Modal>
    </PageContainer>
  );
}
