import { useState } from 'react';
import { Plus, Search, Edit, Trash2, UserCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Modal, ModalFooter } from '@components/ui/Modal';
import { useToast } from '@contexts/ToastContext';
import { contactsApi, type Contact, type CreateContactDto } from '@services/sales/contacts';
import { customersApi } from '@services/sales/customers';
import { useAuth } from '@contexts/AuthContext';

export function ContactsPage() {
  const { hasPermission } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState<string | undefined>(undefined);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState<CreateContactDto>({
    customerId: '',
    name: '',
    roleTitle: '',
    phone: '',
    email: '',
    isPrimary: false,
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await customersApi.findAll(1, 100);
      return res.data.data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', customerFilter],
    queryFn: async () => {
      const res = await contactsApi.findAll(customerFilter, 1, 100);
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateContactDto) => contactsApi.create(data),
    onSuccess: () => {
      success('Contact created successfully');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setIsCreateModalOpen(false);
      setFormData({ customerId: '', name: '', roleTitle: '', phone: '', email: '', isPrimary: false });
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to create contact');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateContactDto> }) =>
      contactsApi.update(id, data),
    onSuccess: () => {
      success('Contact updated successfully');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setIsEditModalOpen(false);
      setSelectedContact(null);
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to update contact');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contactsApi.remove(id),
    onSuccess: () => {
      success('Contact deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to delete contact');
    },
  });

  const handleCreate = () => {
    if (!formData.customerId || !formData.name.trim()) {
      showError('Customer and name are required');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact);
    setFormData({
      customerId: contact.customerId,
      name: contact.name,
      roleTitle: contact.roleTitle || '',
      phone: contact.phone || '',
      email: contact.email || '',
      isPrimary: contact.isPrimary,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = () => {
    if (!formData.customerId || !formData.name.trim()) {
      showError('Customer and name are required');
      return;
    }
    if (!selectedContact) return;
    updateMutation.mutate({ id: selectedContact.id, data: formData });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      deleteMutation.mutate(id);
    }
  };

  const canCreate = hasPermission('contacts:create');
  const canUpdate = hasPermission('contacts:update');
  const canDelete = hasPermission('contacts:delete');

  const filteredContacts = (data?.items || []).filter(contact => 
  );

  return (
    <PageContainer
      title="Contacts"
      description="Manage customer contacts"
      actions={
        canCreate ? (
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Contact
          </Button>
        ) : undefined
      }
    >
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-content-tertiary" />
            <Input
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            className="px-3 py-2 border rounded-lg bg-background-primary text-content-primary"
            value={customerFilter || ''}
            onChange={(e) => setCustomerFilter(e.target.value || undefined)}
          >
            <option value="">All Customers</option>
            {customersData?.items.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.type === 'COMPANY' ? customer.companyName : `${customer.firstName} ${customer.lastName}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-content-secondary">Loading...</div>
      ) : filteredContacts.length === 0 ? (
        <Card className="p-12 text-center">
          <UserCircle className="w-12 h-12 mx-auto mb-4 text-content-tertiary" />
          <h3 className="text-lg font-semibold text-content-primary mb-2">No contacts found</h3>
          <p className="text-content-secondary mb-4">
            {search ? 'Try adjusting your search terms' : 'Get started by creating your first contact'}
          </p>
          {canCreate && (
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Create Contact
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => (
            <Card key={contact.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-content-primary mb-1">{contact.name}</h3>
                  {contact.roleTitle && <p className="text-sm text-content-secondary mb-2">{contact.roleTitle}</p>}
                  {contact.isPrimary && <span className="text-xs bg-accent-primary text-white px-2 py-1 rounded">Primary</span>}
                </div>
                <div className="flex gap-2">
                  {canUpdate && (
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(contact)} leftIcon={<Edit className="w-4 h-4" />}>
                      Edit
                    </Button>
                  )}
                  {canDelete && (
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(contact.id)} leftIcon={<Trash2 className="w-4 h-4" />}>
                      Delete
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {contact.email && (
                  <p className="text-content-secondary"><span className="font-medium">Email:</span> {contact.email}</p>
                )}
                {contact.phone && (
                  <p className="text-content-secondary"><span className="font-medium">Phone:</span> {contact.phone}</p>
                )}
                {contact.customer && (
                  <p className="text-content-tertiary text-xs">
                    Customer: {contact.customer.type === 'COMPANY' ? contact.customer.companyName : `${contact.customer.firstName} ${contact.customer.lastName}`}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Contact">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Customer *</label>
            <select
              className="w-full px-3 py-2 border rounded-lg bg-background-primary text-content-primary"
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
            >
              <option value="">Select a customer</option>
              {customersData?.items.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.type === 'COMPANY' ? customer.companyName : `${customer.firstName} ${customer.lastName}`}
                </option>
              ))}
            </select>
          </div>
          <Input label="Name *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Contact name" />
          <Input label="Role Title" value={formData.roleTitle} onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })} placeholder="Job title" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Phone number" />
            <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Email address" />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPrimary"
              checked={formData.isPrimary}
              onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="isPrimary" className="text-sm text-content-secondary">Primary contact</label>
          </div>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate} isLoading={createMutation.isPending}>Create Contact</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setSelectedContact(null); }} title="Edit Contact">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Customer *</label>
            <select
              className="w-full px-3 py-2 border rounded-lg bg-background-primary text-content-primary"
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
            >
              <option value="">Select a customer</option>
              {customersData?.items.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.type === 'COMPANY' ? customer.companyName : `${customer.firstName} ${customer.lastName}`}
                </option>
              ))}
            </select>
          </div>
          <Input label="Name *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Contact name" />
          <Input label="Role Title" value={formData.roleTitle} onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })} placeholder="Job title" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Phone number" />
            <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Email address" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isPrimaryEdit" checked={formData.isPrimary} onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })} className="w-4 h-4" />
            <label htmlFor="isPrimaryEdit" className="text-sm text-content-secondary">Primary contact</label>
          </div>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => { setIsEditModalOpen(false); setSelectedContact(null); }}>Cancel</Button>
          <Button variant="primary" onClick={handleUpdate} isLoading={updateMutation.isPending}>Update Contact</Button>
        </ModalFooter>
      </Modal>
    </PageContainer>
  );
}
