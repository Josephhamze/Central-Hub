import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';
import propertyManagementService, {
  RentPayment,
  PaymentMethod,
  Lease,
} from '@/services/property-management';

export function PaymentFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedLeaseId = searchParams.get('leaseId');
  const { success, error: showError } = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null);
  const [formData, setFormData] = useState<Partial<RentPayment>>({
    tenantId: '',
    leaseId: preselectedLeaseId || '',
    paymentDate: new Date().toISOString().split('T')[0],
    amount: 0,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    referenceNumber: '',
    rentPortion: 0,
    lateFeesPortion: 0,
    depositPortion: 0,
    otherPortion: 0,
    notes: '',
  });

  useEffect(() => {
    loadFormData();
  }, []);

  useEffect(() => {
    if (formData.leaseId) {
      const lease = leases.find(l => l.id === formData.leaseId);
      setSelectedLease(lease || null);
      if (lease) {
        setFormData(prev => ({
          ...prev,
          tenantId: lease.tenantId,
          rentPortion: lease.rentAmount,
          amount: lease.rentAmount,
        }));
      }
    } else {
      setSelectedLease(null);
    }
  }, [formData.leaseId, leases]);

  const loadFormData = async () => {
    try {
      setLoading(true);
      const response = await propertyManagementService.getLeases({ limit: 100, isActive: true });
      setLeases(response?.items || []);

      if (preselectedLeaseId) {
        const lease = response?.items?.find(l => l.id === preselectedLeaseId);
        if (lease) {
          setSelectedLease(lease);
          setFormData(prev => ({
            ...prev,
            tenantId: lease.tenantId,
            rentPortion: lease.rentAmount,
            amount: lease.rentAmount,
          }));
        }
      }
    } catch (err: any) {
      showError(err.response?.data?.error?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.leaseId || !formData.tenantId) {
      showError('Please select a lease');
      return;
    }

    if (!formData.amount || formData.amount <= 0) {
      showError('Please enter a valid payment amount');
      return;
    }

    // Validate portions add up
    const totalPortions = (formData.rentPortion || 0) +
                         (formData.lateFeesPortion || 0) +
                         (formData.depositPortion || 0) +
                         (formData.otherPortion || 0);

    if (Math.abs(totalPortions - (formData.amount || 0)) > 0.01) {
      showError('Payment portions must equal the total amount');
      return;
    }

    try {
      setSaving(true);
      await propertyManagementService.createPayment(formData);
      success('Payment recorded successfully');
      navigate('/property-management/payments');
    } catch (err: any) {
      showError(err.response?.data?.error?.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof RentPayment, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAmountChange = (value: number) => {
    setFormData(prev => ({
      ...prev,
      amount: value,
      rentPortion: value,
      lateFeesPortion: 0,
      depositPortion: 0,
      otherPortion: 0,
    }));
  };

  const getTenantName = (lease: Lease) => {
    if (!lease.tenant) return 'Unknown Tenant';
    if (lease.tenant.isCompany) {
      return lease.tenant.companyName || 'Unknown Company';
    }
    return `${lease.tenant.firstName || ''} ${lease.tenant.lastName || ''}`.trim() || 'Unknown';
  };

  const formatCurrency = (value: number | undefined, currency = 'USD') => {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
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
          onClick={() => navigate('/property-management/payments')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Record Payment</h1>
          <p className="text-content-secondary">Record a new rent payment</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Lease Selection */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-accent-primary" />
            <h2 className="text-lg font-semibold text-content-primary">Lease Selection</h2>
          </div>
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">Select Lease *</label>
            <select
              className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
              value={formData.leaseId || ''}
              onChange={(e) => handleChange('leaseId', e.target.value)}
              required
            >
              <option value="">Select a lease</option>
              {leases.map(lease => (
                <option key={lease.id} value={lease.id}>
                  {lease.leaseCode} - {getTenantName(lease)} - {lease.property?.name || 'Unknown Property'}
                </option>
              ))}
            </select>
          </div>

          {selectedLease && (
            <div className="mt-4 p-4 bg-background-secondary rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-content-tertiary">Tenant</p>
                  <p className="font-medium text-content-primary">{getTenantName(selectedLease)}</p>
                </div>
                <div>
                  <p className="text-xs text-content-tertiary">Property</p>
                  <p className="font-medium text-content-primary">{selectedLease.property?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-content-tertiary">Monthly Rent</p>
                  <p className="font-medium text-status-success">{formatCurrency(selectedLease.rentAmount, selectedLease.currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-content-tertiary">Tenant Balance</p>
                  <p className={`font-medium ${(selectedLease.tenant?.currentBalance || 0) > 0 ? 'text-status-error' : 'text-status-success'}`}>
                    {formatCurrency(Math.abs(selectedLease.tenant?.currentBalance || 0), selectedLease.currency)}
                    {(selectedLease.tenant?.currentBalance || 0) > 0 ? ' Due' : ' Credit'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Payment Details */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-content-primary mb-4">Payment Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="Payment Date *"
              type="date"
              value={formData.paymentDate || ''}
              onChange={(e) => handleChange('paymentDate', e.target.value)}
              required
            />
            <Input
              label="Total Amount *"
              type="number"
              min="0"
              step="0.01"
              value={formData.amount || ''}
              onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
              required
            />
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Payment Method *</label>
              <select
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                value={formData.paymentMethod}
                onChange={(e) => handleChange('paymentMethod', e.target.value)}
                required
              >
                {Object.values(PaymentMethod).map(method => (
                  <option key={method} value={method}>{method.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <Input
              label="Reference Number"
              value={formData.referenceNumber || ''}
              onChange={(e) => handleChange('referenceNumber', e.target.value)}
              placeholder="e.g., Transaction ID, Check number"
            />
          </div>
        </Card>

        {/* Payment Allocation */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-content-primary mb-4">Payment Allocation</h2>
          <p className="text-sm text-content-secondary mb-4">
            Specify how the payment should be allocated. Total must equal the payment amount.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label="Rent Portion"
              type="number"
              min="0"
              step="0.01"
              value={formData.rentPortion || ''}
              onChange={(e) => handleChange('rentPortion', parseFloat(e.target.value) || 0)}
            />
            <Input
              label="Late Fees Portion"
              type="number"
              min="0"
              step="0.01"
              value={formData.lateFeesPortion || ''}
              onChange={(e) => handleChange('lateFeesPortion', parseFloat(e.target.value) || 0)}
            />
            <Input
              label="Deposit Portion"
              type="number"
              min="0"
              step="0.01"
              value={formData.depositPortion || ''}
              onChange={(e) => handleChange('depositPortion', parseFloat(e.target.value) || 0)}
            />
            <Input
              label="Other Portion"
              type="number"
              min="0"
              step="0.01"
              value={formData.otherPortion || ''}
              onChange={(e) => handleChange('otherPortion', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="mt-4 p-3 bg-background-secondary rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-content-secondary">Total Allocated:</span>
              <span className={`font-semibold ${
                Math.abs(((formData.rentPortion || 0) + (formData.lateFeesPortion || 0) + (formData.depositPortion || 0) + (formData.otherPortion || 0)) - (formData.amount || 0)) < 0.01
                  ? 'text-status-success'
                  : 'text-status-error'
              }`}>
                {formatCurrency((formData.rentPortion || 0) + (formData.lateFeesPortion || 0) + (formData.depositPortion || 0) + (formData.otherPortion || 0))}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-content-secondary">Payment Amount:</span>
              <span className="font-semibold text-content-primary">
                {formatCurrency(formData.amount || 0)}
              </span>
            </div>
          </div>
        </Card>

        {/* Notes */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-content-primary mb-4">Notes</h2>
          <textarea
            className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
            rows={3}
            value={formData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Any additional notes about this payment..."
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
            Record Payment
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/property-management/payments')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

export default PaymentFormPage;
