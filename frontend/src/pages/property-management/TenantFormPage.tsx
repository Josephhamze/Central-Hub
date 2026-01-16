import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Users, Building2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';
import propertyManagementService, {
  Tenant,
  TenantStatus,
} from '@/services/property-management';

export function TenantFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Tenant>>({
    isCompany: false,
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    idType: '',
    idNumber: '',
    taxId: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    status: TenantStatus.PENDING,
    notes: '',
  });

  useEffect(() => {
    if (isEdit) {
      loadTenant();
    }
  }, [id]);

  const loadTenant = async () => {
    try {
      setLoading(true);
      const tenant = await propertyManagementService.getTenant(id!);
      setFormData({
        isCompany: tenant.isCompany,
        firstName: tenant.firstName || '',
        lastName: tenant.lastName || '',
        companyName: tenant.companyName || '',
        email: tenant.email || '',
        phone: tenant.phone || '',
        alternatePhone: tenant.alternatePhone || '',
        idType: tenant.idType || '',
        idNumber: tenant.idNumber || '',
        taxId: tenant.taxId || '',
        addressLine1: tenant.addressLine1 || '',
        addressLine2: tenant.addressLine2 || '',
        city: tenant.city || '',
        state: tenant.state || '',
        postalCode: tenant.postalCode || '',
        country: tenant.country || '',
        emergencyContactName: tenant.emergencyContactName || '',
        emergencyContactPhone: tenant.emergencyContactPhone || '',
        status: tenant.status,
        notes: tenant.notes || '',
      });
    } catch (err: any) {
      showError(err.response?.data?.error?.message || 'Failed to load tenant');
      navigate('/property-management/tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.isCompany && !formData.companyName) {
      showError('Company name is required');
      return;
    }

    if (!formData.isCompany && (!formData.firstName || !formData.lastName)) {
      showError('First name and last name are required');
      return;
    }

    try {
      setSaving(true);
      if (isEdit) {
        await propertyManagementService.updateTenant(id!, formData);
        success('Tenant updated successfully');
        navigate(`/property-management/tenants/${id}`);
      } else {
        const newTenant = await propertyManagementService.createTenant(formData);
        success('Tenant created successfully');
        navigate(`/property-management/tenants/${newTenant.id}`);
      }
    } catch (err: any) {
      showError(err.response?.data?.error?.message || `Failed to ${isEdit ? 'update' : 'create'} tenant`);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof Tenant, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/property-management/tenants')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-content-primary">
            {isEdit ? 'Edit Tenant' : 'New Tenant'}
          </h1>
          <p className="text-content-secondary">
            {isEdit ? 'Update tenant information' : 'Add a new tenant to your registry'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tenant Type */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            {formData.isCompany ? (
              <Building2 className="w-5 h-5 text-accent-primary" />
            ) : (
              <Users className="w-5 h-5 text-accent-primary" />
            )}
            <h2 className="text-lg font-semibold text-content-primary">Tenant Type</h2>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="isCompany"
                checked={!formData.isCompany}
                onChange={() => handleChange('isCompany', false)}
                className="w-4 h-4 text-accent-primary"
              />
              <span className="text-content-primary">Individual</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="isCompany"
                checked={formData.isCompany}
                onChange={() => handleChange('isCompany', true)}
                className="w-4 h-4 text-accent-primary"
              />
              <span className="text-content-primary">Company</span>
            </label>
          </div>
        </Card>

        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-content-primary mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.isCompany ? (
              <>
                <div className="md:col-span-2">
                  <Input
                    label="Company Name *"
                    value={formData.companyName || ''}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    placeholder="Enter company name"
                    required
                  />
                </div>
                <Input
                  label="Tax ID"
                  value={formData.taxId || ''}
                  onChange={(e) => handleChange('taxId', e.target.value)}
                  placeholder="Tax identification number"
                />
              </>
            ) : (
              <>
                <Input
                  label="First Name *"
                  value={formData.firstName || ''}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  placeholder="Enter first name"
                  required
                />
                <Input
                  label="Last Name *"
                  value={formData.lastName || ''}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  placeholder="Enter last name"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-content-secondary mb-1">ID Type</label>
                  <select
                    className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                    value={formData.idType || ''}
                    onChange={(e) => handleChange('idType', e.target.value)}
                  >
                    <option value="">Select ID Type</option>
                    <option value="PASSPORT">Passport</option>
                    <option value="NATIONAL_ID">National ID</option>
                    <option value="DRIVERS_LICENSE">Driver's License</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <Input
                  label="ID Number"
                  value={formData.idNumber || ''}
                  onChange={(e) => handleChange('idNumber', e.target.value)}
                  placeholder="ID number"
                />
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Status *</label>
              <select
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                required
              >
                {Object.values(TenantStatus).map(status => (
                  <option key={status} value={status}>{status.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-content-primary mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="email@example.com"
            />
            <Input
              label="Phone"
              value={formData.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
            <Input
              label="Alternate Phone"
              value={formData.alternatePhone || ''}
              onChange={(e) => handleChange('alternatePhone', e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
          </div>
        </Card>

        {/* Address */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-content-primary mb-4">Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Address Line 1"
                value={formData.addressLine1 || ''}
                onChange={(e) => handleChange('addressLine1', e.target.value)}
                placeholder="Street address"
              />
            </div>
            <div className="md:col-span-2">
              <Input
                label="Address Line 2"
                value={formData.addressLine2 || ''}
                onChange={(e) => handleChange('addressLine2', e.target.value)}
                placeholder="Apartment, suite, unit, etc."
              />
            </div>
            <Input
              label="City"
              value={formData.city || ''}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="City"
            />
            <Input
              label="State / Province"
              value={formData.state || ''}
              onChange={(e) => handleChange('state', e.target.value)}
              placeholder="State or province"
            />
            <Input
              label="Postal Code"
              value={formData.postalCode || ''}
              onChange={(e) => handleChange('postalCode', e.target.value)}
              placeholder="Postal code"
            />
            <Input
              label="Country"
              value={formData.country || ''}
              onChange={(e) => handleChange('country', e.target.value)}
              placeholder="Country"
            />
          </div>
        </Card>

        {/* Emergency Contact */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-content-primary mb-4">Emergency Contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Contact Name"
              value={formData.emergencyContactName || ''}
              onChange={(e) => handleChange('emergencyContactName', e.target.value)}
              placeholder="Emergency contact name"
            />
            <Input
              label="Contact Phone"
              value={formData.emergencyContactPhone || ''}
              onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
          </div>
        </Card>

        {/* Notes */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-content-primary mb-4">Additional Notes</h2>
          <textarea
            className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
            rows={4}
            value={formData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Any additional notes about this tenant..."
          />
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isEdit ? 'Update Tenant' : 'Create Tenant'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/property-management/tenants')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

export default TenantFormPage;
