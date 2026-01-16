import { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Building2,
  Users,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';
import propertyManagementService, {
  Lease,
  LeaseType,
} from '@/services/property-management';

const formatCurrency = (value: number | undefined, currency = 'USD') => {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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

const getStatusColor = (isActive: boolean) => {
  return isActive
    ? 'bg-status-success/10 text-status-success'
    : 'bg-content-tertiary/10 text-content-tertiary';
};

export function LeasesPage() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<{
    leaseType?: LeaseType;
    isActive?: boolean;
    propertyId?: string;
  }>({});
  const [showFilters, setShowFilters] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    loadLeases();
  }, [pagination.page, filters]);

  const loadLeases = async () => {
    try {
      setLoading(true);
      const response = await propertyManagementService.getLeases({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        ...filters,
      });
      setLeases(response?.items || []);
      setPagination(prev => ({
        ...prev,
        total: response?.pagination?.total ?? 0,
        totalPages: response?.pagination?.totalPages ?? 0,
      }));
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to load leases');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadLeases();
  };

  const handleTerminate = async (id: string) => {
    const reason = prompt('Please enter the termination reason:');
    if (!reason) return;
    try {
      await propertyManagementService.terminateLease(id, reason);
      success('Lease terminated successfully');
      loadLeases();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to terminate lease');
    }
  };

  const getTenantName = (lease: Lease) => {
    if (!lease.tenant) return 'Unknown Tenant';
    if (lease.tenant.isCompany) {
      return lease.tenant.companyName || 'Unknown Company';
    }
    return `${lease.tenant.firstName || ''} ${lease.tenant.lastName || ''}`.trim() || 'Unknown';
  };

  const isLeaseExpiringSoon = (lease: Lease) => {
    if (!lease.endDate || !lease.isActive) return false;
    const endDate = new Date(lease.endDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Leases</h1>
          <p className="text-content-secondary">Manage lease agreements</p>
        </div>
        <Button
          variant="primary"
          onClick={() => window.location.href = '/property-management/leases/new'}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Lease
        </Button>
      </div>

      {/* Search & Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Search leases..."
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
          <div className="mt-4 pt-4 border-t border-border-default grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Lease Type</label>
              <select
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                value={filters.leaseType || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  leaseType: e.target.value as LeaseType || undefined,
                }))}
              >
                <option value="">All Types</option>
                {Object.values(LeaseType).map(type => (
                  <option key={type} value={type}>{type.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Status</label>
              <select
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                value={filters.isActive === undefined ? '' : filters.isActive.toString()}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  isActive: e.target.value === '' ? undefined : e.target.value === 'true',
                }))}
              >
                <option value="">All</option>
                <option value="true">Active</option>
                <option value="false">Terminated</option>
              </select>
            </div>
          </div>
        )}
      </Card>

      {/* Leases List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
        </div>
      ) : leases.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-content-tertiary mb-4" />
          <h3 className="text-lg font-medium text-content-primary mb-2">No leases found</h3>
          <p className="text-content-secondary mb-4">Get started by creating your first lease agreement</p>
          <Button
            variant="primary"
            onClick={() => window.location.href = '/property-management/leases/new'}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Lease
          </Button>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {leases.map((lease) => (
              <Card key={lease.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-accent-primary/10 rounded-lg">
                      <FileText className="w-5 h-5 text-accent-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs text-content-tertiary">{lease.leaseCode}</p>
                        <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(lease.isActive)}`}>
                          {lease.isActive ? 'Active' : 'Terminated'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${getLeaseTypeColor(lease.leaseType)}`}>
                          {lease.leaseType.replace('_', ' ')}
                        </span>
                        {isLeaseExpiringSoon(lease) && (
                          <span className="px-2 py-0.5 rounded text-xs bg-status-warning/10 text-status-warning">
                            Expiring Soon
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-sm text-content-secondary">
                          <Users className="w-4 h-4" />
                          {getTenantName(lease)}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-content-secondary">
                          <Building2 className="w-4 h-4" />
                          {lease.property?.name || 'Unknown Property'}
                          {lease.unit && ` - ${lease.unit.name}`}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-content-tertiary">Rent</p>
                        <p className="font-semibold text-content-primary">
                          {formatCurrency(lease.rentAmount, lease.currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-content-tertiary">Start</p>
                        <p className="font-semibold text-content-primary">
                          {formatDate(lease.startDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-content-tertiary">End</p>
                        <p className="font-semibold text-content-primary">
                          {formatDate(lease.endDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => window.location.href = `/property-management/leases/${lease.id}`}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      {lease.isActive && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => window.location.href = `/property-management/leases/${lease.id}/edit`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleTerminate(lease.id)}
                          >
                            <Trash2 className="w-4 h-4 text-status-error" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-content-secondary">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} leases
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

export default LeasesPage;
