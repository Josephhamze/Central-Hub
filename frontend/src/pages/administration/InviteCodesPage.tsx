import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Copy, Trash2, CheckCircle2, Key } from 'lucide-react';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Modal, ModalFooter } from '@components/ui/Modal';
import { Badge } from '@components/ui/Badge';
import { useToast } from '@contexts/ToastContext';
import { inviteCodesApi, type InviteCode, type CreateInviteCodeDto } from '@services/administration/invite-codes';
import { getErrorMessage } from '@services/api';
import { useAuth } from '@contexts/AuthContext';

export function InviteCodesPage() {
  const { hasPermission } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState<CreateInviteCodeDto>({
    maxUses: 1,
    expiresAt: '',
  });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: inviteCodes, isLoading } = useQuery({
    queryKey: ['invite-codes'],
    queryFn: async () => {
      const res = await inviteCodesApi.findAll();
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: inviteCodesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invite-codes'] });
      setIsCreateModalOpen(false);
      setFormData({ maxUses: 1, expiresAt: '' });
      success('Invite code created successfully!');
    },
    onError: (err) => {
      showError(getErrorMessage(err));
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: inviteCodesApi.deactivate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invite-codes'] });
      success('Invite code deactivated successfully');
    },
    onError: (err) => {
      showError(getErrorMessage(err));
    },
  });

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      success('Invite code copied to clipboard!');
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      showError('Failed to copy invite code');
    }
  };

  const handleDeactivate = (id: string) => {
    if (confirm('Are you sure you want to deactivate this invite code?')) {
      deactivateMutation.mutate(id);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const isExpired = (inviteCode: InviteCode) => {
    if (!inviteCode.expiresAt) return false;
    return new Date(inviteCode.expiresAt) < new Date();
  };

  const isUsed = (inviteCode: InviteCode) => {
    return inviteCode.useCount >= inviteCode.maxUses || !!inviteCode.usedBy;
  };

  if (!hasPermission('users:view')) {
    return (
      <PageContainer title="Invite Codes" description="Manage user registration invite codes">
        <Card className="p-6">
          <p className="text-content-secondary">You don't have permission to view invite codes.</p>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Invite Codes"
      description="Generate and manage invite codes for user registration"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-content-primary">Invite Codes</h2>
            <p className="text-sm text-content-secondary mt-1">
              Create invite codes that users need to register for an account
            </p>
          </div>
          {hasPermission('users:create') && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Generate Invite Code
            </Button>
          )}
        </div>

        {/* Invite Codes List */}
        <Card>
          {isLoading ? (
            <div className="p-8 text-center text-content-secondary">Loading...</div>
          ) : !inviteCodes || inviteCodes.length === 0 ? (
            <div className="p-8 text-center">
              <Key className="w-12 h-12 text-content-tertiary mx-auto mb-4" />
              <p className="text-content-secondary mb-4">No invite codes yet</p>
              {hasPermission('users:create') && (
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  Generate Your First Invite Code
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-default">
                    <th className="text-left p-4 text-sm font-semibold text-content-secondary">Code</th>
                    <th className="text-left p-4 text-sm font-semibold text-content-secondary">Created By</th>
                    <th className="text-left p-4 text-sm font-semibold text-content-secondary">Status</th>
                    <th className="text-left p-4 text-sm font-semibold text-content-secondary">Uses</th>
                    <th className="text-left p-4 text-sm font-semibold text-content-secondary">Expires</th>
                    <th className="text-left p-4 text-sm font-semibold text-content-secondary">Used By</th>
                    <th className="text-left p-4 text-sm font-semibold text-content-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inviteCodes.map((inviteCode) => (
                    <tr key={inviteCode.id} className="border-b border-border-default hover:bg-background-hover">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm bg-background-secondary px-2 py-1 rounded">
                            {inviteCode.code}
                          </code>
                          <button
                            onClick={() => handleCopy(inviteCode.code)}
                            className="p-1 hover:bg-background-hover rounded transition-colors"
                            title="Copy code"
                          >
                            {copiedCode === inviteCode.code ? (
                              <CheckCircle2 className="w-4 h-4 text-accent-primary" />
                            ) : (
                              <Copy className="w-4 h-4 text-content-tertiary" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-content-primary">
                        {inviteCode.creator
                          ? `${inviteCode.creator.firstName} ${inviteCode.creator.lastName}`
                          : 'Unknown'}
                      </td>
                      <td className="p-4">
                        {!inviteCode.isActive ? (
                          <Badge variant="default">Deactivated</Badge>
                        ) : isExpired(inviteCode) ? (
                          <Badge variant="default">Expired</Badge>
                        ) : isUsed(inviteCode) ? (
                          <Badge variant="default">Used</Badge>
                        ) : (
                          <Badge variant="success">Active</Badge>
                        )}
                      </td>
                      <td className="p-4 text-sm text-content-primary">
                        {inviteCode.useCount} / {inviteCode.maxUses}
                      </td>
                      <td className="p-4 text-sm text-content-secondary">
                        {formatDate(inviteCode.expiresAt)}
                      </td>
                      <td className="p-4 text-sm text-content-secondary">
                        {inviteCode.user
                          ? `${inviteCode.user.firstName} ${inviteCode.user.lastName}`
                          : '-'}
                      </td>
                      <td className="p-4">
                        {inviteCode.isActive && hasPermission('users:update') && (
                          <button
                            onClick={() => handleDeactivate(inviteCode.id)}
                            className="p-1 hover:bg-background-hover rounded transition-colors text-content-tertiary hover:text-content-primary"
                            title="Deactivate"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Generate Invite Code"
      >
        <div className="space-y-4">
          <Input
            label="Max Uses"
            type="number"
            value={formData.maxUses?.toString() || '1'}
            onChange={(e) =>
              setFormData({ ...formData, maxUses: parseInt(e.target.value) || 1 })
            }
            hint="How many times this code can be used (default: 1)"
            min="1"
            max="100"
          />

          <Input
            label="Expiration Date (Optional)"
            type="datetime-local"
            value={formData.expiresAt || ''}
            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
            hint="Leave empty for no expiration"
          />
        </div>

        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => setIsCreateModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            isLoading={createMutation.isPending}
          >
            Generate Code
          </Button>
        </ModalFooter>
      </Modal>
    </PageContainer>
  );
}
