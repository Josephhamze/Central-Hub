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
import { crusherFeedEntriesApi, type CrusherFeedEntry, type Shift, type EntryStatus } from '@services/quarry-production/entries';
import { crushersApi } from '@services/quarry-production/equipment';
import { materialTypesApi } from '@services/quarry-production/settings';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@contexts/ToastContext';

export function CrusherFeedEntriesPage() {
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
    materialTypeId: '',
    feedStartTime: '',
    feedEndTime: '',
    truckLoadsReceived: 0,
    weighBridgeTonnage: 0,
    rejectOversizeTonnage: undefined as number | undefined,
    notes: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['crusher-feed-entries', dateFrom, dateTo, shiftFilter, statusFilter],
    queryFn: () => crusherFeedEntriesApi.list({
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

  const { data: materialTypesData } = useQuery({
    queryKey: ['material-types', 'active'],
    queryFn: () => materialTypesApi.list({ page: 1, limit: 100, isActive: true }),
  });

  const canCreate = hasPermission('quarry:crusher-feed:create');
  const canUpdate = hasPermission('quarry:crusher-feed:update');
  const canDelete = hasPermission('quarry:crusher-feed:delete');
  const canApprove = hasPermission('quarry:crusher-feed:approve');

  const createMutation = useMutation({
    mutationFn: (data: any) => crusherFeedEntriesApi.create(data),
    onSuccess: () => {
      success('Crusher feed entry created successfully');
      queryClient.invalidateQueries({ queryKey: ['crusher-feed-entries'] });
      setIsCreateModalOpen(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        shift: 'DAY',
        crusherId: '',
        materialTypeId: '',
        feedStartTime: '',
        feedEndTime: '',
        truckLoadsReceived: 0,
        weighBridgeTonnage: 0,
        rejectOversizeTonnage: undefined,
        notes: '',
      });
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to create entry'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => crusherFeedEntriesApi.update(id, data),
    onSuccess: () => {
      success('Entry updated successfully');
      queryClient.invalidateQueries({ queryKey: ['crusher-feed-entries'] });
      setEditingId(null);
      setIsCreateModalOpen(false);
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to update entry'),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => crusherFeedEntriesApi.approve(id),
    onSuccess: () => {
      success('Entry approved successfully');
      queryClient.invalidateQueries({ queryKey: ['crusher-feed-entries'] });
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to approve entry'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => crusherFeedEntriesApi.reject(id, reason),
    onSuccess: () => {
      success('Entry rejected');
      queryClient.invalidateQueries({ queryKey: ['crusher-feed-entries'] });
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to reject entry'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => crusherFeedEntriesApi.delete(id),
    onSuccess: () => {
      success('Entry deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['crusher-feed-entries'] });
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to delete entry'),
  });

  const handleEdit = (entry: CrusherFeedEntry) => {
    if (entry.status !== 'PENDING' && entry.status !== 'REJECTED') {
      showError('Can only edit PENDING or REJECTED entries');
      return;
    }
    setEditingId(entry.id);
    setFormData({
      date: entry.date,
      shift: entry.shift,
      crusherId: entry.crusherId,
      materialTypeId: entry.materialTypeId,
      feedStartTime: new Date(entry.feedStartTime).toISOString().slice(0, 16),
      feedEndTime: new Date(entry.feedEndTime).toISOString().slice(0, 16),
      truckLoadsReceived: entry.truckLoadsReceived,
      weighBridgeTonnage: entry.weighBridgeTonnage,
      rejectOversizeTonnage: entry.rejectOversizeTonnage,
      notes: entry.notes || '',
    });
    setIsCreateModalOpen(true);
  };

  const handleSubmit = () => {
    const submitData = {
      ...formData,
      feedStartTime: new Date(formData.feedStartTime).toISOString(),
      feedEndTime: new Date(formData.feedEndTime).toISOString(),
      rejectOversizeTonnage: formData.rejectOversizeTonnage || undefined,
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

  // Calculate feed rate if times are provided
  const startTime = formData.feedStartTime ? new Date(formData.feedStartTime) : null;
  const endTime = formData.feedEndTime ? new Date(formData.feedEndTime) : null;
  const feedDurationHours = startTime && endTime && endTime > startTime
    ? (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
    : 0;
  const feedRate = feedDurationHours > 0 && formData.weighBridgeTonnage > 0
    ? formData.weighBridgeTonnage / feedDurationHours
    : 0;

  return (
    <PageContainer
      title="Crusher Feed Entries"
      description="Track material fed into crushers"
      actions={
        canCreate ? (
          <Button
            variant="primary"
            onClick={() => {
              setEditingId(null);
              const now = new Date();
              const start = new Date(now);
              start.setHours(8, 0, 0, 0);
              const end = new Date(now);
              end.setHours(17, 0, 0, 0);
              setFormData({
                date: new Date().toISOString().split('T')[0],
                shift: 'DAY',
                crusherId: '',
                materialTypeId: '',
                feedStartTime: start.toISOString().slice(0, 16),
                feedEndTime: end.toISOString().slice(0, 16),
                truckLoadsReceived: 0,
                weighBridgeTonnage: 0,
                rejectOversizeTonnage: undefined,
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
                  <th className="text-left p-4 text-sm font-medium text-content-secondary">Material</th>
                  <th className="text-right p-4 text-sm font-medium text-content-secondary">Tonnage</th>
                  <th className="text-right p-4 text-sm font-medium text-content-secondary">Feed Rate</th>
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
                    <td className="p-4 text-content-primary">{entry.materialType?.name || 'N/A'}</td>
                    <td className="p-4 text-right text-content-primary font-medium">
                      {entry.weighBridgeTonnage.toFixed(2)} t
                    </td>
                    <td className="p-4 text-right text-content-secondary">
                      {entry.feedRate ? `${entry.feedRate.toFixed(2)} t/h` : 'N/A'}
                    </td>
                    <td className="p-4">
                      <Badge variant={statusColors[entry.status]}>{entry.status}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/quarry-production/crusher-feed/${entry.id}`)}
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
        title={editingId ? 'Edit Crusher Feed Entry' : 'Create Crusher Feed Entry'}
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
                  {material.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Feed Start Time"
              type="datetime-local"
              value={formData.feedStartTime}
              onChange={(e) => setFormData({ ...formData, feedStartTime: e.target.value })}
              required
            />
            <Input
              label="Feed End Time"
              type="datetime-local"
              value={formData.feedEndTime}
              onChange={(e) => setFormData({ ...formData, feedEndTime: e.target.value })}
              required
            />
          </div>
          <Input
            label="Truck Loads Received"
            type="number"
            value={formData.truckLoadsReceived}
            onChange={(e) => setFormData({ ...formData, truckLoadsReceived: parseInt(e.target.value) || 0 })}
            required
          />
          <Input
            label="Weigh Bridge Tonnage (source of truth)"
            type="number"
            step="0.01"
            value={formData.weighBridgeTonnage}
            onChange={(e) => setFormData({ ...formData, weighBridgeTonnage: parseFloat(e.target.value) || 0 })}
            required
          />
          {feedRate > 0 && (
            <div className="bg-bg-elevated p-3 rounded-lg">
              <div className="text-sm text-content-secondary mb-1">Auto-calculated:</div>
              <div className="text-sm text-content-primary">
                Feed Rate: <strong>{feedRate.toFixed(2)} tonnes/hour</strong>
              </div>
            </div>
          )}
          <Input
            label="Reject/Oversize Tonnage (optional)"
            type="number"
            step="0.01"
            value={formData.rejectOversizeTonnage || ''}
            onChange={(e) => setFormData({ ...formData, rejectOversizeTonnage: e.target.value ? parseFloat(e.target.value) : undefined })}
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
