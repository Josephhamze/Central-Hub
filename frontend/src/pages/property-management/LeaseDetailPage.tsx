import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  FileText,
  Users,
  Building2,
  DollarSign,
  Calendar,
  AlertTriangle,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';
import propertyManagementService, {
  Lease,
  LeaseType,
  RentSchedule,
  RentPaymentStatus,
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

const formatDate = (date: string | undefined) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getLeaseTypeColor = (type: LeaseType) => {
  const colors: Record<LeaseType, string> = {
    [LeaseType.FIXED]: 'bg-accent-primary/10 text-accent-primary',
    [LeaseType.MONTH_TO_MONTH]: 'bg-status-warning/10 text-status-warning',
    [LeaseType.YEARLY]: 'bg-status-success/10 text-status-success',
  };
  return colors[type] || colors[LeaseType.FIXED];
};

const getScheduleStatusColor = (status: RentPaymentStatus) => {
  const colors: Record<RentPaymentStatus, string> = {
    [RentPaymentStatus.PAID]: 'bg-status-success/10 text-status-success',
    [RentPaymentStatus.PARTIAL]: 'bg-status-warning/10 text-status-warning',
    [RentPaymentStatus.PENDING]: 'bg-accent-primary/10 text-accent-primary',
    [RentPaymentStatus.OVERDUE]: 'bg-status-error/10 text-status-error',
    [RentPaymentStatus.WAIVED]: 'bg-content-tertiary/10 text-content-tertiary',
    [RentPaymentStatus.REFUNDED]: 'bg-content-tertiary/10 text-content-tertiary',
  };
  return colors[status] || colors[RentPaymentStatus.PENDING];
};

export function LeaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [lease, setLease] = useState<Lease | null>(null);
  const [schedules, setSchedules] = useState<RentSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewData, setRenewData] = useState({ newEndDate: '', newRentAmount: '' });

  useEffect(() => {
    if (id) {
      loadLease();
      loadSchedules();
    }
  }, [id]);

  const loadLease = async () => {
    try {
      setLoading(true);
      const data = await propertyManagementService.getLease(id!);
      setLease(data);
    } catch (err: any) {
      showError(err.response?.data?.error?.message || 'Failed to load lease');
      navigate('/property-management/leases');
    } finally {
      setLoading(false);
    }
  };

  const loadSchedules = async () => {
    try {
      setLoadingSchedules(true);
      const response = await propertyManagementService.getRentSchedules(id!, { limit: 24 });
      setSchedules(response?.items || []);
    } catch (err: any) {
      console.error('Failed to load schedules:', err);
    } finally {
      setLoadingSchedules(false);
    }
  };

  const handleTerminate = async () => {
    const reason = prompt('Please enter the termination reason:');
    if (!reason) return;
    try {
      await propertyManagementService.terminateLease(id!, reason);
      success('Lease terminated successfully');
      loadLease();
    } catch (err: any) {
      showError(err.response?.data?.error?.message || 'Failed to terminate lease');
    }
  };

  const handleRenew = async () => {
    if (!renewData.newEndDate) {
      showError('Please enter a new end date');
      return;
    }
    try {
      await propertyManagementService.renewLease(
        id!,
        renewData.newEndDate,
        renewData.newRentAmount ? parseFloat(renewData.newRentAmount) : undefined
      );
      success('Lease renewed successfully');
      setShowRenewModal(false);
      loadLease();
    } catch (err: any) {
      showError(err.response?.data?.error?.message || 'Failed to renew lease');
    }
  };

  const getTenantName = (lease: Lease) => {
    if (!lease.tenant) return 'Unknown Tenant';
    if (lease.tenant.isCompany) {
      return lease.tenant.companyName || 'Unknown Company';
    }
    return `${lease.tenant.firstName || ''} ${lease.tenant.lastName || ''}`.trim() || 'Unknown';
  };

  const getDaysUntilExpiry = (lease: Lease) => {
    if (!lease.endDate || !lease.isActive) return null;
    const endDate = new Date(lease.endDate);
    const today = new Date();
    return Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  if (!lease) {
    return (
      <Card className="p-12 text-center">
        <FileText className="w-12 h-12 mx-auto text-content-tertiary mb-4" />
        <h3 className="text-lg font-medium text-content-primary mb-2">Lease not found</h3>
        <Button onClick={() => navigate('/property-management/leases')}>
          Back to Leases
        </Button>
      </Card>
    );
  }

  const daysUntilExpiry = getDaysUntilExpiry(lease);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/property-management/leases')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent-primary/10 rounded-lg">
              <FileText className="w-6 h-6 text-accent-primary" />
            </div>
            <div>
              <p className="text-sm text-content-tertiary">{lease.leaseCode}</p>
              <h1 className="text-2xl font-bold text-content-primary">Lease Agreement</h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lease.isActive && (
            <>
              <Button
                variant="secondary"
                onClick={() => setShowRenewModal(true)}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Renew
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate(`/property-management/leases/${id}/edit`)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant="secondary" onClick={handleTerminate}>
                <XCircle className="w-4 h-4 text-status-error mr-2" />
                Terminate
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex items-center gap-3">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${lease.isActive ? 'bg-status-success/10 text-status-success' : 'bg-content-tertiary/10 text-content-tertiary'}`}>
          {lease.isActive ? 'Active' : 'Terminated'}
        </span>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLeaseTypeColor(lease.leaseType)}`}>
          {lease.leaseType.replace('_', ' ')}
        </span>
        {daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 30 && (
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-status-warning/10 text-status-warning">
            Expires in {daysUntilExpiry} days
          </span>
        )}
      </div>

      {/* Termination Warning */}
      {!lease.isActive && lease.terminationReason && (
        <Card className="p-4 bg-content-tertiary/10 border border-content-tertiary/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-content-tertiary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-content-primary">Lease Terminated</h3>
              <p className="text-sm text-content-secondary">
                Terminated on {formatDate(lease.terminatedDate)}: {lease.terminationReason}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-status-success/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-status-success" />
            </div>
            <div>
              <p className="text-sm text-content-tertiary">Monthly Rent</p>
              <p className="text-xl font-semibold text-content-primary">
                {formatCurrency(lease.rentAmount, lease.currency)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-primary/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-accent-primary" />
            </div>
            <div>
              <p className="text-sm text-content-tertiary">Deposit</p>
              <p className="text-xl font-semibold text-content-primary">
                {formatCurrency(lease.depositAmount, lease.currency)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-primary/10 rounded-lg">
              <Calendar className="w-5 h-5 text-accent-primary" />
            </div>
            <div>
              <p className="text-sm text-content-tertiary">Start Date</p>
              <p className="text-xl font-semibold text-content-primary">
                {formatDate(lease.startDate)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-primary/10 rounded-lg">
              <Calendar className="w-5 h-5 text-accent-primary" />
            </div>
            <div>
              <p className="text-sm text-content-tertiary">End Date</p>
              <p className="text-xl font-semibold text-content-primary">
                {formatDate(lease.endDate)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tenant Information */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-accent-primary" />
            <h2 className="text-lg font-semibold text-content-primary">Tenant</h2>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-content-tertiary">Name</p>
              <p className="text-content-primary font-medium">{getTenantName(lease)}</p>
            </div>
            {lease.tenant?.email && (
              <div>
                <p className="text-sm text-content-tertiary">Email</p>
                <p className="text-content-primary">{lease.tenant.email}</p>
              </div>
            )}
            {lease.tenant?.phone && (
              <div>
                <p className="text-sm text-content-tertiary">Phone</p>
                <p className="text-content-primary">{lease.tenant.phone}</p>
              </div>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/property-management/tenants/${lease.tenantId}`)}
            >
              View Tenant Profile
            </Button>
          </div>
        </Card>

        {/* Property Information */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-accent-primary" />
            <h2 className="text-lg font-semibold text-content-primary">Property</h2>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-content-tertiary">Property</p>
              <p className="text-content-primary font-medium">
                {lease.property?.name || 'Unknown Property'}
              </p>
            </div>
            {lease.unit && (
              <div>
                <p className="text-sm text-content-tertiary">Unit</p>
                <p className="text-content-primary">{lease.unit.name}</p>
              </div>
            )}
            {lease.property?.addressLine1 && (
              <div>
                <p className="text-sm text-content-tertiary">Address</p>
                <p className="text-content-primary">
                  {lease.property.addressLine1}, {lease.property.city}
                </p>
              </div>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/property-management/properties/${lease.propertyId}`)}
            >
              View Property
            </Button>
          </div>
        </Card>

        {/* Payment Terms */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-accent-primary" />
            <h2 className="text-lg font-semibold text-content-primary">Payment Terms</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-content-tertiary">Payment Frequency</p>
              <p className="text-content-primary">{lease.paymentFrequency.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-sm text-content-tertiary">Due Day</p>
              <p className="text-content-primary">{lease.paymentDueDay}th of each period</p>
            </div>
            <div>
              <p className="text-sm text-content-tertiary">Grace Period</p>
              <p className="text-content-primary">{lease.gracePeriodDays} days</p>
            </div>
            {lease.preferredPaymentMethod && (
              <div>
                <p className="text-sm text-content-tertiary">Preferred Method</p>
                <p className="text-content-primary">{lease.preferredPaymentMethod.replace('_', ' ')}</p>
              </div>
            )}
            {lease.lateFeeAmount && (
              <div>
                <p className="text-sm text-content-tertiary">Late Fee (Fixed)</p>
                <p className="text-content-primary">{formatCurrency(lease.lateFeeAmount, lease.currency)}</p>
              </div>
            )}
            {lease.lateFeePercentage && (
              <div>
                <p className="text-sm text-content-tertiary">Late Fee (%)</p>
                <p className="text-content-primary">{lease.lateFeePercentage}%</p>
              </div>
            )}
          </div>
        </Card>

        {/* Escalation */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-accent-primary" />
            <h2 className="text-lg font-semibold text-content-primary">Rent Escalation</h2>
          </div>
          {lease.hasEscalation ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-content-tertiary">Escalation Rate</p>
                <p className="text-content-primary">{lease.escalationPct}% per year</p>
              </div>
              {lease.escalationDate && (
                <div>
                  <p className="text-sm text-content-tertiary">Escalation Date</p>
                  <p className="text-content-primary">{formatDate(lease.escalationDate)}</p>
                </div>
              )}
              {lease.nextEscalationDate && (
                <div>
                  <p className="text-sm text-content-tertiary">Next Escalation</p>
                  <p className="text-content-primary">{formatDate(lease.nextEscalationDate)}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-content-tertiary">No escalation configured for this lease</p>
          )}
        </Card>

        {/* Special Terms */}
        {lease.specialTerms && (
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-content-primary mb-4">Special Terms</h2>
            <p className="text-content-secondary whitespace-pre-wrap">{lease.specialTerms}</p>
          </Card>
        )}

        {/* Notes */}
        {lease.notes && (
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-content-primary mb-4">Notes</h2>
            <p className="text-content-secondary whitespace-pre-wrap">{lease.notes}</p>
          </Card>
        )}
      </div>

      {/* Rent Schedule */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-content-primary mb-4">Rent Schedule</h2>
        {loadingSchedules ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-primary"></div>
          </div>
        ) : schedules.length === 0 ? (
          <p className="text-content-tertiary text-center py-8">No rent schedules found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="text-left py-2 text-sm font-medium text-content-tertiary">Period</th>
                  <th className="text-left py-2 text-sm font-medium text-content-tertiary">Due Date</th>
                  <th className="text-right py-2 text-sm font-medium text-content-tertiary">Amount Due</th>
                  <th className="text-right py-2 text-sm font-medium text-content-tertiary">Paid</th>
                  <th className="text-right py-2 text-sm font-medium text-content-tertiary">Balance</th>
                  <th className="text-center py-2 text-sm font-medium text-content-tertiary">Status</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule) => (
                  <tr key={schedule.id} className="border-b border-border-default last:border-0">
                    <td className="py-3 text-sm text-content-primary">
                      {formatDate(schedule.periodStart)} - {formatDate(schedule.periodEnd)}
                    </td>
                    <td className="py-3 text-sm text-content-primary">{formatDate(schedule.dueDate)}</td>
                    <td className="py-3 text-sm text-right text-content-primary">
                      {formatCurrency(schedule.totalDue, lease.currency)}
                    </td>
                    <td className="py-3 text-sm text-right text-status-success">
                      {formatCurrency(schedule.amountPaid, lease.currency)}
                    </td>
                    <td className={`py-3 text-sm text-right font-medium ${schedule.balance > 0 ? 'text-status-error' : 'text-content-primary'}`}>
                      {formatCurrency(schedule.balance, lease.currency)}
                    </td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${getScheduleStatusColor(schedule.status)}`}>
                        {schedule.status.replace('_', ' ')}
                      </span>
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
          <span>Created: {new Date(lease.createdAt).toLocaleString()}</span>
          <span>Last Updated: {new Date(lease.updatedAt).toLocaleString()}</span>
        </div>
      </Card>

      {/* Renew Modal */}
      {showRenewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-content-primary mb-4">Renew Lease</h2>
            <div className="space-y-4">
              <Input
                label="New End Date *"
                type="date"
                value={renewData.newEndDate}
                onChange={(e) => setRenewData(prev => ({ ...prev, newEndDate: e.target.value }))}
                required
              />
              <Input
                label="New Rent Amount (Optional)"
                type="number"
                min="0"
                step="0.01"
                value={renewData.newRentAmount}
                onChange={(e) => setRenewData(prev => ({ ...prev, newRentAmount: e.target.value }))}
                placeholder={`Current: ${formatCurrency(lease.rentAmount, lease.currency)}`}
              />
              <div className="flex items-center gap-4">
                <Button variant="primary" onClick={handleRenew}>
                  Renew Lease
                </Button>
                <Button variant="secondary" onClick={() => setShowRenewModal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default LeaseDetailPage;
