import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Warehouse as WarehouseIcon } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Modal, ModalFooter } from '@components/ui/Modal';
import { useToast } from '@contexts/ToastContext';
import { warehousesApi, type Warehouse, type CreateWarehouseDto } from '@services/sales/warehouses';
import { companiesApi } from '@services/sales/companies';
import { projectsApi } from '@services/sales/projects';
import { useAuth } from '@contexts/AuthContext';

export function WarehousesPage() {
  const { hasPermission, hasRole } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string | undefined>(undefined);
  const [projectFilter] = useState<string | undefined>(undefined);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [formData, setFormData] = useState<CreateWarehouseDto>({
    companyId: '',
    projectId: '',
    name: '',
    locationCity: '',
    isActive: true,
  });

  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await companiesApi.findAll(1, 100);
      return res.data.data;
    },
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects', formData.companyId],
    queryFn: async () => {
      const res = await projectsApi.findAll(formData.companyId, 1, 100);
      return res.data.data;
    },
    enabled: !!formData.companyId,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['warehouses', companyFilter, projectFilter],
    queryFn: async () => {
      const res = await warehousesApi.findAll(companyFilter, projectFilter, 1, 100);
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateWarehouseDto) => warehousesApi.create(data),
    onSuccess: () => {
      success('Warehouse created successfully');
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setIsCreateModalOpen(false);
      setFormData({ companyId: '', projectId: '', name: '', locationCity: '', isActive: true });
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to create warehouse');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateWarehouseDto> }) =>
      warehousesApi.update(id, data),
    onSuccess: () => {
      success('Warehouse updated successfully');
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setIsEditModalOpen(false);
      setSelectedWarehouse(null);
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to update warehouse');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => warehousesApi.remove(id),
    onSuccess: () => {
      success('Warehouse deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to delete warehouse');
    },
  });

  const handleCreate = () => {
    if (!formData.companyId || !formData.name.trim()) {
      showError('Company and warehouse name are required');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setFormData({
      companyId: warehouse.companyId,
      projectId: warehouse.projectId || '',
      name: warehouse.name,
      locationCity: warehouse.locationCity || '',
      isActive: warehouse.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = () => {
    if (!formData.companyId || !formData.name.trim()) {
      showError('Company and warehouse name are required');
      return;
    }
    if (!selectedWarehouse) return;
    updateMutation.mutate({ id: selectedWarehouse.id, data: formData });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this warehouse?')) {
      deleteMutation.mutate(id);
    }
  };

  const canCreate = hasPermission('warehouses:create') || hasRole('Administrator');
  const canUpdate = hasPermission('warehouses:update') || hasRole('Administrator');
  const canDelete = hasPermission('warehouses:delete') || hasRole('Administrator');

  const filteredWarehouses = (data?.items || []).filter(warehouse => 
    !search || warehouse.name?.toLowerCase().includes(search.toLowerCase()) ||
    warehouse.locationCity?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageContainer
      title="Warehouses"
      description="Manage warehouse locations"
      actions={
        canCreate ? (
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Warehouse
          </Button>
        ) : undefined
      }
    >
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-content-tertiary" />
            <Input
              placeholder="Search warehouses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            className="px-3 py-2 border rounded-lg bg-background-primary text-content-primary"
            value={companyFilter || ''}
            onChange={(e) => setCompanyFilter(e.target.value || undefined)}
          >
            <option value="">All Companies</option>
            {companiesData?.items.map((company) => (
              <option key={company.id} value={company.id}>{company.name}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-content-secondary">Loading...</div>
      ) : filteredWarehouses.length === 0 ? (
        <Card className="p-12 text-center">
          <WarehouseIcon className="w-12 h-12 mx-auto mb-4 text-content-tertiary" />
          <h3 className="text-lg font-semibold text-content-primary mb-2">No warehouses found</h3>
          <p className="text-content-secondary mb-4">
            {search ? 'Try adjusting your search terms' : 'Get started by creating your first warehouse'}
          </p>
          {canCreate && (
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Create Warehouse
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWarehouses.map((warehouse) => (
            <Card key={warehouse.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-content-primary mb-1">{warehouse.name}</h3>
                  {warehouse.locationCity && <p className="text-sm text-content-secondary mb-2">{warehouse.locationCity}</p>}
                  <span className={`text-xs px-2 py-1 rounded ${warehouse.isActive ? 'bg-status-success text-white' : 'bg-status-error text-white'}`}>
                    {warehouse.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex gap-2">
                  {canUpdate && (
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(warehouse)} leftIcon={<Edit className="w-4 h-4" />}>
                      Edit
                    </Button>
                  )}
                  {canDelete && (
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(warehouse.id)} leftIcon={<Trash2 className="w-4 h-4" />}>
                      Delete
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {warehouse.company && (
                  <p className="text-content-secondary"><span className="font-medium">Company:</span> {warehouse.company.name}</p>
                )}
                {warehouse.project && (
                  <p className="text-content-secondary"><span className="font-medium">Project:</span> {warehouse.project.name}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Warehouse">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Company *</label>
            <select
              className="w-full px-3 py-2 border rounded-lg bg-background-primary text-content-primary"
              value={formData.companyId}
              onChange={(e) => setFormData({ ...formData, companyId: e.target.value, projectId: '' })}
            >
              <option value="">Select a company</option>
              {companiesData?.items.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>
          {formData.companyId && (
            <div>
              <label className="block text-sm font-medium mb-2">Project</label>
              <select
                className="w-full px-3 py-2 border rounded-lg bg-background-primary text-content-primary"
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              >
                <option value="">No project</option>
                {projectsData?.items.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
          )}
          <Input label="Warehouse Name *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Warehouse name" />
          <Input label="Location City" value={formData.locationCity} onChange={(e) => setFormData({ ...formData, locationCity: e.target.value })} placeholder="City" />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="isActive" className="text-sm text-content-secondary">Active</label>
          </div>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate} isLoading={createMutation.isPending}>Create Warehouse</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setSelectedWarehouse(null); }} title="Edit Warehouse">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Company *</label>
            <select
              className="w-full px-3 py-2 border rounded-lg bg-background-primary text-content-primary"
              value={formData.companyId}
              onChange={(e) => setFormData({ ...formData, companyId: e.target.value, projectId: '' })}
            >
              <option value="">Select a company</option>
              {companiesData?.items.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>
          {formData.companyId && (
            <div>
              <label className="block text-sm font-medium mb-2">Project</label>
              <select
                className="w-full px-3 py-2 border rounded-lg bg-background-primary text-content-primary"
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              >
                <option value="">No project</option>
                {projectsData?.items.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
          )}
          <Input label="Warehouse Name *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Warehouse name" />
          <Input label="Location City" value={formData.locationCity} onChange={(e) => setFormData({ ...formData, locationCity: e.target.value })} placeholder="City" />
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActiveEdit" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4" />
            <label htmlFor="isActiveEdit" className="text-sm text-content-secondary">Active</label>
          </div>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => { setIsEditModalOpen(false); setSelectedWarehouse(null); }}>Cancel</Button>
          <Button variant="primary" onClick={handleUpdate} isLoading={updateMutation.isPending}>Update Warehouse</Button>
        </ModalFooter>
      </Modal>
    </PageContainer>
  );
}
