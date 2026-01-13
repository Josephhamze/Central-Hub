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
import { haulingEntriesApi, type HaulingEntry, type Shift, type EntryStatus } from '@services/quarry-production/entries';
import { trucksApi } from '@services/quarry-production/equipment';
import { excavatorEntriesApi } from '@services/quarry-production/entries';
import { usersApi } from '@services/system/users';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@contexts/ToastContext';

export function HaulingEntriesPage() {
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
    truckId: '',
    driverId: '',
    excavatorEntryId: '',
    tripCount: 0,
    avgCycleTime: undefined as number | undefined,
    fuelConsumption: undefined as number | undefined,
    notes: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['hauling-entries', dateFrom, dateTo, shiftFilter, statusFilter],
    queryFn: () => haulingEntriesApi.list({
      page: 1,
      limit: 50,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      shift: shiftFilter || undefined,
      status: statusFilter || undefined,
    }),
  });

  const { data: trucksData } = useQuery({
    queryKey: ['trucks', 'active'],
    queryFn: () => trucksApi.list({ page: 1, limit: 100, status: 'ACTIVE' }),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.findAll(1, 100),
  });

  const { data: excavatorEntriesData } = useQuery({
    queryKey: ['excavator-entries', 'recent'],
    queryFn: () => excavatorEntriesApi.list({ page: 1, limit: 100, status: 'APPROVED' }),
  });

  const canCreate = hasPermission('quarry:hauling-entries:create');
  const canUpdate = hasPermission('quarry:hauling-entries:update');
  const canDelete = hasPermission('quarry:hauling-entries:delete');
  const canApprove = hasPermission('quarry:hauling-entries:approve');

  const createMutation = useMutation({
    mutationFn: (data: any) => haulingEntriesApi.create(data),
    onSuccess: () => {
      success('Hauling entry created successfully');
      queryClient.invalidateQueries({ queryKey: ['hauling-entries'] });
      setIsCreateModalOpen(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        shift: 'DAY',
        truckId: '',
        driverId: '',
        excavatorEntryId: '',
        tripCount: 0,
        avgCycleTime: undefined,
        fuelConsumption: undefined,
        notes: '',
      });
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to create entry'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => haulingEntriesApi.update(id, data),
    onSuccess: () => {
      success('Entry updated successfully');
      queryClient.invalidateQueries({ queryKey: ['hauling-entries'] });
      setEditingId(null);
      setIsCreateModalOpen(false);
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to update entry'),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => haulingEntriesApi.approve(id),
    onSuccess: () => {
      success('Entry approved successfully');
      queryClient.invalidateQueries({ queryKey: ['hauling-entries'] });
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to approve entry'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => haulingEntriesApi.reject(id, reason),
    onSuccess: () => {
      success('Entry rejected');
      queryClient.invalidateQueries({ queryKey: ['hauling-entries'] });
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to reject entry'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => haulingEntriesApi.delete(id),
    onSuccess: () => {
      success('Entry deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['hauling-entries'] });
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to delete entry'),
  });

  const handleEdit = (entry: HaulingEntry) => {
    if (entry.status !== 'PENDING' && entry.status !== 'REJECTED') {
      showError('Can only edit PENDING or REJECTED entries');
      return;
    }
    setEditingId(entry.id);
    setFormData({
      date: entry.date,
      shift: entry.shift,
      truckId: entry.truckId,
      driverId: entry.driverId,
      excavatorEntryId: entry.excavatorEntryId || '',
      tripCount: entry.tripCount,
      avgCycleTime: entry.avgCycleTime,
      fuelConsumption: entry.fuelConsumption,
      notes: entry.notes || '',
    });
    setIsCreateModalOpen(true);
  };

  const handleSubmit = () => {
    const submitData = {
      ...formData,
      excavatorEntryId: formData.excavatorEntryId || undefined,
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

  const selectedTruck = trucksData?.data.data.items.find(t => t.id === formData.truckId);
  const estimatedTotalHauled = selectedTruck && formData.tripCount > 0
    ? formData.tripCount * selectedTruck.loadCapacity
    : 0;

  return (
    <PageContainer
      title="Hauling Entries"
      description="Track material transportation from pit to crusher"
      actions={
        canCreate ? (
          <Button
            variant="primary"
            onClick={() => {
              setEditingId(null);
              setFormData({
                date: new Date().toISOString().split('T')[0],
                shift: 'DAY',
                truckId: '',
                driverId: '',
                excavatorEntryId: '',
                tripCount: 0,
                avgCycleTime: undefined,
                fuelConsumption: undefined,
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
                  <th className="text-left p-4 text-sm font-medium text-content-secondary">Truck</th>
                  <th className="text-left p-4 text-sm font-medium text-content-secondary">Driver</th>
                  <th className="text-left p-4 text-sm font-medium text-content-secondary">Trips</th>
                  <th className="text-right p-4 text-sm font-medium text-content-secondary">Total Hauled</th>
                  <th className="text-left p-4 text-sm font-medium text-content-secondary">Status</th>
                  <th className="text-right p-4 text-sm font-medium text-content-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.data.items.map((entry) => (
                  <tr key={entry.id} className="border-b border-border-default hover:bg-bg-hover">
                    <td className="p-4 text-content-primary">{new Date(entry.date).toLocaleDateString()}</td>
                    <td className="p-4 text-content-secondary">{entry.shift}</td>
                    <td className="p-4 text-content-primary">{entry.truck?.name || 'N/A'}</td>
                    <td className="p-4 text-content-primary">
                      {entry.driver ? `${entry.driver.firstName} ${entry.driver.lastName}` : 'N/A'}
                    </td>
                    <td className="p-4 text-content-primary">{entry.tripCount}</td>
                    <td className="p-4 text-right text-content-primary font-medium">
                      {entry.totalHauled.toFixed(2)} t
                    </td>
                    <td className="p-4">
                      <Badge variant={statusColors[entry.status]}>{entry.status}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/quarry-production/hauling-entries/${entry.id}`)}
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
        title={editingId ? 'Edit Hauling Entry' : 'Create Hauling Entry'}
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
            <label className="block text-sm font-medium text-content-secondary mb-2">Truck *</label>
            <select
              value={formData.truckId}
              onChange={(e) => setFormData({ ...formData, truckId: e.target.value })}
              className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-tertiary text-content-primary"
              required
            >
              <option value="">Select truck</option>
              {trucksData?.data.data.items.map((truck) => (
                <option key={truck.id} value={truck.id}>
                  {truck.name} ({truck.loadCapacity} t)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-2">Driver *</label>
            <select
              value={formData.driverId}
              onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
              className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-tertiary text-content-primary"
              required
            >
              <option value="">Select driver</option>
              {usersData?.items?.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-2">Source Excavator Entry (optional)</label>
            <select
              value={formData.excavatorEntryId}
              onChange={(e) => setFormData({ ...formData, excavatorEntryId: e.target.value })}
              className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-tertiary text-content-primary"
            >
              <option value="">None</option>
              {excavatorEntriesData?.data.data.items.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {new Date(entry.date).toLocaleDateString()} - {entry.shift} - {entry.estimatedTonnage.toFixed(2)}t
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Trip Count"
            type="number"
            value={formData.tripCount}
            onChange={(e) => setFormData({ ...formData, tripCount: parseInt(e.target.value) || 0 })}
            required
          />
          {estimatedTotalHauled > 0 && (
            <div className="bg-bg-elevated p-3 rounded-lg">
              <div className="text-sm text-content-secondary mb-1">Auto-calculated:</div>
              <div className="text-sm text-content-primary">
                Total Hauled: <strong>{estimatedTotalHauled.toFixed(2)} tonnes</strong>
              </div>
            </div>
          )}
          <Input
            label="Average Cycle Time (minutes, optional)"
            type="number"
            step="0.1"
            value={formData.avgCycleTime || ''}
            onChange={(e) => setFormData({ ...formData, avgCycleTime: e.target.value ? parseFloat(e.target.value) : undefined })}
          />
          <Input
            label="Fuel Consumption (liters, optional)"
            type="number"
            step="0.1"
            value={formData.fuelConsumption || ''}
            onChange={(e) => setFormData({ ...formData, fuelConsumption: e.target.value ? parseFloat(e.target.value) : undefined })}
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
