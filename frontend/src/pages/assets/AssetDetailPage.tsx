import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, Save, X, AlertTriangle } from 'lucide-react';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Badge } from '@components/ui/Badge';
import { Modal, ModalFooter } from '@components/ui/Modal';
import { assetsApi, type UpdateAssetDto } from '@services/assets/assets';
import { projectsApi } from '@services/sales/projects';
import { companiesApi } from '@services/sales/companies';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@contexts/ToastContext';

export function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasPermission } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  const isEditMode = searchParams.get('action') === 'edit';
  const [formData, setFormData] = useState<UpdateAssetDto>({});
  const [isRetireModalOpen, setIsRetireModalOpen] = useState(false);

  const canUpdate = hasPermission('assets:update');
  const canDelete = hasPermission('assets:delete');

  const { data: asset, isLoading, error } = useQuery({
    queryKey: ['asset', id],
    queryFn: () => assetsApi.findOne(id!),
    enabled: !!id,
  });

  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await companiesApi.findAll(1, 100);
      return res.data.data;
    },
    enabled: isEditMode,
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await projectsApi.findAll(undefined, 1, 100);
      return res.data.data;
    },
    enabled: isEditMode,
  });


  useEffect(() => {
    if (asset && isEditMode) {
      setFormData({
        assetName: asset.name,
        category: asset.category,
        type: asset.type,
        family: asset.family,
        manufacturer: asset.manufacturer,
        model: asset.model,
        yearModel: asset.yearModel,
        color: asset.color,
        companyId: asset.companyId,
        projectId: asset.projectId,
        companyCode: asset.companyCode,
        countryOfRegistration: asset.countryOfRegistration,
        currentLocation: asset.currentLocation,
        parentAssetId: asset.parentAssetId,
        serialNumber: asset.serialNumber,
        chassisNumber: asset.chassisNumber,
        engineNumber: asset.engineNumber,
        registrationNumber: asset.registrationNumber,
        purchaseDate: asset.purchaseDate?.split('T')[0],
        purchaseValue: asset.purchaseValue,
        currency: asset.currency,
        brandNewValue: asset.brandNewValue,
        currentMarketValue: asset.currentMarketValue,
        residualValue: asset.residualValue,
        purchaseOrder: asset.purchaseOrder,
        glAccount: asset.glAccount,
        installDate: asset.installDate?.split('T')[0],
        endOfLifeDate: asset.endOfLifeDate?.split('T')[0],
        disposalDate: asset.disposalDate?.split('T')[0],
        assetLifecycleStatus: asset.assetLifecycleStatus,
        indexType: asset.indexType,
        currentIndex: asset.currentIndex,
        indexAtPurchase: asset.indexAtPurchase,
        lastIndexDate: asset.lastIndexDate?.split('T')[0],
        status: asset.status,
        statusSince: asset.statusSince?.split('T')[0],
        availabilityPercent: asset.availabilityPercent,
        lastOperator: asset.lastOperator,
        lastMaintenanceDate: asset.lastMaintenanceDate?.split('T')[0],
        nextMaintenanceDate: asset.nextMaintenanceDate?.split('T')[0],
        maintenanceBudget: asset.maintenanceBudget,
        notes: asset.notes,
      });
    }
  }, [asset, isEditMode]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateAssetDto) => assetsApi.update(id!, data),
    onSuccess: () => {
      success('Asset updated successfully');
      queryClient.invalidateQueries({ queryKey: ['asset', id] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setSearchParams({});
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to update asset');
    },
  });

  const retireMutation = useMutation({
    mutationFn: () => assetsApi.retire(id!),
    onSuccess: () => {
      success('Asset retired successfully');
      queryClient.invalidateQueries({ queryKey: ['asset', id] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setIsRetireModalOpen(false);
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to retire asset');
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setSearchParams({});
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPERATIONAL':
        return <Badge variant="success">Operational</Badge>;
      case 'MAINTENANCE':
        return <Badge variant="warning">Maintenance</Badge>;
      case 'BROKEN':
        return <Badge variant="danger">Broken</Badge>;
      case 'RETIRED':
        return <Badge variant="default">Retired</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getCriticalityBadge = (criticality: string) => {
    switch (criticality) {
      case 'HIGH':
        return <Badge variant="danger" size="sm">High</Badge>;
      case 'MEDIUM':
        return <Badge variant="warning" size="sm">Medium</Badge>;
      case 'LOW':
        return <Badge variant="default" size="sm">Low</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="Loading...">
        <div className="text-center py-12 text-content-secondary">Loading asset...</div>
      </PageContainer>
    );
  }

  if (error || !asset) {
    return (
      <PageContainer title="Asset Not Found">
        <Card className="p-12 text-center">
          <h3 className="text-lg font-semibold text-content-primary mb-2">Asset not found</h3>
          <p className="text-content-secondary mb-4">The asset you're looking for doesn't exist or has been removed.</p>
          <Button variant="primary" onClick={() => navigate('/assets/registry')}>
            Back to Asset Registry
          </Button>
        </Card>
      </PageContainer>
    );
  }

  const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="py-2">
      <dt className="text-sm text-content-tertiary">{label}</dt>
      <dd className="text-content-primary font-medium">{value || '-'}</dd>
    </div>
  );

  return (
    <PageContainer
      title={isEditMode ? `Edit: ${asset.name}` : asset.name}
      description={`Asset Tag: ${asset.assetTag}`}
      actions={
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => navigate('/assets/registry')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>
          {!isEditMode && canUpdate && asset.status !== 'RETIRED' && (
            <Button
              variant="primary"
              onClick={() => setSearchParams({ action: 'edit' })}
              leftIcon={<Edit className="w-4 h-4" />}
            >
              Edit
            </Button>
          )}
          {isEditMode && (
            <>
              <Button variant="secondary" onClick={handleCancel} leftIcon={<X className="w-4 h-4" />}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                isLoading={updateMutation.isPending}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className="flex items-center gap-3 mb-6">
        {getStatusBadge(asset.status)}
        {getCriticalityBadge(asset.criticality)}
      </div>

      {isEditMode ? (
        <div className="space-y-6">
          {/* ASSET IDENTITY */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-content-primary mb-4 pb-2 border-b border-border-default">ASSET IDENTITY</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Asset Name" value={formData.assetName || ''} onChange={(e) => setFormData({ ...formData, assetName: e.target.value })} />
              <Input label="Category" value={formData.category || ''} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
              <Input label="Type" value={formData.type || ''} onChange={(e) => setFormData({ ...formData, type: e.target.value })} />
              <Input label="Family" value={formData.family || ''} disabled />
              <Input label="Manufacturer" value={formData.manufacturer || ''} onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })} />
              <Input label="Model" value={formData.model || ''} onChange={(e) => setFormData({ ...formData, model: e.target.value })} />
              <Input label="Year Model" type="number" value={formData.yearModel || ''} onChange={(e) => setFormData({ ...formData, yearModel: e.target.value ? Number(e.target.value) : undefined })} />
              <Input label="Color" value={formData.color || ''} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
            </div>
          </Card>

          {/* ALLOCATION */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-content-primary mb-4 pb-2 border-b border-border-default">ALLOCATION</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-content-primary mb-1">Company</label>
                <select value={formData.companyId || ''} onChange={(e) => setFormData({ ...formData, companyId: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-border-default bg-background-primary text-content-primary">
                  <option value="">Select company</option>
                  {companiesData?.items.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-content-primary mb-1">Project</label>
                <select value={formData.projectId || ''} onChange={(e) => setFormData({ ...formData, projectId: e.target.value })} className="w-full px-4 py-2 rounded-lg border border-border-default bg-background-primary text-content-primary">
                  <option value="">Select project</option>
                  {projectsData?.items.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <Input label="Company Code" value={formData.companyCode || ''} onChange={(e) => setFormData({ ...formData, companyCode: e.target.value })} />
              <Input label="Current Location" value={formData.currentLocation || ''} onChange={(e) => setFormData({ ...formData, currentLocation: e.target.value })} />
            </div>
          </Card>

          {/* STATUS */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-content-primary mb-4 pb-2 border-b border-border-default">STATUS</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-content-primary mb-1">Status</label>
                <select value={formData.status || ''} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="w-full px-4 py-2 rounded-lg border border-border-default bg-background-primary text-content-primary">
                  <option value="OPERATIONAL">Operational</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="BROKEN">Broken</option>
                </select>
              </div>
              <Input label="Current Index" type="number" value={formData.currentIndex || ''} onChange={(e) => setFormData({ ...formData, currentIndex: e.target.value ? Number(e.target.value) : undefined })} />
              <Input label="Last Maintenance Date" type="date" value={formData.lastMaintenanceDate || ''} onChange={(e) => setFormData({ ...formData, lastMaintenanceDate: e.target.value })} />
              <Input label="Next Maintenance Date" type="date" value={formData.nextMaintenanceDate || ''} onChange={(e) => setFormData({ ...formData, nextMaintenanceDate: e.target.value })} />
            </div>
          </Card>

          {/* Retire Asset */}
          {canDelete && asset.status !== 'RETIRED' && (
            <Card className="p-6 border-red-500">
              <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
              <p className="text-content-secondary mb-4">Retiring an asset is irreversible. The asset will be marked as retired and cannot be edited.</p>
              <Button variant="danger" onClick={() => setIsRetireModalOpen(true)} leftIcon={<AlertTriangle className="w-4 h-4" />}>
                Retire Asset
              </Button>
            </Card>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* ASSET IDENTITY */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-content-primary mb-4 pb-2 border-b border-border-default">ASSET IDENTITY</h3>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <DetailRow label="Asset Name" value={asset.name} />
              <DetailRow label="Category" value={asset.category} />
              <DetailRow label="Type" value={asset.type} />
              <DetailRow label="Family" value={asset.family} />
              <DetailRow label="Manufacturer" value={asset.manufacturer} />
              <DetailRow label="Model" value={asset.model} />
              <DetailRow label="Year Model" value={asset.yearModel} />
              <DetailRow label="Color" value={asset.color} />
            </dl>
          </Card>

          {/* ALLOCATION */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-content-primary mb-4 pb-2 border-b border-border-default">ALLOCATION</h3>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <DetailRow label="Company" value={asset.company?.name} />
              <DetailRow label="Project" value={asset.project?.name} />
              <DetailRow label="Company Code" value={asset.companyCode} />
              <DetailRow label="Country of Registration" value={asset.countryOfRegistration} />
              <DetailRow label="Current Location" value={asset.currentLocation} />
              <DetailRow label="Parent Asset" value={asset.parentAsset ? `${asset.parentAsset.assetTag} - ${asset.parentAsset.name}` : null} />
            </dl>
          </Card>

          {/* IDENTIFICATION */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-content-primary mb-4 pb-2 border-b border-border-default">IDENTIFICATION</h3>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <DetailRow label="Serial Number" value={asset.serialNumber} />
              <DetailRow label="Registration Number" value={asset.registrationNumber} />
              <DetailRow label="Chassis Number" value={asset.chassisNumber} />
              <DetailRow label="Engine Number" value={asset.engineNumber} />
            </dl>
          </Card>

          {/* FINANCIAL INFORMATION */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-content-primary mb-4 pb-2 border-b border-border-default">FINANCIAL INFORMATION</h3>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <DetailRow label="Purchase Date" value={asset.purchaseDate?.split('T')[0]} />
              <DetailRow label="Purchase Value" value={asset.purchaseValue ? `${asset.currency} ${Number(asset.purchaseValue).toLocaleString()}` : null} />
              <DetailRow label="Brand New Value" value={asset.brandNewValue ? `${asset.currency} ${Number(asset.brandNewValue).toLocaleString()}` : null} />
              <DetailRow label="Current Market Value" value={asset.currentMarketValue ? `${asset.currency} ${Number(asset.currentMarketValue).toLocaleString()}` : null} />
              <DetailRow label="Residual Value" value={asset.residualValue ? `${asset.currency} ${Number(asset.residualValue).toLocaleString()}` : null} />
              <DetailRow label="Purchase Order" value={asset.purchaseOrder} />
              <DetailRow label="GL Account" value={asset.glAccount} />
            </dl>
          </Card>

          {/* LIFECYCLE & INDEX */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-content-primary mb-4 pb-2 border-b border-border-default">LIFECYCLE & INDEX</h3>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <DetailRow label="Install Date" value={asset.installDate?.split('T')[0]} />
              <DetailRow label="End of Life Date" value={asset.endOfLifeDate?.split('T')[0]} />
              <DetailRow label="Lifecycle Status" value={asset.assetLifecycleStatus} />
              <DetailRow label="Index Type" value={asset.indexType} />
              <DetailRow label="Current Index" value={asset.currentIndex} />
              <DetailRow label="Index at Purchase" value={asset.indexAtPurchase} />
              <DetailRow label="Last Index Date" value={asset.lastIndexDate?.split('T')[0]} />
            </dl>
          </Card>

          {/* MAINTENANCE */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-content-primary mb-4 pb-2 border-b border-border-default">MAINTENANCE</h3>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <DetailRow label="Last Maintenance" value={asset.lastMaintenanceDate?.split('T')[0]} />
              <DetailRow label="Next Maintenance" value={asset.nextMaintenanceDate?.split('T')[0]} />
              <DetailRow label="Maintenance Budget" value={asset.maintenanceBudget ? `${asset.currency} ${Number(asset.maintenanceBudget).toLocaleString()}` : null} />
              <DetailRow label="Work Orders" value={asset._count?.workOrders || 0} />
              <DetailRow label="Schedules" value={asset._count?.maintenanceSchedules || 0} />
            </dl>
          </Card>

          {/* Notes */}
          {asset.notes && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-content-primary mb-4 pb-2 border-b border-border-default">NOTES</h3>
              <p className="text-content-secondary whitespace-pre-wrap">{asset.notes}</p>
            </Card>
          )}
        </div>
      )}

      {/* Retire Confirmation Modal */}
      <Modal isOpen={isRetireModalOpen} onClose={() => setIsRetireModalOpen(false)} title="Retire Asset" size="sm">
        <p className="text-content-secondary mb-4">
          Are you sure you want to retire <strong>{asset.name}</strong>? This action cannot be undone.
        </p>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setIsRetireModalOpen(false)}>Cancel</Button>
          <Button variant="danger" onClick={() => retireMutation.mutate()} isLoading={retireMutation.isPending}>Retire Asset</Button>
        </ModalFooter>
      </Modal>
    </PageContainer>
  );
}
