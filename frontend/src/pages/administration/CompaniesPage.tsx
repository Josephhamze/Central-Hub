import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Building2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Modal, ModalFooter } from '@components/ui/Modal';
import { useToast } from '@contexts/ToastContext';
import { companiesApi, type Company, type CreateCompanyDto } from '@services/sales/companies';
import { useAuth } from '@contexts/AuthContext';

export function CompaniesPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState<CreateCompanyDto>({
    name: '',
    legalName: '',
    registrationNo: '',
    taxNo: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    phone: '',
    email: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['companies', search],
    queryFn: async () => {
      const res = await companiesApi.findAll(1, 100, search);
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCompanyDto) => companiesApi.create(data),
    onSuccess: () => {
      success('Company created successfully');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setIsCreateModalOpen(false);
      setFormData({
        name: '',
        legalName: '',
        registrationNo: '',
        taxNo: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        phone: '',
        email: '',
      });
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to create company');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCompanyDto> }) =>
      companiesApi.update(id, data),
    onSuccess: () => {
      success('Company updated successfully');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setIsEditModalOpen(false);
      setSelectedCompany(null);
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to update company');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => companiesApi.remove(id),
    onSuccess: () => {
      success('Company deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to delete company');
    },
  });

  const handleCreate = () => {
    if (!formData.name.trim()) {
      showError('Company name is required');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setFormData({
      name: company.name,
      legalName: company.legalName || '',
      registrationNo: company.registrationNo || '',
      taxNo: company.taxNo || '',
      addressLine1: company.addressLine1 || '',
      addressLine2: company.addressLine2 || '',
      city: company.city || '',
      state: company.state || '',
      postalCode: company.postalCode || '',
      country: company.country || '',
      phone: company.phone || '',
      email: company.email || '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = () => {
    if (!formData.name.trim()) {
      showError('Company name is required');
      return;
    }
    if (!selectedCompany) return;
    updateMutation.mutate({ id: selectedCompany.id, data: formData });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      deleteMutation.mutate(id);
    }
  };

  const canCreate = hasPermission('companies:create');
  const canUpdate = hasPermission('companies:update');
  const canDelete = hasPermission('companies:delete');

  return (
    <PageContainer
      title="Companies"
      description="Manage company directory and information"
      actions={
        canCreate ? (
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Company
          </Button>
        ) : undefined
      }
    >
      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-content-tertiary" />
          <Input
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Companies List */}
      {isLoading ? (
        <div className="text-center py-12 text-content-secondary">Loading...</div>
      ) : !data?.items || data.items.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-content-tertiary" />
          <h3 className="text-lg font-semibold text-content-primary mb-2">No companies found</h3>
          <p className="text-content-secondary mb-4">
            {search ? 'Try adjusting your search terms' : 'Get started by creating your first company'}
          </p>
          {canCreate && (
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Create Company
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.items.map((company) => (
            <Card key={company.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-content-primary mb-1">{company.name}</h3>
                  {company.legalName && (
                    <p className="text-sm text-content-secondary mb-2">{company.legalName}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {canUpdate && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(company)}
                      leftIcon={<Edit className="w-4 h-4" />}
                    >
                      Edit
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(company.id)}
                      leftIcon={<Trash2 className="w-4 h-4" />}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {company.email && (
                  <p className="text-content-secondary">
                    <span className="font-medium">Email:</span> {company.email}
                  </p>
                )}
                {company.phone && (
                  <p className="text-content-secondary">
                    <span className="font-medium">Phone:</span> {company.phone}
                  </p>
                )}
                {company.city && (
                  <p className="text-content-secondary">
                    <span className="font-medium">Location:</span> {company.city}
                    {company.state && `, ${company.state}`}
                    {company.country && `, ${company.country}`}
                  </p>
                )}
                {company.registrationNo && (
                  <p className="text-content-tertiary text-xs">
                    Reg: {company.registrationNo}
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
        title="Create Company"
      >
        <div className="space-y-4">
          <Input
            label="Company Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter company name"
          />
          <Input
            label="Legal Name"
            value={formData.legalName}
            onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
            placeholder="Enter legal name"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Registration Number"
              value={formData.registrationNo}
              onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value })}
              placeholder="Registration number"
            />
            <Input
              label="Tax Number"
              value={formData.taxNo}
              onChange={(e) => setFormData({ ...formData, taxNo: e.target.value })}
              placeholder="Tax number"
            />
          </div>
          <Input
            label="Address Line 1"
            value={formData.addressLine1}
            onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
            placeholder="Street address"
          />
          <Input
            label="Address Line 2"
            value={formData.addressLine2}
            onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
            placeholder="Apartment, suite, etc."
          />
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="City"
            />
            <Input
              label="State"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              placeholder="State"
            />
            <Input
              label="Postal Code"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              placeholder="Postal code"
            />
          </div>
          <Input
            label="Country"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            placeholder="Country"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Phone number"
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Email address"
            />
          </div>
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
            Create Company
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCompany(null);
        }}
        title="Edit Company"
      >
        <div className="space-y-4">
          <Input
            label="Company Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter company name"
          />
          <Input
            label="Legal Name"
            value={formData.legalName}
            onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
            placeholder="Enter legal name"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Registration Number"
              value={formData.registrationNo}
              onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value })}
              placeholder="Registration number"
            />
            <Input
              label="Tax Number"
              value={formData.taxNo}
              onChange={(e) => setFormData({ ...formData, taxNo: e.target.value })}
              placeholder="Tax number"
            />
          </div>
          <Input
            label="Address Line 1"
            value={formData.addressLine1}
            onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
            placeholder="Street address"
          />
          <Input
            label="Address Line 2"
            value={formData.addressLine2}
            onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
            placeholder="Apartment, suite, etc."
          />
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="City"
            />
            <Input
              label="State"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              placeholder="State"
            />
            <Input
              label="Postal Code"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              placeholder="Postal code"
            />
          </div>
          <Input
            label="Country"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            placeholder="Country"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Phone number"
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Email address"
            />
          </div>
        </div>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setIsEditModalOpen(false);
              setSelectedCompany(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpdate}
            isLoading={updateMutation.isPending}
          >
            Update Company
          </Button>
        </ModalFooter>
      </Modal>
    </PageContainer>
  );
}
