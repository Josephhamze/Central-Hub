import { useState } from 'react';
import { Plus, Search, Edit, Trash2, FolderKanban } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Modal, ModalFooter } from '@components/ui/Modal';
import { useToast } from '@contexts/ToastContext';
import { projectsApi, type Project, type CreateProjectDto } from '@services/sales/projects';
import { companiesApi } from '@services/sales/companies';
import { useAuth } from '@contexts/AuthContext';

export function ProjectsPage() {
  const { hasPermission } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string | undefined>(undefined);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<CreateProjectDto>({
    companyId: '',
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'ACTIVE',
  });

  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await companiesApi.findAll(1, 100);
      return res.data.data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['projects', companyFilter],
    queryFn: async () => {
      const res = await projectsApi.findAll(companyFilter, 1, 100);
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateProjectDto) => projectsApi.create(data),
    onSuccess: () => {
      success('Project created successfully');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsCreateModalOpen(false);
      setFormData({ companyId: '', name: '', description: '', startDate: '', endDate: '', status: 'ACTIVE' });
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to create project');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateProjectDto> }) =>
      projectsApi.update(id, data),
    onSuccess: () => {
      success('Project updated successfully');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsEditModalOpen(false);
      setSelectedProject(null);
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to update project');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsApi.remove(id),
    onSuccess: () => {
      success('Project deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to delete project');
    },
  });

  const handleCreate = () => {
    if (!formData.companyId || !formData.name.trim()) {
      showError('Company and project name are required');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setFormData({
      companyId: project.companyId,
      name: project.name,
      description: project.description || '',
      startDate: project.startDate || '',
      endDate: project.endDate || '',
      status: project.status || 'ACTIVE',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = () => {
    if (!formData.companyId || !formData.name.trim()) {
      showError('Company and project name are required');
      return;
    }
    if (!selectedProject) return;
    updateMutation.mutate({ id: selectedProject.id, data: formData });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      deleteMutation.mutate(id);
    }
  };

  const canCreate = hasPermission('projects:create');
  const canUpdate = hasPermission('projects:update');
  const canDelete = hasPermission('projects:delete');

  const filteredProjects = data?.items?.filter(project => 
    !search || project.name?.toLowerCase().includes(search.toLowerCase()) ||
    project.description?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <PageContainer
      title="Projects"
      description="Manage company projects"
      actions={
        canCreate ? (
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Project
          </Button>
        ) : undefined
      }
    >
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-content-tertiary" />
            <Input
              placeholder="Search projects..."
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
      ) : filteredProjects.length === 0 ? (
        <Card className="p-12 text-center">
          <FolderKanban className="w-12 h-12 mx-auto mb-4 text-content-tertiary" />
          <h3 className="text-lg font-semibold text-content-primary mb-2">No projects found</h3>
          <p className="text-content-secondary mb-4">
            {search ? 'Try adjusting your search terms' : 'Get started by creating your first project'}
          </p>
          {canCreate && (
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Create Project
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-content-primary mb-1">{project.name}</h3>
                  {project.description && <p className="text-sm text-content-secondary mb-2 line-clamp-2">{project.description}</p>}
                  <span className="text-xs text-content-tertiary">{project.status}</span>
                </div>
                <div className="flex gap-2">
                  {canUpdate && (
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(project)} leftIcon={<Edit className="w-4 h-4" />}>
                      Edit
                    </Button>
                  )}
                  {canDelete && (
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(project.id)} leftIcon={<Trash2 className="w-4 h-4" />}>
                      Delete
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {project.company && (
                  <p className="text-content-secondary"><span className="font-medium">Company:</span> {project.company.name}</p>
                )}
                {project.startDate && (
                  <p className="text-content-tertiary text-xs">Start: {new Date(project.startDate).toLocaleDateString()}</p>
                )}
                {project.endDate && (
                  <p className="text-content-tertiary text-xs">End: {new Date(project.endDate).toLocaleDateString()}</p>
                )}
                {project._count && (
                  <p className="text-content-tertiary text-xs">Warehouses: {project._count.warehouses}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Project">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Company *</label>
            <select
              className="w-full px-3 py-2 border rounded-lg bg-background-primary text-content-primary"
              value={formData.companyId}
              onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
            >
              <option value="">Select a company</option>
              {companiesData?.items.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>
          <Input label="Project Name *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Project name" />
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg bg-background-primary text-content-primary"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Project description"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
            <Input label="End Date" type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              className="w-full px-3 py-2 border rounded-lg bg-background-primary text-content-primary"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="COMPLETED">Completed</option>
              <option value="ON_HOLD">On Hold</option>
            </select>
          </div>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate} isLoading={createMutation.isPending}>Create Project</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setSelectedProject(null); }} title="Edit Project">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Company *</label>
            <select
              className="w-full px-3 py-2 border rounded-lg bg-background-primary text-content-primary"
              value={formData.companyId}
              onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
            >
              <option value="">Select a company</option>
              {companiesData?.items.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>
          <Input label="Project Name *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Project name" />
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg bg-background-primary text-content-primary"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Project description"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
            <Input label="End Date" type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              className="w-full px-3 py-2 border rounded-lg bg-background-primary text-content-primary"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="COMPLETED">Completed</option>
              <option value="ON_HOLD">On Hold</option>
            </select>
          </div>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => { setIsEditModalOpen(false); setSelectedProject(null); }}>Cancel</Button>
          <Button variant="primary" onClick={handleUpdate} isLoading={updateMutation.isPending}>Update Project</Button>
        </ModalFooter>
      </Modal>
    </PageContainer>
  );
}
