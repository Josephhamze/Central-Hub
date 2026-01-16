import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Building2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';
import propertyManagementService, {
  Tenant,
  TenantStatus,
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

export function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<{
    status?: TenantStatus;
    isCompany?: boolean;
  }>({});
  const [showFilters, setShowFilters] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    loadTenants();
  }, [pagination.page, filters]);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const response = await propertyManagementService.getTenants({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        ...filters,
      });
      setTenants(response?.items || []);
      setPagination(prev => ({
        ...prev,
        total: response?.pagination?.total ?? 0,
        totalPages: response?.pagination?.totalPages ?? 0,
      }));
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadTenants();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tenant?')) return;
    try {
      await propertyManagementService.deleteTenant(id);
      success('Tenant deleted successfully');
      loadTenants();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to delete tenant');
    }
  };

  const getTenantName = (tenant: Tenant) => {
    if (tenant.isCompany) {
      return tenant.companyName || 'Unknown Company';
    }
    return `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim() || 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Tenants</h1>
          <p className="text-content-secondary">Manage your tenant registry</p>
        </div>
        <Button
          variant="primary"
          onClick={() => window.location.href = '/property-management/tenants/new'}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Tenant
        </Button>
      </div>

      {/* Search & Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Search tenants..."
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
              <label className="block text-sm font-medium text-content-secondary mb-1">Status</label>
              <select
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                value={filters.status || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  status: e.target.value as TenantStatus || undefined,
                }))}
              >
                <option value="">All Statuses</option>
                {Object.values(TenantStatus).map(status => (
                  <option key={status} value={status}>{status.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Type</label>
              <select
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                value={filters.isCompany === undefined ? '' : filters.isCompany.toString()}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  isCompany: e.target.value === '' ? undefined : e.target.value === 'true',
                }))}
              >
                <option value="">All Types</option>
                <option value="false">Individual</option>
                <option value="true">Company</option>
              </select>
            </div>
          </div>
        )}
      </Card>

      {/* Tenants Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
        </div>
      ) : tenants.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="w-12 h-12 mx-auto text-content-tertiary mb-4" />
          <h3 className="text-lg font-medium text-content-primary mb-2">No tenants found</h3>
          <p className="text-content-secondary mb-4">Get started by adding your first tenant</p>
          <Button
            variant="primary"
            onClick={() => window.location.href = '/property-management/tenants/new'}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Tenant
          </Button>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tenants.map((tenant) => (
              <Card key={tenant.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-accent-primary/10 rounded-lg">
                        {tenant.isCompany ? (
                          <Building2 className="w-5 h-5 text-accent-primary" />
                        ) : (
                          <Users className="w-5 h-5 text-accent-primary" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-content-tertiary">{tenant.tenantCode}</p>
                        <h3 className="font-semibold text-content-primary">{getTenantName(tenant)}</h3>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(tenant.status)}`}>
                      {tenant.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {tenant.email && (
                      <div className="flex items-center gap-2 text-sm text-content-secondary">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{tenant.email}</span>
                      </div>
                    )}
                    {tenant.phone && (
                      <div className="flex items-center gap-2 text-sm text-content-secondary">
                        <Phone className="w-4 h-4" />
                        {tenant.phone}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-content-tertiary">Active Leases</p>
                      <p className="font-semibold text-content-primary">{tenant._count?.leases || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-content-tertiary">Balance</p>
                      <p className={`font-semibold ${tenant.currentBalance > 0 ? 'text-status-error' : tenant.currentBalance < 0 ? 'text-status-success' : 'text-content-primary'}`}>
                        {formatCurrency(Math.abs(tenant.currentBalance))}
                        {tenant.currentBalance > 0 && ' Due'}
                        {tenant.currentBalance < 0 && ' Credit'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-border-default">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.location.href = `/property-management/tenants/${tenant.id}`}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => window.location.href = `/property-management/tenants/${tenant.id}/edit`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDelete(tenant.id)}
                    >
                      <Trash2 className="w-4 h-4 text-status-error" />
                    </Button>
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
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} tenants
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

export default TenantsPage;
