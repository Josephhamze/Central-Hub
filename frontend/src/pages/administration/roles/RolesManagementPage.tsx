import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Shield, CheckSquare, Square } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Modal, ModalFooter } from '@components/ui/Modal';
import { Badge } from '@components/ui/Badge';
import { useToast } from '@contexts/ToastContext';
import { rolesApi, type Role, type CreateRoleDto } from '@services/system/users';
import { useAuth } from '@contexts/AuthContext';

export function RolesManagementPage() {
  const { hasPermission } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<CreateRoleDto>({
    name: '',
    description: '',
    permissionIds: [],
  });

  const { data: rolesData, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => rolesApi.findAll(),
  });

  const { data: permissionsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => rolesApi.getAllPermissions(),
    enabled: isCreateModalOpen || isEditModalOpen,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateRoleDto) => rolesApi.create(data),
    onSuccess: () => {
      success('Role created successfully');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to create role');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateRoleDto> }) =>
      rolesApi.update(id, data),
    onSuccess: () => {
      success('Role updated successfully');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsEditModalOpen(false);
      setSelectedRole(null);
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to update role');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => rolesApi.remove(id),
    onSuccess: () => {
      success('Role deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to delete role');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      permissionIds: [],
    });
  };

  const handleCreate = () => {
    if (!formData.name.trim()) {
      showError('Role name is required');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissionIds: role.permissions?.map((p) => p.id) || [],
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = () => {
    if (!formData.name.trim()) {
      showError('Role name is required');
      return;
    }
    if (!selectedRole) return;
    updateMutation.mutate({ id: selectedRole.id, data: formData });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const togglePermission = (permissionId: string) => {
    const permissionIds = formData.permissionIds || [];
    if (permissionIds.includes(permissionId)) {
      setFormData({ ...formData, permissionIds: permissionIds.filter((id) => id !== permissionId) });
    } else {
      setFormData({ ...formData, permissionIds: [...permissionIds, permissionId] });
    }
  };

  const toggleModulePermissions = (module: string) => {
    if (!permissionsData?.byModule[module]) return;
    const modulePermissionIds = permissionsData.byModule[module].map((p) => p.id);
    const currentIds = formData.permissionIds || [];
    const allSelected = modulePermissionIds.every((id) => currentIds.includes(id));
    
    if (allSelected) {
      // Deselect all in module
      setFormData({
        ...formData,
        permissionIds: currentIds.filter((id) => !modulePermissionIds.includes(id)),
      });
    } else {
      // Select all in module
      const newIds = [...new Set([...currentIds, ...modulePermissionIds])];
      setFormData({ ...formData, permissionIds: newIds });
    }
  };

  const canCreate = hasPermission('system:manage_roles');
  const canUpdate = hasPermission('system:manage_roles');
  const canDelete = hasPermission('system:manage_roles');

  const filteredRoles = (rolesData || []).filter((role) =>
    !search ||
    role.name?.toLowerCase().includes(search.toLowerCase()) ||
    role.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageContainer
      title="Roles & Permissions"
      description="Manage user roles and their permission presets"
      actions={
        canCreate ? (
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Role
          </Button>
        ) : undefined
      }
    >
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-content-tertiary" />
          <Input
            placeholder="Search roles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-content-secondary">Loading...</div>
      ) : filteredRoles.length === 0 ? (
        <Card className="p-12 text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-content-tertiary" />
          <h3 className="text-lg font-semibold text-content-primary mb-2">No roles found</h3>
          <p className="text-content-secondary mb-4">
            {search ? 'Try adjusting your search terms' : 'Get started by creating your first role'}
          </p>
          {canCreate && (
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Create Role
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRoles.map((role) => (
            <Card key={role.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-content-primary">{role.name}</h3>
                    {role.isSystem && (
                      <Badge variant="default">System Role</Badge>
                    )}
                    {role.userCount !== undefined && role.userCount > 0 && (
                      <Badge variant="info">{role.userCount} user{role.userCount !== 1 ? 's' : ''}</Badge>
                    )}
                  </div>
                  {role.description && (
                    <p className="text-sm text-content-secondary mb-3">{role.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {role.permissions?.slice(0, 5).map((perm) => (
                      <Badge key={perm.id} variant="default" size="sm">
                        {perm.code}
                      </Badge>
                    ))}
                    {role.permissions && role.permissions.length > 5 && (
                      <Badge variant="default" size="sm">
                        +{role.permissions.length - 5} more
                      </Badge>
                    )}
                    {(!role.permissions || role.permissions.length === 0) && (
                      <span className="text-xs text-content-tertiary">No permissions assigned</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {canUpdate && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(role)}
                      leftIcon={<Edit className="w-4 h-4" />}
                    >
                      Edit
                    </Button>
                  )}
                  {canDelete && !role.isSystem && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(role.id)}
                      leftIcon={<Trash2 className="w-4 h-4" />}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Role Modal */}
      <Modal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedRole(null);
          resetForm();
        }}
        title={isEditModalOpen ? 'Edit Role' : 'Create Role'}
      >
        <div className="space-y-4">
          <Input
            label="Role Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter role name"
            disabled={isEditModalOpen && selectedRole?.isSystem}
          />
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter role description"
          />
          
          {permissionsData && (
            <div>
              <label className="block text-sm font-medium mb-3">Permissions</label>
              <div className="space-y-4 max-h-96 overflow-y-auto border border-border-default rounded-lg p-4">
                {Object.entries(permissionsData.byModule).map(([module, permissions]) => {
                  const modulePermissionIds = permissions.map((p) => p.id);
                  const currentIds = formData.permissionIds || [];
                  const allSelected = modulePermissionIds.every((id) => currentIds.includes(id));
                  const someSelected = modulePermissionIds.some((id) => currentIds.includes(id));
                  
                  return (
                    <div key={module} className="border-b border-border-default pb-3 last:border-0 last:pb-0">
                      <button
                        type="button"
                        onClick={() => toggleModulePermissions(module)}
                        className="flex items-center gap-2 w-full text-left mb-2 font-medium text-content-primary hover:text-content-secondary"
                      >
                        {allSelected ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : someSelected ? (
                          <Square className="w-4 h-4" />
                        ) : (
                          <Square className="w-4 h-4 opacity-30" />
                        )}
                        <span className="capitalize">{module}</span>
                        <span className="text-xs text-content-tertiary">
                          ({modulePermissionIds.filter((id) => currentIds.includes(id)).length} / {permissions.length})
                        </span>
                      </button>
                      <div className="ml-6 space-y-1">
                        {permissions.map((perm) => (
                          <label key={perm.id} className="flex items-center gap-2 cursor-pointer text-sm">
                            <input
                              type="checkbox"
                              checked={currentIds.includes(perm.id)}
                              onChange={() => togglePermission(perm.id)}
                              className="rounded border-border-default"
                            />
                            <span className="text-content-primary">{perm.code}</span>
                            {perm.name && (
                              <span className="text-content-tertiary">- {perm.name}</span>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <ModalFooter>
          <Button
            variant="default"
            onClick={() => {
              setIsCreateModalOpen(false);
              setIsEditModalOpen(false);
              setSelectedRole(null);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={isEditModalOpen ? handleUpdate : handleCreate}
            isLoading={isEditModalOpen ? updateMutation.isPending : createMutation.isPending}
          >
            {isEditModalOpen ? 'Update Role' : 'Create Role'}
          </Button>
        </ModalFooter>
      </Modal>
    </PageContainer>
  );
}
