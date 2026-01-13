import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, CheckCircle2, XCircle, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Badge } from '@components/ui/Badge';
import { Modal, ModalFooter } from '@components/ui/Modal';
import { crusherOutputEntriesApi, type CrusherOutputEntry, type Shift, type EntryStatus, type QualityGrade } from '@services/quarry-production/entries';
import { crushersApi } from '@services/quarry-production/equipment';
import { productTypesApi, stockpileLocationsApi } from '@services/quarry-production/settings';
import { crusherFeedEntriesApi } from '@services/quarry-production/entries';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@contexts/ToastContext';

export function CrusherOutputEntriesPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [shiftFilter, setShiftFilter] = useState<Shift | ''>('');
  const [statusFilter, setStatusFilter] = useState<EntryStatus | ''>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    shift: 'DAY' as Shift,
    crusherId: '',
    productTypeId: '',
    stockpileLocationId: '',
    outputTonnage: 0,
    qualityGrade: 'STANDARD' as QualityGrade,
    moisturePercentage: undefined as number | undefined,
    notes: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['crusher-output-entries', dateFrom, dateTo, shiftFilter, statusFilter],
    queryFn: () => crusherOutputEntriesApi.list({
      page: 1,
      limit: 50,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      shift: shiftFilter || undefined,
      status: statusFilter || undefined,
    }),
  });

  const { data: crushersData } = useQuery({
    queryKey: ['crushers', 'active'],
    queryFn: () => crushersApi.list({ page: 1, limit: 100, status: 'ACTIVE' }),
  });

  const { data: productTypesData } = useQuery({
    queryKey: ['product-types', 'active'],
    queryFn: () => productTypesApi.list({ page: 1, limit: 100, isActive: true }),
  });

  const { data: stockpileLocationsData } = useQuery({
    queryKey: ['stockpile-locations', 'active'],
    queryFn: () => stockpileLocationsApi.list({ page: 1, limit: 100, isActive: true }),
  });

  // Get feed entries for yield calculation
  const { data: feedEntriesData } = useQuery({
    queryKey: ['crusher-feed-entries', formData.date, formData.shift, formData.crusherId],
    queryFn: () => crusherFeedEntriesApi.list({
      page: 1,
      limit: 10,
      dateFrom: formData.date,
      dateTo: formData.date,
      shift: formData.shift,
      status: 'APPROVED',
    }),
    enabled: !!formData.date && !!formData.shift && !!formData.crusherId,
  });

  const canCreate = hasPermission('quarry:crusher-output:create');
  const canUpdate = hasPermission('quarry:crusher-output:update');
  const canDelete = hasPermission('quarry:crusher-output:delete');
  const canApprove = hasPermission('quarry:crusher-output:approve');

  const createMutation = useMutation({
    mutationFn: (data: any) => crusherOutputEntriesApi.create(data),
    onSuccess: () => {
      success('Crusher output entry created successfully');
      queryClient.invalidateQueries({ queryKey: ['crusher-output-entries'] });
      setIsCreateModalOpen(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        shift: 'DAY',
        crusherId: '',
        productTypeId: '',
        stockpileLocationId: '',
        outputTonnage: 0,
        qualityGrade: 'STANDARD',
        moisturePercentage: undefined,
        notes: '',
      });
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to create entry'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => crusherOutputEntriesApi.update(id, data),
    onSuccess: () => {
      success('Entry updated successfully');
      queryClient.invalidateQueries({ queryKey: ['crusher-output-entries'] });
      setEditingId(null);
      setIsCreateModalOpen(false);
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to update entry'),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => crusherOutputEntriesApi.approve(id),
    onSuccess: () => {
      success('Entry approved successfully');
      queryClient.invalidateQueries({ queryKey: ['crusher-output-entries'] });
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to approve entry'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => crusherOutputEntriesApi.reject(id, reason),
    onSuccess: () => {
      success('Entry rejected');
      queryClient.invalidateQueries({ queryKey: ['crusher-output-entries'] });
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to reject entry'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => crusherOutputEntriesApi.delete(id),
    onSuccess: () => {
      success('Entry deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['crusher-output-entries'] });
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to delete entry'),
  });

  const handleEdit = (entry: CrusherOutputEntry) => {
    if (entry.status !== 'PENDING' && entry.status !== 'REJECTED') {
      showError('Can only edit PENDING or REJECTED entries');
      return;
    }
    setEditingId(entry.id);
    setFormData({
      date: entry.date,
      shift: entry.shift,
      crusherId: entry.crusherId,
      productTypeId: entry.productTypeId,
      stockpileLocationId: entry.stockpileLocationId,
      outputTonnage: entry.outputTonnage,
      qualityGrade: entry.qualityGrade,
      moisturePercentage: entry.moisturePercentage,
      notes: entry.notes || '',
    });
    setIsCreateModalOpen(true);
  };

  const handleSubmit = () => {
    const submitData = {
      ...formData,
      moisturePercentage: formData.moisturePercentage || undefined,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleApprove = (id: string) => {
    if (confirm('Approve this entry?')) {
      approveMutation.mutate(id);
    }
  };

  const handleReject = (id: string) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      rejectMutation.mutate({ id, reason });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      deleteMutation.mutate(id);
    }
  };

  const statusColors: Record<EntryStatus, 'default' | 'success' | 'warning' | 'error'> = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'error',
  };

  // Calculate yield percentage if feed data is available
  const totalFeedTonnage = feedEntriesData?.data.data.items.reduce((sum, entry) => sum + entry.weighBridgeTonnage, 0) || 0;
  const yieldPercentage = totalFeedTonnage > 0 && formData.outputTonnage > 0
    ? (formData.outputTonnage / totalFeedTonnage) * 100
    : 0;

  return (
    <PageContainer
      title="Crusher Output Entries"
      description="Track finished products from crushers"
      actions={
        canCreate ? (
          <Button
            variant="primary"
            onClick={() => {
              setEditingId(null);
              setFormData({
                date: new Date().toISOString().split('T')[0],
                shift: 'DAY',
                crusherId: '',
                productTypeId: '',
                stockpileLocationId: '',
                outputTonnage: 0,
                qualityGrade: 'STANDARD',
                moisturePercentage: undefined,
                notes: '',
              });
              setIsCreateModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Entry
          </Button>
        ) : undefined
      }
    >
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            type="date"
            label="From Date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <Input
            type="date"
            label="To Date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-2">Shift</label>
            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value as Shift | '')}
              className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-tertiary text-content-primary"
            >
              <option value="">All Shifts</option>
              <option value="DAY">Day</option>
              <option value="NIGHT">Night</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as EntryStatus | '')}
              className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-tertiary text-content-primary"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <div className="p-8 text-center text-content-secondary">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="text-left p-4 text-sm font-medium text-content-secondary">Date</th>
                  <th className="text-left p-4 text-sm font-medium text-content-secondary">Shift</th>
                  <th className="text-left p-4 text-sm font-medium text-content-secondary">Crusher</th>
                  <th className="text-left p-4 text-sm font-medium text-content-secondary">Product</th>
                  <th className="text-right p-4 text-sm font-medium text-content-secondary">Output</th>
                  <th className="text-right p-4 text-sm font-medium text-content-secondary">Yield %</th>
                  <th className="text-left p-4 text-sm font-medium text-content-secondary">Status</th>
                  <th className="text-right p-4 text-sm font-medium text-content-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.data.items.map((entry) => (
                  <tr key={entry.id} className="border-b border-border-default hover:bg-bg-hover">
                    <td className="p-4 text-content-primary">{new Date(entry.date).toLocaleDateString()}</td>
                    <td className="p-4 text-content-secondary">{entry.shift}</td>
                    <td className="p-4 text-content-primary">{entry.crusher?.name || 'N/A'}</td>
                    <td className="p-4 text-content-primary">{entry.productType?.name || 'N/A'}</td>
                    <td className="p-4 text-right text-content-primary font-medium">
                      {entry.outputTonnage.toFixed(2)} t
                    </td>
                    <td className="p-4 text-right text-content-secondary">
                      {entry.yieldPercentage ? `${entry.yieldPercentage.toFixed(2)}%` : 'N/A'}
                    </td>
                    <td className="p-4">
                      <Badge variant={statusColors[entry.status]}>{entry.status}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/quarry-production/crusher-output/${entry.id}`)}
                          leftIcon={<Eye className="w-4 h-4" />}
                        >
                          View
                        </Button>
                        {canUpdate && (entry.status === 'PENDING' || entry.status === 'REJECTED') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(entry)}
                            leftIcon={<Edit className="w-4 h-4" />}
                          >
                            Edit
                          </Button>
                        )}
                        {canApprove && entry.status === 'PENDING' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(entry.id)}
                              leftIcon={<CheckCircle2 className="w-4 h-4" />}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReject(entry.id)}
                              leftIcon={<XCircle className="w-4 h-4" />}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {canDelete && entry.status === 'PENDING' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(entry.id)}
                            leftIcon={<Trash2 className="w-4 h-4" />}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data?.data.data.items.length === 0 && (
              <div className="p-8 text-center text-content-secondary">No entries found</div>
            )}
          </div>
        )}
      </Card>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingId(null);
        }}
        title={editingId ? 'Edit Crusher Output Entry' : 'Create Crusher Output Entry'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-2">Shift</label>
              <select
                value={formData.shift}
                onChange={(e) => setFormData({ ...formData, shift: e.target.value as Shift })}
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-tertiary text-content-primary"
              >
                <option value="DAY">Day</option>
                <option value="NIGHT">Night</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-2">Crusher *</label>
            <select
              value={formData.crusherId}
              onChange={(e) => setFormData({ ...formData, crusherId: e.target.value })}
              className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-tertiary text-content-primary"
              required
            >
              <option value="">Select crusher</option>
              {crushersData?.data.data.items.map((crusher) => (
                <option key={crusher.id} value={crusher.id}>
                  {crusher.name} ({crusher.type.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-2">Product Type *</label>
            <select
              value={formData.productTypeId}
              onChange={(e) => setFormData({ ...formData, productTypeId: e.target.value })}
              className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-tertiary text-content-primary"
              required
            >
              <option value="">Select product type</option>
              {productTypesData?.data.data.items.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-2">Stockpile Location *</label>
            <select
              value={formData.stockpileLocationId}
              onChange={(e) => setFormData({ ...formData, stockpileLocationId: e.target.value })}
              className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-tertiary text-content-primary"
              required
            >
              <option value="">Select stockpile location</option>
              {stockpileLocationsData?.data.data.items.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Output Tonnage"
            type="number"
            step="0.01"
            value={formData.outputTonnage}
            onChange={(e) => setFormData({ ...formData, outputTonnage: parseFloat(e.target.value) || 0 })}
            required
          />
          {yieldPercentage > 0 && (
            <div className="bg-bg-elevated p-3 rounded-lg">
              <div className="text-sm text-content-secondary mb-1">Auto-calculated:</div>
              <div className="text-sm text-content-primary">
                Yield Percentage: <strong>{yieldPercentage.toFixed(2)}%</strong>
              </div>
              <div className="text-xs text-content-tertiary mt-1">
                Based on feed: {totalFeedTonnage.toFixed(2)}t
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-2">Quality Grade</label>
            <select
              value={formData.qualityGrade}
              onChange={(e) => setFormData({ ...formData, qualityGrade: e.target.value as QualityGrade })}
              className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-tertiary text-content-primary"
            >
              <option value="PREMIUM">Premium</option>
              <option value="STANDARD">Standard</option>
              <option value="OFF_SPEC">Off-Spec</option>
            </select>
          </div>
          <Input
            label="Moisture Percentage (optional)"
            type="number"
            step="0.1"
            value={formData.moisturePercentage || ''}
            onChange={(e) => setFormData({ ...formData, moisturePercentage: e.target.value ? parseFloat(e.target.value) : undefined })}
          />
          <Input
            label="Notes (optional)"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes"
          />
        </div>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setIsCreateModalOpen(false);
              setEditingId(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={createMutation.isPending || updateMutation.isPending}
          >
            {editingId ? 'Update' : 'Create'}
          </Button>
        </ModalFooter>
      </Modal>
    </PageContainer>
  );
}
