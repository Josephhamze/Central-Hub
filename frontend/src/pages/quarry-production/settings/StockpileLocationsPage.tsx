import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Badge } from '@components/ui/Badge';
import { Modal, ModalFooter } from '@components/ui/Modal';
import { stockpileLocationsApi, type StockpileLocation } from '@services/quarry-production/settings';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@contexts/ToastContext';

export function StockpileLocationsPage() {
  const { hasPermission } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | ''>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', isActive: true });

  const { data, isLoading } = useQuery({
    queryKey: ['stockpile-locations', search, isActiveFilter],
    queryFn: () => stockpileLocationsApi.list({
      page: 1,
      limit: 50,
      search: search || undefined,
      isActive: isActiveFilter !== '' ? isActiveFilter : undefined,
    }),
  });

  const canCreate = hasPermission('quarry:settings:manage');
  const canUpdate = hasPermission('quarry:settings:manage');
  const canDelete = hasPermission('quarry:settings:manage');

  const createMutation = useMutation({
    mutationFn: (data: { name: string; isActive?: boolean }) => stockpileLocationsApi.create(data),
    onSuccess: () => {
      success('Stockpile location created successfully');
      queryClient.invalidateQueries({ queryKey: ['stockpile-locations'] });
      setIsCreateModalOpen(false);
      setFormData({ name: '', isActive: true });
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to create stockpile location'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ name: string; isActive?: boolean }> }) =>
      stockpileLocationsApi.update(id, data),
    onSuccess: () => {
      success('Stockpile location updated successfully');
      queryClient.invalidateQueries({ queryKey: ['stockpile-locations'] });
      setEditingId(null);
      setFormData({ name: '', isActive: true });
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to update stockpile location'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => stockpileLocationsApi.delete(id),
    onSuccess: () => {
      success('Stockpile location deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['stockpile-locations'] });
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to delete stockpile location'),
  });

  const handleEdit = (stockpileLocation: StockpileLocation) => {
    setEditingId(stockpileLocation.id);
    setFormData({ name: stockpileLocation.name, isActive: stockpileLocation.isActive });
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
    if (confirm('Are you sure you want to delete this stockpile location?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <PageContainer
      title="Stockpile Locations"
      description="Manage finished product stockpile locations"
      actions={
        canCreate ? (
          <Button
            variant="primary"
            onClick={() => {
              setEditingId(null);
              setFormData({ name: '', isActive: true });
              setIsCreateModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Stockpile Location
          </Button>
        ) : undefined
      }
    >
      <Card className="p-4 mb-6">
        <div className="flex gap-4">
          <Input
            placeholder="Search stockpile locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="flex-1"
          />
          <select
            value={isActiveFilter === '' ? '' : isActiveFilter.toString()}
            onChange={(e) => setIsActiveFilter(e.target.value === '' ? '' : e.target.value === 'true')}
            className="px-3 py-2 border border-border-default rounded-lg bg-bg-tertiary text-content-primary"
          >
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
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
                  <th className="text-left p-4 text-sm font-medium text-content-secondary">Name</th>
                  <th className="text-left p-4 text-sm font-medium text-content-secondary">Status</th>
                  <th className="text-right p-4 text-sm font-medium text-content-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.data.items.map((stockpileLocation) => (
                  <tr key={stockpileLocation.id} className="border-b border-border-default hover:bg-bg-hover">
                    <td className="p-4 font-medium text-content-primary">{stockpileLocation.name}</td>
                    <td className="p-4">
                      <Badge variant={stockpileLocation.isActive ? 'success' : 'default'}>
                        {stockpileLocation.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(stockpileLocation)}
                            leftIcon={<Edit className="w-4 h-4" />}
                          >
                            Edit
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(stockpileLocation.id)}
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
              <div className="p-8 text-center text-content-secondary">No stockpile locations found</div>
            )}
          </div>
        )}
      </Card>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingId(null);
          setFormData({ name: '', isActive: true });
        }}
        title={editingId ? 'Edit Stockpile Location' : 'Create Stockpile Location'}
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Stockpile A, Stockpile B, Main Yard"
            required
          />
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-2">Status</label>
            <select
              value={formData.isActive.toString()}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
              className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-tertiary text-content-primary"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setIsCreateModalOpen(false);
              setEditingId(null);
              setFormData({ name: '', isActive: true });
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
