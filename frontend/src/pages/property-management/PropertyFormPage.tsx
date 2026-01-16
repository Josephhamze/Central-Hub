import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Building2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';
import propertyManagementService, {
  Property,
  PropertyType,
  PropertyStatus,
  OwnershipType,
} from '@/services/property-management';

export function PropertyFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Property>>({
    name: '',
    propertyType: PropertyType.RESIDENTIAL,
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    unitCount: 1,
    floorArea: undefined,
    plotSize: undefined,
    floors: undefined,
    bedrooms: undefined,
    bathrooms: undefined,
    parkingSpaces: undefined,
    yearBuilt: undefined,
    description: '',
    ownershipType: OwnershipType.OWNED,
    status: PropertyStatus.VACANT,
    purchaseValue: undefined,
    currentMarketValue: undefined,
    currentRentalValue: undefined,
    currency: 'USD',
    annualEscalationPct: undefined,
  });

  useEffect(() => {
    if (isEdit) {
      loadProperty();
    }
  }, [id]);

  const loadProperty = async () => {
    try {
      setLoading(true);
      const property = await propertyManagementService.getProperty(id!);
      setFormData({
        name: property.name,
        propertyType: property.propertyType,
        addressLine1: property.addressLine1,
        addressLine2: property.addressLine2 || '',
        city: property.city,
        state: property.state || '',
        postalCode: property.postalCode || '',
        country: property.country,
        unitCount: property.unitCount,
        floorArea: property.floorArea,
        plotSize: property.plotSize,
        floors: property.floors,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        parkingSpaces: property.parkingSpaces,
        yearBuilt: property.yearBuilt,
        description: property.description || '',
        ownershipType: property.ownershipType,
        status: property.status,
        purchaseValue: property.purchaseValue,
        currentMarketValue: property.currentMarketValue,
        currentRentalValue: property.currentRentalValue,
        currency: property.currency,
        annualEscalationPct: property.annualEscalationPct,
        gpsLatitude: property.gpsLatitude,
        gpsLongitude: property.gpsLongitude,
      });
    } catch (err: any) {
      showError(err.response?.data?.error?.message || 'Failed to load property');
      navigate('/property-management/properties');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.addressLine1 || !formData.city || !formData.country) {
      showError('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      if (isEdit) {
        await propertyManagementService.updateProperty(id!, formData);
        success('Property updated successfully');
        navigate(`/property-management/properties/${id}`);
      } else {
        const newProperty = await propertyManagementService.createProperty(formData);
        success('Property created successfully');
        navigate(`/property-management/properties/${newProperty.id}`);
      }
    } catch (err: any) {
      showError(err.response?.data?.error?.message || `Failed to ${isEdit ? 'update' : 'create'} property`);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof Property, value: any) => {
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
          onClick={() => navigate('/property-management/properties')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-content-primary">
            {isEdit ? 'Edit Property' : 'New Property'}
          </h1>
          <p className="text-content-secondary">
            {isEdit ? 'Update property information' : 'Add a new property to your portfolio'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-accent-primary" />
            <h2 className="text-lg font-semibold text-content-primary">Basic Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Property Name *"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter property name"
              required
            />
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Property Type *</label>
              <select
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                value={formData.propertyType}
                onChange={(e) => handleChange('propertyType', e.target.value)}
                required
              >
                {Object.values(PropertyType).map(type => (
                  <option key={type} value={type}>{type.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Ownership Type *</label>
              <select
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                value={formData.ownershipType}
                onChange={(e) => handleChange('ownershipType', e.target.value)}
                required
              >
                {Object.values(OwnershipType).map(type => (
                  <option key={type} value={type}>{type.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Status *</label>
              <select
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                required
              >
                {Object.values(PropertyStatus).map(status => (
                  <option key={status} value={status}>{status.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Address */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-content-primary mb-4">Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Address Line 1 *"
                value={formData.addressLine1 || ''}
                onChange={(e) => handleChange('addressLine1', e.target.value)}
                placeholder="Street address"
                required
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
              label="City *"
              value={formData.city || ''}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="City"
              required
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
              label="Country *"
              value={formData.country || ''}
              onChange={(e) => handleChange('country', e.target.value)}
              placeholder="Country"
              required
            />
          </div>
        </Card>

        {/* Property Details */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-content-primary mb-4">Property Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input
              label="Units *"
              type="number"
              min="1"
              value={formData.unitCount || 1}
              onChange={(e) => handleChange('unitCount', parseInt(e.target.value) || 1)}
              required
            />
            <Input
              label="Floors"
              type="number"
              min="0"
              value={formData.floors || ''}
              onChange={(e) => handleChange('floors', e.target.value ? parseInt(e.target.value) : undefined)}
            />
            <Input
              label="Bedrooms"
              type="number"
              min="0"
              value={formData.bedrooms || ''}
              onChange={(e) => handleChange('bedrooms', e.target.value ? parseInt(e.target.value) : undefined)}
            />
            <Input
              label="Bathrooms"
              type="number"
              min="0"
              step="0.5"
              value={formData.bathrooms || ''}
              onChange={(e) => handleChange('bathrooms', e.target.value ? parseFloat(e.target.value) : undefined)}
            />
            <Input
              label="Floor Area (sqm)"
              type="number"
              min="0"
              step="0.01"
              value={formData.floorArea || ''}
              onChange={(e) => handleChange('floorArea', e.target.value ? parseFloat(e.target.value) : undefined)}
            />
            <Input
              label="Plot Size (sqm)"
              type="number"
              min="0"
              step="0.01"
              value={formData.plotSize || ''}
              onChange={(e) => handleChange('plotSize', e.target.value ? parseFloat(e.target.value) : undefined)}
            />
            <Input
              label="Parking Spaces"
              type="number"
              min="0"
              value={formData.parkingSpaces || ''}
              onChange={(e) => handleChange('parkingSpaces', e.target.value ? parseInt(e.target.value) : undefined)}
            />
            <Input
              label="Year Built"
              type="number"
              min="1800"
              max={new Date().getFullYear()}
              value={formData.yearBuilt || ''}
              onChange={(e) => handleChange('yearBuilt', e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-content-secondary mb-1">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
              rows={3}
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Property description..."
            />
          </div>
        </Card>

        {/* Financial Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-content-primary mb-4">Financial Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              label="Purchase Value"
              type="number"
              min="0"
              step="0.01"
              value={formData.purchaseValue || ''}
              onChange={(e) => handleChange('purchaseValue', e.target.value ? parseFloat(e.target.value) : undefined)}
            />
            <Input
              label="Market Value"
              type="number"
              min="0"
              step="0.01"
              value={formData.currentMarketValue || ''}
              onChange={(e) => handleChange('currentMarketValue', e.target.value ? parseFloat(e.target.value) : undefined)}
            />
            <Input
              label="Monthly Rental"
              type="number"
              min="0"
              step="0.01"
              value={formData.currentRentalValue || ''}
              onChange={(e) => handleChange('currentRentalValue', e.target.value ? parseFloat(e.target.value) : undefined)}
            />
            <Input
              label="Annual Escalation (%)"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.annualEscalationPct || ''}
              onChange={(e) => handleChange('annualEscalationPct', e.target.value ? parseFloat(e.target.value) : undefined)}
            />
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
            {isEdit ? 'Update Property' : 'Create Property'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/property-management/properties')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

export default PropertyFormPage;
