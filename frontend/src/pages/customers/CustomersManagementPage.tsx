import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Users } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Modal, ModalFooter } from '@components/ui/Modal';
import { useToast } from '@contexts/ToastContext';
import { customersApi, type Customer, type CreateCustomerDto, type CustomerType } from '@services/sales/customers';
import { useAuth } from '@contexts/AuthContext';


// Form data type with frontend-friendly field names
interface CustomerFormData {
  type: CustomerType;
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  taxId: string;
  notes: string;
}

export function CustomersManagementPage() {
  const { hasPermission, hasRole } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<CustomerType | undefined>(undefined);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>({
    type: 'COMPANY',
    companyName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    taxId: '',
    notes: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search, typeFilter],
    queryFn: async () => {
      const res = await customersApi.findAll(1, 100, search, typeFilter);
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCustomerDto) => customersApi.create(data),
    onSuccess: () => {
      success('Customer created successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to create customer');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCustomerDto> }) =>
      customersApi.update(id, data),
    onSuccess: () => {
      success('Customer updated successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsEditModalOpen(false);
      setSelectedCustomer(null);
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to update customer');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customersApi.remove(id),
    onSuccess: () => {
      success('Customer deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to delete customer');
    },
  });

  const resetForm = () => {
    setFormData({
      type: 'COMPANY',
      companyName: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      taxId: '',
      notes: '',
    });
  };

  const handleCreate = () => {
    if (formData.type === 'COMPANY' && !formData.companyName?.trim()) {
      showError('Company name is required');
      return;
    }
    if (formData.type === 'INDIVIDUAL' && (!formData.firstName?.trim() || !formData.lastName?.trim())) {
      showError('First name and last name are required');
      return;
    }
    if (!formData.addressLine1?.trim() || !formData.city?.trim() || !formData.postalCode?.trim()) {
      showError('Billing address (line 1, city, and postal code) are required');
      return;
    }
    // Map frontend field names to backend field names
    const { addressLine1, addressLine2, city, state, postalCode, country, taxId, notes, ...rest } = formData;
    const apiData: CreateCustomerDto = {
      ...rest,
      billingAddressLine1: addressLine1.trim(),
      billingAddressLine2: addressLine2?.trim() || undefined,
      billingCity: city.trim(),
      billingState: state?.trim() || undefined,
      billingPostalCode: postalCode.trim(),
      billingCountry: country?.trim() || undefined,
      // taxId and notes are not in the backend schema, so we filter them out
    };
    createMutation.mutate(apiData);
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      type: customer.type,
      companyName: customer.companyName || '',
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      email: customer.email || '',
      phone: customer.phone || '',
      addressLine1: customer.billingAddressLine1 || '',
      addressLine2: customer.billingAddressLine2 || '',
      city: customer.billingCity || '',
      state: customer.billingState || '',
      postalCode: customer.billingPostalCode || '',
      country: customer.billingCountry || '',
      taxId: '', // Not in backend schema
      notes: '', // Not in backend schema
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = () => {
    if (formData.type === 'COMPANY' && !formData.companyName?.trim()) {
      showError('Company name is required');
      return;
    }
    if (formData.type === 'INDIVIDUAL' && (!formData.firstName?.trim() || !formData.lastName?.trim())) {
      showError('First name and last name are required');
      return;
    }
    if (!selectedCustomer) return;
    // Map frontend field names to backend field names
    const { addressLine1, addressLine2, city, state, postalCode, country, taxId, notes, ...rest } = formData;
    const apiData: Partial<CreateCustomerDto> = {
      ...rest,
      billingAddressLine1: addressLine1.trim(),
      billingAddressLine2: addressLine2?.trim() || undefined,
      billingCity: city.trim(),
      billingState: state?.trim() || undefined,
      billingPostalCode: postalCode.trim(),
      billingCountry: country?.trim() || undefined,
    };
    updateMutation.mutate({ id: selectedCustomer.id, data: apiData });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      deleteMutation.mutate(id);
    }
  };

  const canCreate = hasPermission('customers:create') || hasRole('Administrator');
  const canUpdate = hasPermission('customers:update') || hasRole('Administrator');
  const canDelete = hasPermission('customers:delete') || hasRole('Administrator');

  return (
    <PageContainer
      title="Customers"
      description="Manage customer directory and information"
      actions={
        canCreate ? (
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Customer
          </Button>
        ) : undefined
      }
    >
      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-content-tertiary" />
            <Input
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            className="px-3 py-2 border rounded-lg bg-background-primary text-content-primary"
            value={typeFilter || ''}
            onChange={(e) => setTypeFilter(e.target.value ? (e.target.value as CustomerType) : undefined)}
          >
            <option value="">All Types</option>
            <option value="COMPANY">Company</option>
            <option value="INDIVIDUAL">Individual</option>
          </select>
        </div>
      </div>

      {/* Customers List */}
      {isLoading ? (
        <div className="text-center py-12 text-content-secondary">Loading...</div>
      ) : !data?.items || data.items.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-content-tertiary" />
          <h3 className="text-lg font-semibold text-content-primary mb-2">No customers found</h3>
          <p className="text-content-secondary mb-4">
            {search ? 'Try adjusting your search terms' : 'Get started by creating your first customer'}
          </p>
          {canCreate && (
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Create Customer
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.items.map((customer) => (
            <Card key={customer.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-content-primary mb-1">
                    {customer.type === 'COMPANY' ? customer.companyName : `${customer.firstName} ${customer.lastName}`}
                  </h3>
                  <p className="text-xs text-content-tertiary mb-2">{customer.type}</p>
                </div>
                <div className="flex gap-2">
                  {canUpdate && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(customer)}
                      leftIcon={<Edit className="w-4 h-4" />}
                    >
                      Edit
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(customer.id)}
                      leftIcon={<Trash2 className="w-4 h-4" />}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {customer.email && (
                  <p className="text-content-secondary">
                    <span className="font-medium">Email:</span> {customer.email}
                  </p>
                )}
                {customer.phone && (
                  <p className="text-content-secondary">
                    <span className="font-medium">Phone:</span> {customer.phone}
                  </p>
                )}
                {customer.billingCity && (
                  <p className="text-content-secondary">
                    <span className="font-medium">Location:</span> {customer.billingCity}
                    {customer.billingState && `, ${customer.billingState}`}
                    {customer.billingCountry && `, ${customer.billingCountry}`}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Customer"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Customer Type *</label>
            <div className="flex gap-4">
              <Button
                variant={formData.type === 'COMPANY' ? 'primary' : 'secondary'}
                onClick={() => setFormData({ ...formData, type: 'COMPANY' })}
              >
                Company
              </Button>
              <Button
                variant={formData.type === 'INDIVIDUAL' ? 'primary' : 'secondary'}
                onClick={() => setFormData({ ...formData, type: 'INDIVIDUAL' })}
              >
                Individual
              </Button>
            </div>
          </div>
          {formData.type === 'COMPANY' ? (
            <>
              <Input
                label="Company Name *"
                value={formData.companyName || ''}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Enter company name"
              />
              <Input
                label="Tax ID"
                value={formData.taxId || ''}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                placeholder="Tax identification number"
              />
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name *"
                  value={formData.firstName || ''}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="First name"
                />
                <Input
                  label="Last Name *"
                  value={formData.lastName || ''}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Last name"
                />
              </div>
              <Input
                label="Tax ID"
                value={formData.taxId || ''}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                placeholder="Tax identification number"
              />
            </>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Email address"
            />
            <Input
              label="Phone"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Phone number"
            />
          </div>
          <Input
            label="Billing Address Line 1 *"
            value={formData.addressLine1 || ''}
            onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
            placeholder="Street address"
          />
          <Input
            label="Address Line 2"
            value={formData.addressLine2 || ''}
            onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
            placeholder="Apartment, suite, etc."
          />
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Billing City *"
              value={formData.city || ''}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="City"
            />
            <Input
              label="State"
              value={formData.state || ''}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              placeholder="State"
            />
            <Input
              label="Billing Postal Code *"
              value={formData.postalCode || ''}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              placeholder="Postal code"
            />
          </div>
          <Input
            label="Country"
            value={formData.country || ''}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            placeholder="Country"
          />
          <Input
            label="Notes"
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes"
          />
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreate}
            isLoading={createMutation.isPending}
          >
            Create Customer
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCustomer(null);
        }}
        title="Edit Customer"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Customer Type *</label>
            <div className="flex gap-4">
              <Button
                variant={formData.type === 'COMPANY' ? 'primary' : 'secondary'}
                onClick={() => setFormData({ ...formData, type: 'COMPANY' })}
              >
                Company
              </Button>
              <Button
                variant={formData.type === 'INDIVIDUAL' ? 'primary' : 'secondary'}
                onClick={() => setFormData({ ...formData, type: 'INDIVIDUAL' })}
              >
                Individual
              </Button>
            </div>
          </div>
          {formData.type === 'COMPANY' ? (
            <>
              <Input
                label="Company Name *"
                value={formData.companyName || ''}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Enter company name"
              />
              <Input
                label="Tax ID"
                value={formData.taxId || ''}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                placeholder="Tax identification number"
              />
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name *"
                  value={formData.firstName || ''}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="First name"
                />
                <Input
                  label="Last Name *"
                  value={formData.lastName || ''}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Last name"
                />
              </div>
              <Input
                label="Tax ID"
                value={formData.taxId || ''}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                placeholder="Tax identification number"
              />
            </>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Email address"
            />
            <Input
              label="Phone"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Phone number"
            />
          </div>
          <Input
            label="Billing Address Line 1 *"
            value={formData.addressLine1 || ''}
            onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
            placeholder="Street address"
          />
          <Input
            label="Address Line 2"
            value={formData.addressLine2 || ''}
            onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
            placeholder="Apartment, suite, etc."
          />
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Billing City *"
              value={formData.city || ''}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="City"
            />
            <Input
              label="State"
              value={formData.state || ''}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              placeholder="State"
            />
            <Input
              label="Billing Postal Code *"
              value={formData.postalCode || ''}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              placeholder="Postal code"
            />
          </div>
          <Input
            label="Country"
            value={formData.country || ''}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            placeholder="Country"
          />
          <Input
            label="Notes"
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes"
          />
        </div>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setIsEditModalOpen(false);
              setSelectedCustomer(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpdate}
            isLoading={updateMutation.isPending}
          >
            Update Customer
          </Button>
        </ModalFooter>
      </Modal>
    </PageContainer>
  );
}
