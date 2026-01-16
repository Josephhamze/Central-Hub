import { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  MapPin,
  Home,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';
import propertyManagementService, {
  Property,
  PropertyType,
  PropertyStatus,
  PropertyHealthStatus,
} from '@/services/property-management';

const formatCurrency = (value: number | undefined, currency = 'USD') => {
  if (value === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const getStatusColor = (status: PropertyStatus) => {
  const colors: Record<PropertyStatus, string> = {
    [PropertyStatus.OCCUPIED]: 'bg-status-success/10 text-status-success',
    [PropertyStatus.VACANT]: 'bg-status-warning/10 text-status-warning',
    [PropertyStatus.UNDER_MAINTENANCE]: 'bg-status-error/10 text-status-error',
    [PropertyStatus.LISTED]: 'bg-accent-primary/10 text-accent-primary',
    [PropertyStatus.INACTIVE]: 'bg-content-tertiary/10 text-content-tertiary',
  };
  return colors[status] || colors[PropertyStatus.INACTIVE];
};

const getHealthColor = (status?: PropertyHealthStatus) => {
  if (!status) return 'bg-content-tertiary/10 text-content-tertiary';
  const colors: Record<PropertyHealthStatus, string> = {
    [PropertyHealthStatus.HEALTHY]: 'bg-status-success/10 text-status-success',
    [PropertyHealthStatus.AT_RISK]: 'bg-status-warning/10 text-status-warning',
    [PropertyHealthStatus.UNDERPERFORMING]: 'bg-status-error/10 text-status-error',
    [PropertyHealthStatus.NON_PERFORMING]: 'bg-status-error/10 text-status-error',
  };
  return colors[status];
};

const getTypeIcon = (type: PropertyType) => {
  switch (type) {
    case PropertyType.RESIDENTIAL:
      return Home;
    case PropertyType.COMMERCIAL:
      return Building2;
    default:
      return Building2;
  }
};

export function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<{
    propertyType?: PropertyType;
    status?: PropertyStatus;
    healthStatus?: PropertyHealthStatus;
  }>({});
  const [showFilters, setShowFilters] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    loadProperties();
  }, [pagination.page, filters]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const response = await propertyManagementService.getProperties({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        ...filters,
      });
      setProperties(response.items);
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total,
        totalPages: response.pagination.totalPages,
      }));
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadProperties();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;
    try {
      await propertyManagementService.deleteProperty(id);
      success('Property deleted successfully');
      loadProperties();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to delete property');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Properties</h1>
          <p className="text-content-secondary">Manage your property portfolio</p>
        </div>
        <Button
          variant="primary"
          onClick={() => window.location.href = '/property-management/properties/new'}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Property
        </Button>
      </div>

      {/* Search & Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Search properties..."
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
              <label className="block text-sm font-medium text-content-secondary mb-1">Property Type</label>
              <select
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                value={filters.propertyType || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  propertyType: e.target.value as PropertyType || undefined,
                }))}
              >
                <option value="">All Types</option>
                {Object.values(PropertyType).map(type => (
                  <option key={type} value={type}>{type.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Status</label>
              <select
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                value={filters.status || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  status: e.target.value as PropertyStatus || undefined,
                }))}
              >
                <option value="">All Statuses</option>
                {Object.values(PropertyStatus).map(status => (
                  <option key={status} value={status}>{status.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Health</label>
              <select
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                value={filters.healthStatus || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  healthStatus: e.target.value as PropertyHealthStatus || undefined,
                }))}
              >
                <option value="">All Health Statuses</option>
                {Object.values(PropertyHealthStatus).map(status => (
                  <option key={status} value={status}>{status.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </Card>

      {/* Properties Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
        </div>
      ) : properties.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="w-12 h-12 mx-auto text-content-tertiary mb-4" />
          <h3 className="text-lg font-medium text-content-primary mb-2">No properties found</h3>
          <p className="text-content-secondary mb-4">Get started by adding your first property</p>
          <Button
            variant="primary"
            onClick={() => window.location.href = '/property-management/properties/new'}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Property
          </Button>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map((property) => {
              const TypeIcon = getTypeIcon(property.propertyType);
              return (
                <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-accent-primary/10 rounded-lg">
                          <TypeIcon className="w-5 h-5 text-accent-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-content-tertiary">{property.propertyCode}</p>
                          <h3 className="font-semibold text-content-primary">{property.name}</h3>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(property.status)}`}>
                        {property.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-sm text-content-secondary mb-3">
                      <MapPin className="w-4 h-4" />
                      {property.city}, {property.country}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-content-tertiary">Units</p>
                        <p className="font-semibold text-content-primary">{property.unitCount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-content-tertiary">Type</p>
                        <p className="font-semibold text-content-primary">{property.propertyType.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-content-tertiary">Market Value</p>
                        <p className="font-semibold text-content-primary">
                          {formatCurrency(property.currentMarketValue, property.currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-content-tertiary">Monthly Rent</p>
                        <p className="font-semibold text-status-success">
                          {formatCurrency(property.currentRentalValue, property.currency)}
                        </p>
                      </div>
                    </div>

                    {property.healthStatus && (
                      <div className="mb-4">
                        <span className={`px-2 py-1 rounded text-xs ${getHealthColor(property.healthStatus)}`}>
                          {property.healthStatus.replace('_', ' ')}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-3 border-t border-border-default">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => window.location.href = `/property-management/properties/${property.id}`}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => window.location.href = `/property-management/properties/${property.id}/edit`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDelete(property.id)}
                      >
                        <Trash2 className="w-4 h-4 text-status-error" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-content-secondary">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} properties
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

export default PropertiesPage;
