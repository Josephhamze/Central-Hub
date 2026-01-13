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
import { excavatorEntriesApi, type ExcavatorEntry, type Shift, type EntryStatus } from '@services/quarry-production/entries';
import { excavatorsApi } from '@services/quarry-production/equipment';
import { materialTypesApi } from '@services/quarry-production/settings';
import { pitLocationsApi } from '@services/quarry-production/settings';
import { usersApi } from '@services/system/users';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@contexts/ToastContext';

export function ExcavatorEntriesPage() {
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
    excavatorId: '',
    operatorId: '',
    materialTypeId: '',
    pitLocationId: '',
    bucketCount: 0,
    downtimeHours: undefined as number | undefined,
    notes: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['excavator-entries', dateFrom, dateTo, shiftFilter, statusFilter],
    queryFn: () => excavatorEntriesApi.list({
      page: 1,
      limit: 50,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      shift: shiftFilter || undefined,
      status: statusFilter || undefined,
    }),
  });

  // Fetch dropdown data
  const { data: excavatorsData } = useQuery({
    queryKey: ['excavators', 'active'],
    queryFn: () => excavatorsApi.list({ page: 1, limit: 100, status: 'ACTIVE' }),
  });

  const { data: materialTypesData } = useQuery({
    queryKey: ['material-types', 'active'],
    queryFn: () => materialTypesApi.list({ page: 1, limit: 100, isActive: true }),
  });

  const { data: pitLocationsData } = useQuery({
    queryKey: ['pit-locations', 'active'],
    queryFn: () => pitLocationsApi.list({ page: 1, limit: 100, isActive: true }),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.findAll(1, 100),
  });

  const canCreate = hasPermission('quarry:excavator-entries:create');
  const canUpdate = hasPermission('quarry:excavator-entries:update');
  const canDelete = hasPermission('quarry:excavator-entries:delete');
  const canApprove = hasPermission('quarry:excavator-entries:approve');

  const createMutation = useMutation({
    mutationFn: (data: any) => excavatorEntriesApi.create(data),
    onSuccess: () => {
      success('Excavator entry created successfully');
      queryClient.invalidateQueries({ queryKey: ['excavator-entries'] });
      setIsCreateModalOpen(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        shift: 'DAY',
        excavatorId: '',
        operatorId: '',
        materialTypeId: '',
        pitLocationId: '',
        bucketCount: 0,
        downtimeHours: undefined,
        notes: '',
      });
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to create entry'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => excavatorEntriesApi.update(id, data),
    onSuccess: () => {
      success('Entry updated successfully');
      queryClient.invalidateQueries({ queryKey: ['excavator-entries'] });
      setEditingId(null);
      setIsCreateModalOpen(false);
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to update entry'),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => excavatorEntriesApi.approve(id),
    onSuccess: () => {
      success('Entry approved successfully');
      queryClient.invalidateQueries({ queryKey: ['excavator-entries'] });
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to approve entry'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => excavatorEntriesApi.reject(id, reason),
    onSuccess: () => {
      success('Entry rejected');
      queryClient.invalidateQueries({ queryKey: ['excavator-entries'] });
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to reject entry'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => excavatorEntriesApi.delete(id),
    onSuccess: () => {
      success('Entry deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['excavator-entries'] });
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to delete entry'),
  });

  const handleEdit = (entry: ExcavatorEntry) => {
    if (entry.status !== 'PENDING' && entry.status !== 'REJECTED') {
      showError('Can only edit PENDING or REJECTED entries');
      return;
    }
    setEditingId(entry.id);
    setFormData({
      date: entry.date,
      shift: entry.shift,
      excavatorId: entry.excavatorId,
      operatorId: entry.operatorId,
      materialTypeId: entry.materialTypeId,
      pitLocationId: entry.pitLocationId,
      bucketCount: entry.bucketCount,
      downtimeHours: entry.downtimeHours,
      notes: entry.notes || '',
    });
    setIsCreateModalOpen(true);
  };

  const handleSubmit = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
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

  // Calculate auto-calculated values for display
  const selectedExcavator = excavatorsData?.data.data.items.find(e => e.id === formData.excavatorId);
  const selectedMaterial = materialTypesData?.data.data.items.find(m => m.id === formData.materialTypeId);
  const estimatedVolume = selectedExcavator && formData.bucketCount > 0
    ? formData.bucketCount * selectedExcavator.bucketCapacity
    : 0;
  const estimatedTonnage = selectedMaterial && estimatedVolume > 0
    ? estimatedVolume * selectedMaterial.density
    : 0;

  return (
    <PageContainer
      title="Excavator Entries"
      description="Track material extraction from pits"
      actions={
        canCreate ? (
          <Button
            variant="primary"
            onClick={() => {
              setEditingId(null);
              setFormData({
                date: new Date().toISOString().split('T')[0],
                shift: 'DAY',
                excavatorId: '',
                operatorId: '',
                materialTypeId: '',
                pitLocationId: '',
                bucketCount: 0,
                downtimeHours: undefined,
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
      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

      {/* Table */}
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
                  <th className="text-left p-4 text-sm font-medium text-content-secondary">Excavator</th>
                  <th className="text-left p-4 text-sm font-medium text-content-secondary">Operator</th>
                  <th className="text-left p-4 text-sm font-medium text-content-secondary">Material</th>
                  <th className="text-right p-4 text-sm font-medium text-content-secondary">Tonnage</th>
                  <th className="text-left p-4 text-sm font-medium text-content-secondary">Status</th>
                  <th className="text-right p-4 text-sm font-medium text-content-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.data.items.map((entry) => (
                  <tr key={entry.id} className="border-b border-border-default hover:bg-bg-hover">
                    <td className="p-4 text-content-primary">{new Date(entry.date).toLocaleDateString()}</td>
                    <td className="p-4 text-content-secondary">{entry.shift}</td>
                    <td className="p-4 text-content-primary">{entry.excavator?.name || 'N/A'}</td>
                    <td className="p-4 text-content-primary">
                      {entry.operator ? `${entry.operator.firstName} ${entry.operator.lastName}` : 'N/A'}
                    </td>
                    <td className="p-4 text-content-primary">{entry.materialType?.name || 'N/A'}</td>
                    <td className="p-4 text-right text-content-primary font-medium">
                      {entry.estimatedTonnage.toFixed(2)} t
                    </td>
                    <td className="p-4">
                      <Badge variant={statusColors[entry.status]}>{entry.status}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/quarry-production/excavator-entries/${entry.id}`)}
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingId(null);
        }}
        title={editingId ? 'Edit Excavator Entry' : 'Create Excavator Entry'}
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
            <label className="block text-sm font-medium text-content-secondary mb-2">Excavator *</label>
            <select
              value={formData.excavatorId}
              onChange={(e) => setFormData({ ...formData, excavatorId: e.target.value })}
              className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-tertiary text-content-primary"
              required
            >
              <option value="">Select excavator</option>
              {excavatorsData?.data.data.items.map((excavator) => (
                <option key={excavator.id} value={excavator.id}>
                  {excavator.name} ({excavator.bucketCapacity} m³)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-2">Operator *</label>
            <select
              value={formData.operatorId}
              onChange={(e) => setFormData({ ...formData, operatorId: e.target.value })}
              className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-tertiary text-content-primary"
              required
            >
              <option value="">Select operator</option>
              {usersData?.items?.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-2">Material Type *</label>
            <select
              value={formData.materialTypeId}
              onChange={(e) => setFormData({ ...formData, materialTypeId: e.target.value })}
              className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-tertiary text-content-primary"
              required
            >
              <option value="">Select material type</option>
              {materialTypesData?.data.data.items.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.name} ({material.density} t/m³)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-2">Pit Location *</label>
            <select
              value={formData.pitLocationId}
              onChange={(e) => setFormData({ ...formData, pitLocationId: e.target.value })}
              className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-tertiary text-content-primary"
              required
            >
              <option value="">Select pit location</option>
              {pitLocationsData?.data.data.items.map((pit) => (
                <option key={pit.id} value={pit.id}>
                  {pit.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Bucket Count"
            type="number"
            value={formData.bucketCount}
            onChange={(e) => setFormData({ ...formData, bucketCount: parseInt(e.target.value) || 0 })}
            required
          />
          {estimatedVolume > 0 && (
            <div className="bg-bg-elevated p-3 rounded-lg">
              <div className="text-sm text-content-secondary mb-1">Auto-calculated:</div>
              <div className="text-sm text-content-primary">
                Estimated Volume: <strong>{estimatedVolume.toFixed(2)} m³</strong>
              </div>
              <div className="text-sm text-content-primary">
                Estimated Tonnage: <strong>{estimatedTonnage.toFixed(2)} tonnes</strong>
              </div>
            </div>
          )}
          <Input
            label="Downtime Hours (optional)"
            type="number"
            step="0.1"
            value={formData.downtimeHours || ''}
            onChange={(e) => setFormData({ ...formData, downtimeHours: e.target.value ? parseFloat(e.target.value) : undefined })}
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
