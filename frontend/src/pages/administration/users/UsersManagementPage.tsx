import { useState } from 'react';
import { Plus, Search, UserCheck, UserX, Users, Shield } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Modal, ModalFooter } from '@components/ui/Modal';
import { Badge } from '@components/ui/Badge';
import { useToast } from '@contexts/ToastContext';
import { usersApi, rolesApi, type User, type CreateUserDto } from '@services/system/users';
import { useAuth } from '@contexts/AuthContext';

export function UsersManagementPage() {
  const { hasPermission, user: currentUser } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<CreateUserDto>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    roleIds: [],
  });

  const { data, isLoading } = useQuery({
    queryKey: ['users', page],
    queryFn: async () => usersApi.findAll(page, 20),
  });

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => rolesApi.findAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateUserDto) => usersApi.create(data),
    onSuccess: () => {
      success('User created successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to create user');
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => usersApi.activate(id),
    onSuccess: () => {
      success('User activated successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to activate user');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => usersApi.deactivate(id),
    onSuccess: () => {
      success('User deactivated successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to deactivate user');
    },
  });

  const assignRolesMutation = useMutation({
    mutationFn: ({ id, roleIds }: { id: string; roleIds: string[] }) =>
      usersApi.assignRoles(id, roleIds),
    onSuccess: () => {
      success('Roles assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsRolesModalOpen(false);
      setSelectedUser(null);
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to assign roles');
    },
  });

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      roleIds: [],
    });
  };

  const handleCreate = () => {
    if (!formData.email.trim() || !formData.password.trim() || !formData.firstName.trim() || !formData.lastName.trim()) {
      showError('All fields are required');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleAssignRoles = (user: User) => {
    setSelectedUser(user);
    setFormData({
      ...formData,
      roleIds: user.roles?.map((r) => r.id) || [],
    });
    setIsRolesModalOpen(true);
  };

  const handleUpdateRoles = () => {
    if (!selectedUser) return;
    assignRolesMutation.mutate({ id: selectedUser.id, roleIds: formData.roleIds || [] });
  };

  const handleActivate = (id: string) => {
    if (window.confirm('Are you sure you want to activate this user?')) {
      activateMutation.mutate(id);
    }
  };

  const handleDeactivate = (id: string) => {
    if (window.confirm('Are you sure you want to deactivate this user?')) {
      deactivateMutation.mutate(id);
    }
  };

  const canCreate = hasPermission('system:manage_users');
  const canManageRoles = hasPermission('system:manage_roles');

  const filteredUsers = (data?.items || []).filter((user) =>
    !search ||
    user.email?.toLowerCase().includes(search.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageContainer
      title="User Management"
      description="Manage system users, roles, and permissions"
      actions={
        canCreate ? (
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create User
          </Button>
        ) : undefined
      }
    >
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-content-tertiary" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-content-secondary">Loading...</div>
      ) : filteredUsers.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-content-tertiary" />
          <h3 className="text-lg font-semibold text-content-primary mb-2">No users found</h3>
          <p className="text-content-secondary mb-4">
            {search ? 'Try adjusting your search terms' : 'Get started by creating your first user'}
          </p>
          {canCreate && (
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Create User
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-content-primary">
                      {user.firstName} {user.lastName}
                    </h3>
                    {user.isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="error">Inactive</Badge>
                    )}
                    {!user.emailVerified && (
                      <Badge variant="warning">Unverified</Badge>
                    )}
                  </div>
                  <p className="text-sm text-content-secondary mb-3">{user.email}</p>
                  <div className="flex flex-wrap gap-2">
                    {user.roles?.map((role) => (
                      <Badge key={role.id} variant="default">
                        <Shield className="w-3 h-3 mr-1" />
                        {role.name}
                      </Badge>
                    ))}
                    {(!user.roles || user.roles.length === 0) && (
                      <span className="text-xs text-content-tertiary">No roles assigned</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {canManageRoles && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAssignRoles(user)}
                      leftIcon={<Shield className="w-4 h-4" />}
                    >
                      Roles
                    </Button>
                  )}
                  {user.isActive ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeactivate(user.id)}
                      leftIcon={<UserX className="w-4 h-4" />}
                      disabled={user.id === currentUser?.id}
                    >
                      Deactivate
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleActivate(user.id)}
                      leftIcon={<UserCheck className="w-4 h-4" />}
                    >
                      Activate
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        title="Create User"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name *"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="First name"
            />
            <Input
              label="Last Name *"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Last name"
            />
          </div>
          <Input
            label="Email *"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="user@example.com"
          />
          <Input
            label="Password *"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Min 8 chars, uppercase, lowercase, number"
          />
          {rolesData && rolesData.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Roles</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {rolesData.map((role) => (
                  <label key={role.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.roleIds?.includes(role.id) || false}
                      onChange={(e) => {
                        const roleIds = formData.roleIds || [];
                        if (e.target.checked) {
                          setFormData({ ...formData, roleIds: [...roleIds, role.id] });
                        } else {
                          setFormData({ ...formData, roleIds: roleIds.filter((id) => id !== role.id) });
                        }
                      }}
                      className="rounded border-border-default"
                    />
                    <span className="text-sm text-content-primary">{role.name}</span>
                    {role.description && (
                      <span className="text-xs text-content-tertiary">- {role.description}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <ModalFooter>
          <Button variant="default" onClick={() => {
            setIsCreateModalOpen(false);
            resetForm();
          }}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreate} isLoading={createMutation.isPending}>
            Create User
          </Button>
        </ModalFooter>
      </Modal>

      {/* Assign Roles Modal */}
      <Modal
        isOpen={isRolesModalOpen}
        onClose={() => {
          setIsRolesModalOpen(false);
          setSelectedUser(null);
        }}
        title={`Assign Roles - ${selectedUser?.firstName} ${selectedUser?.lastName}`}
      >
        <div className="space-y-4">
          {rolesData && rolesData.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {rolesData.map((role) => (
                <label key={role.id} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-background-secondary">
                  <input
                    type="checkbox"
                    checked={formData.roleIds?.includes(role.id) || false}
                    onChange={(e) => {
                      const roleIds = formData.roleIds || [];
                      if (e.target.checked) {
                        setFormData({ ...formData, roleIds: [...roleIds, role.id] });
                      } else {
                        setFormData({ ...formData, roleIds: roleIds.filter((id) => id !== role.id) });
                      }
                    }}
                    className="rounded border-border-default"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-content-primary">{role.name}</span>
                      {role.isSystem && (
                        <Badge variant="default" size="sm">System</Badge>
                      )}
                    </div>
                    {role.description && (
                      <p className="text-xs text-content-tertiary mt-1">{role.description}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-content-secondary text-center py-4">No roles available</p>
          )}
        </div>
        <ModalFooter>
          <Button variant="default" onClick={() => {
            setIsRolesModalOpen(false);
            setSelectedUser(null);
          }}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdateRoles} isLoading={assignRolesMutation.isPending}>
            Save Roles
          </Button>
        </ModalFooter>
      </Modal>
    </PageContainer>
  );
}
