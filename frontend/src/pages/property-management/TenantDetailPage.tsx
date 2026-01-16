import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Users,
  Building2,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';
import propertyManagementService, {
  Tenant,
  TenantStatus,
  TenantLedgerEntry,
} from '@/services/property-management';

const formatCurrency = (value: number | undefined, currency = 'USD') => {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getStatusColor = (status: TenantStatus) => {
  const colors: Record<TenantStatus, string> = {
    [TenantStatus.ACTIVE]: 'bg-status-success/10 text-status-success',
    [TenantStatus.LATE]: 'bg-status-warning/10 text-status-warning',
    [TenantStatus.VACATED]: 'bg-content-tertiary/10 text-content-tertiary',
    [TenantStatus.BLACKLISTED]: 'bg-status-error/10 text-status-error',
    [TenantStatus.PENDING]: 'bg-accent-primary/10 text-accent-primary',
  };
  return colors[status] || colors[TenantStatus.PENDING];
};

export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [ledger, setLedger] = useState<TenantLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLedger, setLoadingLedger] = useState(false);

  useEffect(() => {
    if (id) {
      loadTenant();
      loadLedger();
    }
  }, [id]);

  const loadTenant = async () => {
    try {
      setLoading(true);
      const data = await propertyManagementService.getTenant(id!);
      setTenant(data);
    } catch (err: any) {
      showError(err.response?.data?.error?.message || 'Failed to load tenant');
      navigate('/property-management/tenants');
    } finally {
      setLoading(false);
    }
  };

  const loadLedger = async () => {
    try {
      setLoadingLedger(true);
      const data = await propertyManagementService.getTenantLedger(id!);
      setLedger(data || []);
    } catch (err: any) {
      console.error('Failed to load ledger:', err);
    } finally {
      setLoadingLedger(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
      return;
    }
    try {
      await propertyManagementService.deleteTenant(id!);
      success('Tenant deleted successfully');
      navigate('/property-management/tenants');
    } catch (err: any) {
      showError(err.response?.data?.error?.message || 'Failed to delete tenant');
    }
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

  if (!tenant) {
    return (
      <Card className="p-12 text-center">
        <Users className="w-12 h-12 mx-auto text-content-tertiary mb-4" />
        <h3 className="text-lg font-medium text-content-primary mb-2">Tenant not found</h3>
        <Button onClick={() => navigate('/property-management/tenants')}>
          Back to Tenants
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/property-management/tenants')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent-primary/10 rounded-lg">
              {tenant.isCompany ? (
                <Building2 className="w-6 h-6 text-accent-primary" />
              ) : (
                <Users className="w-6 h-6 text-accent-primary" />
              )}
            </div>
            <div>
              <p className="text-sm text-content-tertiary">{tenant.tenantCode}</p>
              <h1 className="text-2xl font-bold text-content-primary">{getTenantName(tenant)}</h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => navigate(`/property-management/tenants/${id}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="secondary" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 text-status-error" />
          </Button>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex items-center gap-3">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tenant.status)}`}>
          {tenant.status.replace('_', ' ')}
        </span>
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-accent-primary/10 text-accent-primary">
          {tenant.isCompany ? 'Company' : 'Individual'}
        </span>
      </div>

      {/* Blacklist Warning */}
      {tenant.status === TenantStatus.BLACKLISTED && tenant.blacklistReason && (
        <Card className="p-4 bg-status-error/10 border border-status-error/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-status-error flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-status-error">Blacklisted</h3>
              <p className="text-sm text-content-secondary">{tenant.blacklistReason}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-primary/10 rounded-lg">
              <FileText className="w-5 h-5 text-accent-primary" />
            </div>
            <div>
              <p className="text-sm text-content-tertiary">Active Leases</p>
              <p className="text-xl font-semibold text-content-primary">{tenant._count?.leases || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-primary/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-accent-primary" />
            </div>
            <div>
              <p className="text-sm text-content-tertiary">Total Payments</p>
              <p className="text-xl font-semibold text-content-primary">{tenant._count?.rentPayments || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 col-span-2">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${tenant.currentBalance > 0 ? 'bg-status-error/10' : tenant.currentBalance < 0 ? 'bg-status-success/10' : 'bg-content-tertiary/10'}`}>
              <DollarSign className={`w-5 h-5 ${tenant.currentBalance > 0 ? 'text-status-error' : tenant.currentBalance < 0 ? 'text-status-success' : 'text-content-tertiary'}`} />
            </div>
            <div>
              <p className="text-sm text-content-tertiary">Current Balance</p>
              <p className={`text-xl font-semibold ${tenant.currentBalance > 0 ? 'text-status-error' : tenant.currentBalance < 0 ? 'text-status-success' : 'text-content-primary'}`}>
                {formatCurrency(Math.abs(tenant.currentBalance))}
                {tenant.currentBalance > 0 && ' Due'}
                {tenant.currentBalance < 0 && ' Credit'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-accent-primary" />
            <h2 className="text-lg font-semibold text-content-primary">Contact Information</h2>
          </div>
          <div className="space-y-3">
            {tenant.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-content-tertiary" />
                <a href={`mailto:${tenant.email}`} className="text-accent-primary hover:underline">
                  {tenant.email}
                </a>
              </div>
            )}
            {tenant.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-content-tertiary" />
                <a href={`tel:${tenant.phone}`} className="text-content-primary hover:text-accent-primary">
                  {tenant.phone}
                </a>
              </div>
            )}
            {tenant.alternatePhone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-content-tertiary" />
                <a href={`tel:${tenant.alternatePhone}`} className="text-content-primary hover:text-accent-primary">
                  {tenant.alternatePhone} (Alternate)
                </a>
              </div>
            )}
            {tenant.emergencyContactName && (
              <div className="mt-4 pt-4 border-t border-border-default">
                <p className="text-sm text-content-tertiary mb-2">Emergency Contact</p>
                <p className="text-content-primary">{tenant.emergencyContactName}</p>
                {tenant.emergencyContactPhone && (
                  <p className="text-content-secondary">{tenant.emergencyContactPhone}</p>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Address */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-accent-primary" />
            <h2 className="text-lg font-semibold text-content-primary">Address</h2>
          </div>
          {tenant.addressLine1 ? (
            <div className="space-y-1">
              <p className="text-content-primary">{tenant.addressLine1}</p>
              {tenant.addressLine2 && <p className="text-content-primary">{tenant.addressLine2}</p>}
              <p className="text-content-secondary">
                {[tenant.city, tenant.state, tenant.postalCode].filter(Boolean).join(', ')}
              </p>
              {tenant.country && <p className="text-content-secondary">{tenant.country}</p>}
            </div>
          ) : (
            <p className="text-content-tertiary">No address provided</p>
          )}
        </Card>

        {/* Identification */}
        {!tenant.isCompany && (tenant.idType || tenant.idNumber) && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-content-primary mb-4">Identification</h2>
            <div className="grid grid-cols-2 gap-4">
              {tenant.idType && (
                <div>
                  <p className="text-sm text-content-tertiary">ID Type</p>
                  <p className="text-content-primary">{tenant.idType.replace('_', ' ')}</p>
                </div>
              )}
              {tenant.idNumber && (
                <div>
                  <p className="text-sm text-content-tertiary">ID Number</p>
                  <p className="text-content-primary">{tenant.idNumber}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Company Details */}
        {tenant.isCompany && tenant.taxId && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-content-primary mb-4">Company Details</h2>
            <div>
              <p className="text-sm text-content-tertiary">Tax ID</p>
              <p className="text-content-primary">{tenant.taxId}</p>
            </div>
          </Card>
        )}

        {/* Notes */}
        {tenant.notes && (
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-content-primary mb-4">Notes</h2>
            <p className="text-content-secondary whitespace-pre-wrap">{tenant.notes}</p>
          </Card>
        )}
      </div>

      {/* Tenant Ledger */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-content-primary mb-4">Transaction Ledger</h2>
        {loadingLedger ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-primary"></div>
          </div>
        ) : ledger.length === 0 ? (
          <p className="text-content-tertiary text-center py-8">No transactions found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="text-left py-2 text-sm font-medium text-content-tertiary">Date</th>
                  <th className="text-left py-2 text-sm font-medium text-content-tertiary">Type</th>
                  <th className="text-left py-2 text-sm font-medium text-content-tertiary">Description</th>
                  <th className="text-right py-2 text-sm font-medium text-content-tertiary">Amount</th>
                  <th className="text-right py-2 text-sm font-medium text-content-tertiary">Balance</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((entry, index) => (
                  <tr key={index} className="border-b border-border-default last:border-0">
                    <td className="py-3 text-sm text-content-primary">{formatDate(entry.date)}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        entry.type === 'PAYMENT' ? 'bg-status-success/10 text-status-success' :
                        entry.type === 'CHARGE' ? 'bg-status-error/10 text-status-error' :
                        entry.type === 'LATE_FEE' ? 'bg-status-warning/10 text-status-warning' :
                        'bg-accent-primary/10 text-accent-primary'
                      }`}>
                        {entry.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-content-secondary">{entry.description}</td>
                    <td className={`py-3 text-sm text-right ${
                      entry.type === 'PAYMENT' ? 'text-status-success' : 'text-status-error'
                    }`}>
                      {entry.type === 'PAYMENT' ? '-' : '+'}{formatCurrency(Math.abs(entry.amount))}
                    </td>
                    <td className={`py-3 text-sm text-right font-medium ${
                      entry.balance > 0 ? 'text-status-error' : entry.balance < 0 ? 'text-status-success' : 'text-content-primary'
                    }`}>
                      {formatCurrency(Math.abs(entry.balance))}
                      {entry.balance > 0 && ' Due'}
                      {entry.balance < 0 && ' CR'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Timestamps */}
      <Card className="p-4">
        <div className="flex items-center justify-between text-sm text-content-tertiary">
          <span>Created: {new Date(tenant.createdAt).toLocaleString()}</span>
          <span>Last Updated: {new Date(tenant.updatedAt).toLocaleString()}</span>
        </div>
      </Card>
    </div>
  );
}

export default TenantDetailPage;
