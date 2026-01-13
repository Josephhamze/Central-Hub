import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Badge } from '@components/ui/Badge';
import { Modal, ModalFooter } from '@components/ui/Modal';
import { excavatorsApi, type Excavator, type CreateExcavatorDto, type EquipmentStatus } from '@services/quarry-production/equipment';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@contexts/ToastContext';

export function ExcavatorsPage() {
  const { hasPermission } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | ''>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateExcavatorDto>({
    name: '',
    bucketCapacity: 0,
    status: 'ACTIVE',
    notes: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['excavators', search, statusFilter],
    queryFn: () => excavatorsApi.list({ page: 1, limit: 50, search: search || undefined, status: statusFilter || undefined }),
  });

  const canCreate = hasPermission('quarry:equipment:manage');
  const canUpdate = hasPermission('quarry:equipment:manage');
  const canDelete = hasPermission('quarry:equipment:manage');

  const createMutation = useMutation({
    mutationFn: (data: CreateExcavatorDto) => excavatorsApi.create(data),
    onSuccess: () => {
      success('Excavator created successfully');
      queryClient.invalidateQueries({ queryKey: ['excavators'] });
      setIsCreateModalOpen(false);
      setFormData({ name: '', bucketCapacity: 0, status: 'ACTIVE', notes: '' });
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to create excavator'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateExcavatorDto> }) => excavatorsApi.update(id, data),
    onSuccess: () => {
      success('Excavator updated successfully');
      queryClient.invalidateQueries({ queryKey: ['excavators'] });
      setEditingId(null);
      setFormData({ name: '', bucketCapacity: 0, status: 'ACTIVE', notes: '' });
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to update excavator'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => excavatorsApi.delete(id),
    onSuccess: () => {
      success('Excavator deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['excavators'] });
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to delete excavator'),
  });

  const handleEdit = (excavator: Excavator) => {
    setEditingId(excavator.id);
    setFormData({
      name: excavator.name,
      bucketCapacity: excavator.bucketCapacity,
      status: excavator.status,
      notes: excavator.notes || '',
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

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this excavator?')) {
      deleteMutation.mutate(id);
    }
  };

  const statusColors: Record<EquipmentStatus, 'default' | 'success' | 'warning' | 'error'> = {
    ACTIVE: 'success',
    MAINTENANCE: 'warning',
    DECOMMISSIONED: 'error',
  };

  return (
    <PageContainer
      title="Excavators"
      description="Manage excavator equipment"
      actions={
        canCreate ? (
          <Button
            variant="primary"
            onClick={() => {
              setEditingId(null);
              setFormData({ name: '', bucketCapacity: 0, status: 'ACTIVE', notes: '' });
              setIsCreateModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Excavator
          </Button>
        ) : undefined
      }
    >
      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex gap-4">
          <Input
            placeholder="Search excavators..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="flex-1"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EquipmentStatus | '')}
            className="px-3 py-2 border border-border-default rounded-lg bg-bg-tertiary text-content-primary"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="DECOMMISSIONED">Decommissioned</option>
          </select>
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
                  <th className="text-left p-4 text-sm font-medium text-content-secondary">Name</th>
                  <th className="text-left p-4 text-sm font-medium text-content-secondary">Bucket Capacity (m³)</th>
                  <th className="text-left p-4 text-sm font-medium text-content-secondary">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-content-secondary">Entries</th>
                  <th className="text-right p-4 text-sm font-medium text-content-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.data.items.map((excavator) => (
                  <tr key={excavator.id} className="border-b border-border-default hover:bg-bg-hover">
                    <td className="p-4">
                      <div className="font-medium text-content-primary">{excavator.name}</div>
                      {excavator.notes && (
                        <div className="text-sm text-content-tertiary mt-1">{excavator.notes}</div>
                      )}
                    </td>
                    <td className="p-4 text-content-primary">{excavator.bucketCapacity.toFixed(2)}</td>
                    <td className="p-4">
                      <Badge variant={statusColors[excavator.status]}>{excavator.status}</Badge>
                    </td>
                    <td className="p-4 text-content-secondary">{excavator._count?.entries || 0}</td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(excavator)}
                            leftIcon={<Edit className="w-4 h-4" />}
                          >
                            Edit
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(excavator.id)}
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
              <div className="p-8 text-center text-content-secondary">No excavators found</div>
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
          setFormData({ name: '', bucketCapacity: 0, status: 'ACTIVE', notes: '' });
        }}
        title={editingId ? 'Edit Excavator' : 'Create Excavator'}
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., EX-001, CAT 390F"
            required
          />
          <Input
            label="Bucket Capacity (cubic meters)"
            type="number"
            step="0.01"
            value={formData.bucketCapacity}
            onChange={(e) => setFormData({ ...formData, bucketCapacity: parseFloat(e.target.value) || 0 })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as EquipmentStatus })}
              className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-tertiary text-content-primary"
            >
              <option value="ACTIVE">Active</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="DECOMMISSIONED">Decommissioned</option>
            </select>
          </div>
          <Input
            label="Notes"
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Optional notes"
          />
        </div>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setIsCreateModalOpen(false);
              setEditingId(null);
              setFormData({ name: '', bucketCapacity: 0, status: 'ACTIVE', notes: '' });
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
