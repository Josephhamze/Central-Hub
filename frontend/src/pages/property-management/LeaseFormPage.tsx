import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, FileText } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';
import propertyManagementService, {
  Lease,
  LeaseType,
  PaymentFrequency,
  PaymentMethod,
  Property,
  Tenant,
  PropertyUnit,
} from '@/services/property-management';

export function LeaseFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [units, setUnits] = useState<PropertyUnit[]>([]);
  const [formData, setFormData] = useState<Partial<Lease>>({
    tenantId: '',
    propertyId: '',
    unitId: '',
    leaseType: LeaseType.FIXED,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    rentAmount: 0,
    depositAmount: 0,
    paymentFrequency: PaymentFrequency.MONTHLY,
    paymentDueDay: 1,
    gracePeriodDays: 5,
    lateFeeAmount: undefined,
    lateFeePercentage: undefined,
    currency: 'USD',
    hasEscalation: false,
    escalationPct: undefined,
    escalationDate: '',
    preferredPaymentMethod: PaymentMethod.BANK_TRANSFER,
    specialTerms: '',
    notes: '',
  });

  useEffect(() => {
    loadFormData();
  }, [id]);

  useEffect(() => {
    if (formData.propertyId) {
      loadPropertyUnits(formData.propertyId);
    } else {
      setUnits([]);
    }
  }, [formData.propertyId]);

  const loadFormData = async () => {
    try {
      setLoading(true);

      // Load properties and tenants in parallel
      const [propertiesRes, tenantsRes] = await Promise.all([
        propertyManagementService.getProperties({ limit: 100 }),
        propertyManagementService.getTenants({ limit: 100 }),
      ]);

      setProperties(propertiesRes?.items || []);
      setTenants(tenantsRes?.items || []);

      if (isEdit) {
        const lease = await propertyManagementService.getLease(id!);
        setFormData({
          tenantId: lease.tenantId,
          propertyId: lease.propertyId,
          unitId: lease.unitId || '',
          leaseType: lease.leaseType,
          startDate: lease.startDate.split('T')[0],
          endDate: lease.endDate ? lease.endDate.split('T')[0] : '',
          rentAmount: lease.rentAmount,
          depositAmount: lease.depositAmount,
          paymentFrequency: lease.paymentFrequency,
          paymentDueDay: lease.paymentDueDay,
          gracePeriodDays: lease.gracePeriodDays,
          lateFeeAmount: lease.lateFeeAmount,
          lateFeePercentage: lease.lateFeePercentage,
          currency: lease.currency,
          hasEscalation: lease.hasEscalation,
          escalationPct: lease.escalationPct,
          escalationDate: lease.escalationDate ? lease.escalationDate.split('T')[0] : '',
          preferredPaymentMethod: lease.preferredPaymentMethod,
          specialTerms: lease.specialTerms || '',
          notes: lease.notes || '',
        });

        // Load units for the selected property
        if (lease.propertyId) {
          await loadPropertyUnits(lease.propertyId);
        }
      }
    } catch (err: any) {
      showError(err.response?.data?.error?.message || 'Failed to load data');
      if (isEdit) {
        navigate('/property-management/leases');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadPropertyUnits = async (propertyId: string) => {
    try {
      const response = await propertyManagementService.getPropertyUnits(propertyId, { limit: 100 });
      setUnits(response?.items || []);
    } catch (err) {
      console.error('Failed to load units:', err);
      setUnits([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tenantId || !formData.propertyId) {
      showError('Please select a tenant and property');
      return;
    }

    if (!formData.startDate || !formData.rentAmount) {
      showError('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      const submitData = {
        ...formData,
        unitId: formData.unitId || undefined,
        escalationDate: formData.escalationDate || undefined,
      };

      if (isEdit) {
        await propertyManagementService.updateLease(id!, submitData);
        success('Lease updated successfully');
        navigate(`/property-management/leases/${id}`);
      } else {
        const newLease = await propertyManagementService.createLease(submitData);
        success('Lease created successfully');
        navigate(`/property-management/leases/${newLease.id}`);
      }
    } catch (err: any) {
      showError(err.response?.data?.error?.message || `Failed to ${isEdit ? 'update' : 'create'} lease`);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof Lease, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getTenantName = (tenant: Tenant) => {
    if (tenant.isCompany) {
      return tenant.companyName || 'Unknown Company';
    }
    return `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim() || 'Unknown';
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
          onClick={() => navigate('/property-management/leases')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-content-primary">
            {isEdit ? 'Edit Lease' : 'New Lease'}
          </h1>
          <p className="text-content-secondary">
            {isEdit ? 'Update lease agreement' : 'Create a new lease agreement'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Parties */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-accent-primary" />
            <h2 className="text-lg font-semibold text-content-primary">Lease Parties</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Tenant *</label>
              <select
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                value={formData.tenantId || ''}
                onChange={(e) => handleChange('tenantId', e.target.value)}
                required
              >
                <option value="">Select Tenant</option>
                {tenants.map(tenant => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.tenantCode} - {getTenantName(tenant)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Property *</label>
              <select
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                value={formData.propertyId || ''}
                onChange={(e) => {
                  handleChange('propertyId', e.target.value);
                  handleChange('unitId', '');
                }}
                required
              >
                <option value="">Select Property</option>
                {properties.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.propertyCode} - {property.name}
                  </option>
                ))}
              </select>
            </div>
            {units.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-content-secondary mb-1">Unit (Optional)</label>
                <select
                  className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                  value={formData.unitId || ''}
                  onChange={(e) => handleChange('unitId', e.target.value)}
                >
                  <option value="">Entire Property</option>
                  {units.map(unit => (
                    <option key={unit.id} value={unit.id}>
                      {unit.unitCode} - {unit.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </Card>

        {/* Lease Terms */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-content-primary mb-4">Lease Terms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Lease Type *</label>
              <select
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                value={formData.leaseType}
                onChange={(e) => handleChange('leaseType', e.target.value)}
                required
              >
                {Object.values(LeaseType).map(type => (
                  <option key={type} value={type}>{type.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <Input
              label="Start Date *"
              type="date"
              value={formData.startDate || ''}
              onChange={(e) => handleChange('startDate', e.target.value)}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={formData.endDate || ''}
              onChange={(e) => handleChange('endDate', e.target.value)}
            />
          </div>
        </Card>

        {/* Financial Terms */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-content-primary mb-4">Financial Terms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Currency</label>
              <select
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                value={formData.currency || 'USD'}
                onChange={(e) => handleChange('currency', e.target.value)}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="ZAR">ZAR</option>
              </select>
            </div>
            <Input
              label="Rent Amount *"
              type="number"
              min="0"
              step="0.01"
              value={formData.rentAmount || ''}
              onChange={(e) => handleChange('rentAmount', parseFloat(e.target.value) || 0)}
              required
            />
            <Input
              label="Deposit Amount *"
              type="number"
              min="0"
              step="0.01"
              value={formData.depositAmount || ''}
              onChange={(e) => handleChange('depositAmount', parseFloat(e.target.value) || 0)}
              required
            />
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Payment Frequency *</label>
              <select
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                value={formData.paymentFrequency}
                onChange={(e) => handleChange('paymentFrequency', e.target.value)}
                required
              >
                {Object.values(PaymentFrequency).map(freq => (
                  <option key={freq} value={freq}>{freq.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <Input
              label="Payment Due Day *"
              type="number"
              min="1"
              max="28"
              value={formData.paymentDueDay || 1}
              onChange={(e) => handleChange('paymentDueDay', parseInt(e.target.value) || 1)}
              required
            />
            <Input
              label="Grace Period (Days)"
              type="number"
              min="0"
              value={formData.gracePeriodDays || 0}
              onChange={(e) => handleChange('gracePeriodDays', parseInt(e.target.value) || 0)}
            />
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Preferred Payment Method</label>
              <select
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                value={formData.preferredPaymentMethod || ''}
                onChange={(e) => handleChange('preferredPaymentMethod', e.target.value || undefined)}
              >
                <option value="">None</option>
                {Object.values(PaymentMethod).map(method => (
                  <option key={method} value={method}>{method.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Late Fees */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-content-primary mb-4">Late Fee Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Late Fee (Fixed Amount)"
              type="number"
              min="0"
              step="0.01"
              value={formData.lateFeeAmount || ''}
              onChange={(e) => handleChange('lateFeeAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="e.g., 50.00"
            />
            <Input
              label="Late Fee (Percentage)"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.lateFeePercentage || ''}
              onChange={(e) => handleChange('lateFeePercentage', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="e.g., 5"
            />
          </div>
          <p className="text-sm text-content-tertiary mt-2">
            If both are set, the higher amount will be applied
          </p>
        </Card>

        {/* Escalation */}
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-lg font-semibold text-content-primary">Rent Escalation</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hasEscalation || false}
                onChange={(e) => handleChange('hasEscalation', e.target.checked)}
                className="w-4 h-4 text-accent-primary rounded"
              />
              <span className="text-sm text-content-secondary">Enable annual escalation</span>
            </label>
          </div>
          {formData.hasEscalation && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Escalation Percentage (%)"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.escalationPct || ''}
                onChange={(e) => handleChange('escalationPct', e.target.value ? parseFloat(e.target.value) : undefined)}
              />
              <Input
                label="Escalation Date"
                type="date"
                value={formData.escalationDate || ''}
                onChange={(e) => handleChange('escalationDate', e.target.value)}
              />
            </div>
          )}
        </Card>

        {/* Additional Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-content-primary mb-4">Additional Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Special Terms</label>
              <textarea
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                rows={3}
                value={formData.specialTerms || ''}
                onChange={(e) => handleChange('specialTerms', e.target.value)}
                placeholder="Any special terms or conditions..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Notes</label>
              <textarea
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                rows={3}
                value={formData.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Internal notes..."
              />
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isEdit ? 'Update Lease' : 'Create Lease'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/property-management/leases')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

export default LeaseFormPage;
