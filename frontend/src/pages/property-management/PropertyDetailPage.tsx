import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Building2,
  MapPin,
  Home,
  DollarSign,
  Calendar,
  Users,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';
import propertyManagementService, {
  Property,
  PropertyType,
  PropertyStatus,
  PropertyHealthStatus,
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

export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadProperty();
    }
  }, [id]);

  const loadProperty = async () => {
    try {
      setLoading(true);
      const data = await propertyManagementService.getProperty(id!);
      setProperty(data);
    } catch (err: any) {
      showError(err.response?.data?.error?.message || 'Failed to load property');
      navigate('/property-management/properties');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      return;
    }
    try {
      await propertyManagementService.deleteProperty(id!);
      success('Property deleted successfully');
      navigate('/property-management/properties');
    } catch (err: any) {
      showError(err.response?.data?.error?.message || 'Failed to delete property');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <Card className="p-12 text-center">
        <Building2 className="w-12 h-12 mx-auto text-content-tertiary mb-4" />
        <h3 className="text-lg font-medium text-content-primary mb-2">Property not found</h3>
        <Button onClick={() => navigate('/property-management/properties')}>
          Back to Properties
        </Button>
      </Card>
    );
  }

  const TypeIcon = getTypeIcon(property.propertyType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/property-management/properties')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent-primary/10 rounded-lg">
              <TypeIcon className="w-6 h-6 text-accent-primary" />
            </div>
            <div>
              <p className="text-sm text-content-tertiary">{property.propertyCode}</p>
              <h1 className="text-2xl font-bold text-content-primary">{property.name}</h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => navigate(`/property-management/properties/${id}/edit`)}
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
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(property.status)}`}>
          {property.status.replace('_', ' ')}
        </span>
        {property.healthStatus && (
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(property.healthStatus)}`}>
            {property.healthStatus.replace('_', ' ')}
          </span>
        )}
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-accent-primary/10 text-accent-primary">
          {property.propertyType.replace('_', ' ')}
        </span>
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-content-tertiary/10 text-content-tertiary">
          {property.ownershipType.replace('_', ' ')}
        </span>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-primary/10 rounded-lg">
              <Home className="w-5 h-5 text-accent-primary" />
            </div>
            <div>
              <p className="text-sm text-content-tertiary">Units</p>
              <p className="text-xl font-semibold text-content-primary">{property.unitCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-status-success/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-status-success" />
            </div>
            <div>
              <p className="text-sm text-content-tertiary">Market Value</p>
              <p className="text-xl font-semibold text-content-primary">
                {formatCurrency(property.currentMarketValue, property.currency)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-status-success/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-status-success" />
            </div>
            <div>
              <p className="text-sm text-content-tertiary">Monthly Rent</p>
              <p className="text-xl font-semibold text-status-success">
                {formatCurrency(property.currentRentalValue, property.currency)}
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
              <p className="text-sm text-content-tertiary">Year Built</p>
              <p className="text-xl font-semibold text-content-primary">
                {property.yearBuilt || '-'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Address & Location */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-accent-primary" />
            <h2 className="text-lg font-semibold text-content-primary">Location</h2>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-content-tertiary">Address</p>
              <p className="text-content-primary">
                {property.addressLine1}
                {property.addressLine2 && <><br />{property.addressLine2}</>}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-content-tertiary">City</p>
                <p className="text-content-primary">{property.city}</p>
              </div>
              <div>
                <p className="text-sm text-content-tertiary">State/Province</p>
                <p className="text-content-primary">{property.state || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-content-tertiary">Postal Code</p>
                <p className="text-content-primary">{property.postalCode || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-content-tertiary">Country</p>
                <p className="text-content-primary">{property.country}</p>
              </div>
            </div>
            {(property.gpsLatitude || property.gpsLongitude) && (
              <div>
                <p className="text-sm text-content-tertiary">GPS Coordinates</p>
                <p className="text-content-primary">
                  {property.gpsLatitude}, {property.gpsLongitude}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Property Details */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-accent-primary" />
            <h2 className="text-lg font-semibold text-content-primary">Property Details</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-content-tertiary">Floors</p>
              <p className="text-content-primary">{property.floors || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-content-tertiary">Bedrooms</p>
              <p className="text-content-primary">{property.bedrooms || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-content-tertiary">Bathrooms</p>
              <p className="text-content-primary">{property.bathrooms || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-content-tertiary">Parking Spaces</p>
              <p className="text-content-primary">{property.parkingSpaces || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-content-tertiary">Floor Area</p>
              <p className="text-content-primary">
                {property.floorArea ? `${property.floorArea} sqm` : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-content-tertiary">Plot Size</p>
              <p className="text-content-primary">
                {property.plotSize ? `${property.plotSize} sqm` : '-'}
              </p>
            </div>
          </div>
          {property.description && (
            <div className="mt-4 pt-4 border-t border-border-default">
              <p className="text-sm text-content-tertiary">Description</p>
              <p className="text-content-primary mt-1">{property.description}</p>
            </div>
          )}
        </Card>

        {/* Financial Information */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-accent-primary" />
            <h2 className="text-lg font-semibold text-content-primary">Financial Information</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-content-tertiary">Currency</p>
              <p className="text-content-primary">{property.currency}</p>
            </div>
            <div>
              <p className="text-sm text-content-tertiary">Purchase Value</p>
              <p className="text-content-primary">
                {formatCurrency(property.purchaseValue, property.currency)}
              </p>
            </div>
            <div>
              <p className="text-sm text-content-tertiary">Market Value</p>
              <p className="text-content-primary">
                {formatCurrency(property.currentMarketValue, property.currency)}
              </p>
            </div>
            <div>
              <p className="text-sm text-content-tertiary">Monthly Rental</p>
              <p className="text-status-success font-semibold">
                {formatCurrency(property.currentRentalValue, property.currency)}
              </p>
            </div>
            <div>
              <p className="text-sm text-content-tertiary">Market Rent Estimate</p>
              <p className="text-content-primary">
                {formatCurrency(property.marketRentEstimate, property.currency)}
              </p>
            </div>
            <div>
              <p className="text-sm text-content-tertiary">Annual Escalation</p>
              <p className="text-content-primary">
                {property.annualEscalationPct ? `${property.annualEscalationPct}%` : '-'}
              </p>
            </div>
          </div>
        </Card>

        {/* Statistics */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-accent-primary" />
            <h2 className="text-lg font-semibold text-content-primary">Statistics</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-content-tertiary">Total Units</p>
              <p className="text-xl font-semibold text-content-primary">{property._count?.units || property.unitCount}</p>
            </div>
            <div>
              <p className="text-sm text-content-tertiary">Active Leases</p>
              <p className="text-xl font-semibold text-content-primary">{property._count?.leases || 0}</p>
            </div>
            <div>
              <p className="text-sm text-content-tertiary">Expenses</p>
              <p className="text-xl font-semibold text-content-primary">{property._count?.expenses || 0}</p>
            </div>
            <div>
              <p className="text-sm text-content-tertiary">Maintenance Jobs</p>
              <p className="text-xl font-semibold text-content-primary">{property._count?.maintenanceJobs || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Timestamps */}
      <Card className="p-4">
        <div className="flex items-center justify-between text-sm text-content-tertiary">
          <span>Created: {new Date(property.createdAt).toLocaleString()}</span>
          <span>Last Updated: {new Date(property.updatedAt).toLocaleString()}</span>
        </div>
      </Card>
    </div>
  );
}

export default PropertyDetailPage;
