import { useState, useRef } from 'react';
import { Plus, Search, Edit, Trash2, Building2, Upload, X } from 'lucide-react';
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
  const { hasPermission, hasRole } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState<CreateCompanyDto>({
    name: '',
    legalName: '',
    nif: '',
    rccm: '',
    idNational: '',
    vat: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: '',
    phone: '',
    email: '',
    logoUrl: '',
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['companies', search],
    queryFn: async () => {
      try {
        const res = await companiesApi.findAll(1, 100, search);
        return res.data.data;
      } catch (err) {
        console.error('Failed to load companies:', err);
        return { items: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } };
      }
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: (file: File) => companiesApi.uploadLogo(file),
    onSuccess: (response) => {
      const logoUrl = response.data.data.logoUrl;
      setFormData({ ...formData, logoUrl });
      setLogoPreview(null);
      setIsUploadingLogo(false);
      success('Logo uploaded successfully');
    },
    onError: (err: any) => {
      setIsUploadingLogo(false);
      showError(err.response?.data?.error?.message || 'Failed to upload logo');
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
        nif: '',
        rccm: '',
        idNational: '',
        vat: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        country: '',
        phone: '',
        email: '',
        logoUrl: '',
      });
      setLogoPreview(null);
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
    // Remove empty strings and convert to undefined for optional fields
    const cleanData = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [
        key,
        value === '' ? undefined : value,
      ])
    ) as CreateCompanyDto;
    createMutation.mutate(cleanData);
  };

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setFormData({
      name: company.name,
      legalName: company.legalName || '',
      nif: company.nif || '',
      rccm: company.rccm || '',
      idNational: company.idNational || '',
      vat: company.vat || '',
      addressLine1: company.addressLine1 || '',
      addressLine2: company.addressLine2 || '',
      city: company.city || '',
      state: company.state || '',
      country: company.country || '',
      phone: company.phone || '',
      email: company.email || '',
      logoUrl: company.logoUrl || '',
    });
    setLogoPreview(company.logoUrl || null);
    setIsEditModalOpen(true);
  };

  const handleUpdate = () => {
    if (!formData.name.trim()) {
      showError('Company name is required');
      return;
    }
    if (!selectedCompany) return;
    // Remove empty strings and convert to undefined for optional fields
    // But explicitly set logoUrl to null if it's empty (to allow clearing the logo)
    const cleanData = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => {
        if (key === 'logoUrl' && value === '') {
          return [key, null]; // Explicitly set to null to clear the logo
        }
        return [key, value === '' ? undefined : value];
      })
    ) as Partial<CreateCompanyDto>;
    updateMutation.mutate({ id: selectedCompany.id, data: cleanData });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        showError('Please select an image file (PNG, JPG, JPEG, SVG, or WEBP)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError('File size must be less than 5MB');
        return;
      }

      setIsUploadingLogo(true);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload file
      uploadLogoMutation.mutate(file);
    }
  };

  const handleRemoveLogo = () => {
    setFormData({ ...formData, logoUrl: '' });
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const canCreate = hasPermission('companies:create') || hasRole('Administrator');
  const canUpdate = hasPermission('companies:update') || hasRole('Administrator');
  const canDelete = hasPermission('companies:delete') || hasRole('Administrator');

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
                {company.nif && (
                  <p className="text-content-tertiary text-xs">
                    NIF: {company.nif}
                  </p>
                )}
                {company.rccm && (
                  <p className="text-content-tertiary text-xs">
                    RCCM: {company.rccm}
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
        size="lg"
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
              label="NIF"
              value={formData.nif}
              onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
              placeholder="Numéro d'Identification Fiscale"
            />
            <Input
              label="RCCM"
              value={formData.rccm}
              onChange={(e) => setFormData({ ...formData, rccm: e.target.value })}
              placeholder="Registre du Commerce et du Crédit Mobilier"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="ID National"
              value={formData.idNational}
              onChange={(e) => setFormData({ ...formData, idNational: e.target.value })}
              placeholder="ID National"
            />
            <Input
              label="VAT"
              value={formData.vat}
              onChange={(e) => setFormData({ ...formData, vat: e.target.value })}
              placeholder="VAT number"
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
          <div className="grid grid-cols-2 gap-4">
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
          <div>
            <label className="block text-sm font-medium mb-2 text-content-primary">
              Company Logo
            </label>
            <div className="space-y-3">
              {logoPreview || formData.logoUrl ? (
                <div className="relative inline-block">
                  <img
                    src={logoPreview || formData.logoUrl}
                    alt="Logo preview"
                    className="h-24 w-auto border border-border-default rounded-lg object-contain bg-background-secondary p-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 p-1 bg-background-elevated rounded-full border border-border-default hover:bg-background-hover"
                  >
                    <X className="w-4 h-4 text-content-secondary" />
                  </button>
                </div>
              ) : null}
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="logo-upload-edit"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  leftIcon={<Upload className="w-4 h-4" />}
                  disabled={isUploadingLogo}
                  isLoading={isUploadingLogo}
                >
                  {logoPreview || formData.logoUrl ? 'Change Logo' : 'Upload Logo'}
                </Button>
                {!logoPreview && !formData.logoUrl && (
                  <Input
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    placeholder="Or enter logo URL"
                    type="url"
                    className="flex-1"
                  />
                )}
              </div>
              <p className="text-xs text-content-secondary">
                Upload a logo image (PNG, JPG, SVG, or WEBP, max 5MB) or enter a URL. The logo will be used when printing quotes.
              </p>
            </div>
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
        size="lg"
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
              label="NIF"
              value={formData.nif}
              onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
              placeholder="Numéro d'Identification Fiscale"
            />
            <Input
              label="RCCM"
              value={formData.rccm}
              onChange={(e) => setFormData({ ...formData, rccm: e.target.value })}
              placeholder="Registre du Commerce et du Crédit Mobilier"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="ID National"
              value={formData.idNational}
              onChange={(e) => setFormData({ ...formData, idNational: e.target.value })}
              placeholder="ID National"
            />
            <Input
              label="VAT"
              value={formData.vat}
              onChange={(e) => setFormData({ ...formData, vat: e.target.value })}
              placeholder="VAT number"
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
          <div className="grid grid-cols-2 gap-4">
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
          <div>
            <label className="block text-sm font-medium mb-2 text-content-primary">
              Company Logo
            </label>
            <div className="space-y-3">
              {logoPreview || formData.logoUrl ? (
                <div className="relative inline-block">
                  <img
                    src={logoPreview || formData.logoUrl}
                    alt="Logo preview"
                    className="h-24 w-auto border border-border-default rounded-lg object-contain bg-background-secondary p-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 p-1 bg-background-elevated rounded-full border border-border-default hover:bg-background-hover"
                  >
                    <X className="w-4 h-4 text-content-secondary" />
                  </button>
                </div>
              ) : null}
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="logo-upload-edit"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  leftIcon={<Upload className="w-4 h-4" />}
                  disabled={isUploadingLogo}
                  isLoading={isUploadingLogo}
                >
                  {logoPreview || formData.logoUrl ? 'Change Logo' : 'Upload Logo'}
                </Button>
                {!logoPreview && !formData.logoUrl && (
                  <Input
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    placeholder="Or enter logo URL"
                    type="url"
                    className="flex-1"
                  />
                )}
              </div>
              <p className="text-xs text-content-secondary">
                Upload a logo image (PNG, JPG, SVG, or WEBP, max 5MB) or enter a URL. The logo will be used when printing quotes.
              </p>
            </div>
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
