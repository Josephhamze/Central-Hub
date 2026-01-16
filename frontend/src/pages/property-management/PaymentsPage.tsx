import { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  RotateCcw,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';
import propertyManagementService, {
  RentPayment,
  RentPaymentStatus,
  PaymentMethod,
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

const getStatusColor = (status: RentPaymentStatus) => {
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

const getMethodIcon = (method: PaymentMethod) => {
  switch (method) {
    case PaymentMethod.BANK_TRANSFER:
      return 'Bank';
    case PaymentMethod.CASH:
      return 'Cash';
    case PaymentMethod.CHECK:
      return 'Check';
    case PaymentMethod.CREDIT_CARD:
      return 'Card';
    case PaymentMethod.MOBILE_PAYMENT:
      return 'Mobile';
    default:
      return 'Other';
  }
};

export function PaymentsPage() {
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<{
    status?: RentPaymentStatus;
    paymentMethod?: PaymentMethod;
    startDate?: string;
    endDate?: string;
  }>({});
  const [showFilters, setShowFilters] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    loadPayments();
  }, [pagination.page, filters]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await propertyManagementService.getPayments({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        ...filters,
      });
      setPayments(response?.items || []);
      setPagination(prev => ({
        ...prev,
        total: response?.pagination?.total ?? 0,
        totalPages: response?.pagination?.totalPages ?? 0,
      }));
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadPayments();
  };

  const handleRefund = async (id: string) => {
    const reason = prompt('Please enter the refund reason:');
    if (!reason) return;
    try {
      await propertyManagementService.refundPayment(id, reason);
      success('Payment refunded successfully');
      loadPayments();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to refund payment');
    }
  };

  const getTenantName = (payment: RentPayment) => {
    if (!payment.tenant) return 'Unknown Tenant';
    if (payment.tenant.isCompany) {
      return payment.tenant.companyName || 'Unknown Company';
    }
    return `${payment.tenant.firstName || ''} ${payment.tenant.lastName || ''}`.trim() || 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Payments</h1>
          <p className="text-content-secondary">Track and manage rent payments</p>
        </div>
        <Button
          variant="primary"
          onClick={() => window.location.href = '/property-management/payments/new'}
        >
          <Plus className="w-4 h-4 mr-2" />
          Record Payment
        </Button>
      </div>

      {/* Search & Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Search payments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button variant="secondary" onClick={handleSearch}>
              <Search className="w-4 h-4" />
            </Button>
          </div>
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {Object.keys(filters).length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-accent-primary text-white rounded-full text-xs">
                {Object.keys(filters).length}
              </span>
            )}
          </Button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border-default grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Status</label>
              <select
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                value={filters.status || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  status: e.target.value as RentPaymentStatus || undefined,
                }))}
              >
                <option value="">All Statuses</option>
                {Object.values(RentPaymentStatus).map(status => (
                  <option key={status} value={status}>{status.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Payment Method</label>
              <select
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                value={filters.paymentMethod || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  paymentMethod: e.target.value as PaymentMethod || undefined,
                }))}
              >
                <option value="">All Methods</option>
                {Object.values(PaymentMethod).map(method => (
                  <option key={method} value={method}>{method.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">From Date</label>
              <Input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  startDate: e.target.value || undefined,
                }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">To Date</label>
              <Input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  endDate: e.target.value || undefined,
                }))}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Payments List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
        </div>
      ) : payments.length === 0 ? (
        <Card className="p-12 text-center">
          <DollarSign className="w-12 h-12 mx-auto text-content-tertiary mb-4" />
          <h3 className="text-lg font-medium text-content-primary mb-2">No payments found</h3>
          <p className="text-content-secondary mb-4">Record your first payment to get started</p>
          <Button
            variant="primary"
            onClick={() => window.location.href = '/property-management/payments/new'}
          >
            <Plus className="w-4 h-4 mr-2" />
            Record Payment
          </Button>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {payments.map((payment) => (
              <Card key={payment.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${payment.isRefund ? 'bg-status-error/10' : 'bg-status-success/10'}`}>
                      <DollarSign className={`w-5 h-5 ${payment.isRefund ? 'text-status-error' : 'text-status-success'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs text-content-tertiary">{payment.paymentCode}</p>
                        <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(payment.status)}`}>
                          {payment.status.replace('_', ' ')}
                        </span>
                        {payment.isRefund && (
                          <span className="px-2 py-0.5 rounded text-xs bg-status-error/10 text-status-error">
                            Refund
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-sm text-content-secondary">
                          <Users className="w-4 h-4" />
                          {getTenantName(payment)}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-content-secondary">
                          <Calendar className="w-4 h-4" />
                          {formatDate(payment.paymentDate)}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-content-secondary">
                          <span className="px-2 py-0.5 bg-content-tertiary/10 rounded text-xs">
                            {getMethodIcon(payment.paymentMethod)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-content-tertiary">Total</p>
                        <p className={`font-semibold ${payment.isRefund ? 'text-status-error' : 'text-status-success'}`}>
                          {payment.isRefund ? '-' : ''}{formatCurrency(payment.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-content-tertiary">Rent</p>
                        <p className="font-semibold text-content-primary">
                          {formatCurrency(payment.rentPortion)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-content-tertiary">Other</p>
                        <p className="font-semibold text-content-primary">
                          {formatCurrency((payment.lateFeesPortion || 0) + (payment.depositPortion || 0) + (payment.otherPortion || 0))}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => window.location.href = `/property-management/leases/${payment.leaseId}`}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Lease
                      </Button>
                      {payment.status === RentPaymentStatus.PAID && !payment.isRefund && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleRefund(payment.id)}
                        >
                          <RotateCcw className="w-4 h-4 text-status-error" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {payment.referenceNumber && (
                  <div className="mt-3 pt-3 border-t border-border-default">
                    <p className="text-sm text-content-tertiary">
                      Reference: <span className="text-content-primary">{payment.referenceNumber}</span>
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-content-secondary">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} payments
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-content-primary">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default PaymentsPage;
