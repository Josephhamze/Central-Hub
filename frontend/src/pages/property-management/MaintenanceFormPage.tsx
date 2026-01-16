import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Wrench } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';
import propertyManagementService, {
  MaintenanceJob,
  MaintenanceStatus,
  MaintenancePriority,
  ExpenseCategory,
  Property,
  PropertyUnit,
} from '@/services/property-management';

export function MaintenanceFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<PropertyUnit[]>([]);
  const [formData, setFormData] = useState<Partial<MaintenanceJob>>({
    propertyId: '',
    unitId: '',
    title: '',
    description: '',
    category: ExpenseCategory.MAINTENANCE,
    priority: MaintenancePriority.MEDIUM,
    status: MaintenanceStatus.PENDING,
    reportedDate: new Date().toISOString().split('T')[0],
    scheduledDate: '',
    assignedTo: '',
    estimatedCost: undefined,
    currency: 'USD',
    budgetCode: '',
    affectsOccupancy: false,
    vacancyDaysImpact: undefined,
    tenantAccessRequired: false,
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
      const propertiesRes = await propertyManagementService.getProperties({ limit: 100 });
      setProperties(propertiesRes?.items || []);

      if (isEdit) {
        const job = await propertyManagementService.getMaintenanceJob(id!);
        setFormData({
          propertyId: job.propertyId,
          unitId: job.unitId || '',
          title: job.title,
          description: job.description,
          category: job.category,
          priority: job.priority,
          status: job.status,
          reportedDate: job.reportedDate.split('T')[0],
          scheduledDate: job.scheduledDate ? job.scheduledDate.split('T')[0] : '',
          assignedTo: job.assignedTo || '',
          estimatedCost: job.estimatedCost,
          currency: job.currency,
          budgetCode: job.budgetCode || '',
          affectsOccupancy: job.affectsOccupancy,
          vacancyDaysImpact: job.vacancyDaysImpact,
          tenantAccessRequired: job.tenantAccessRequired,
          notes: job.notes || '',
        });

        if (job.propertyId) {
          await loadPropertyUnits(job.propertyId);
        }
      }
    } catch (err: any) {
      showError(err.response?.data?.error?.message || 'Failed to load data');
      if (isEdit) {
        navigate('/property-management/maintenance');
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

    if (!formData.propertyId || !formData.title || !formData.description) {
      showError('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      const submitData = {
        ...formData,
        unitId: formData.unitId || undefined,
        scheduledDate: formData.scheduledDate || undefined,
        assignedTo: formData.assignedTo || undefined,
        estimatedCost: formData.estimatedCost || undefined,
        vacancyDaysImpact: formData.affectsOccupancy ? formData.vacancyDaysImpact : undefined,
      };

      if (isEdit) {
        await propertyManagementService.updateMaintenanceJob(id!, submitData);
        success('Maintenance job updated successfully');
        navigate(`/property-management/maintenance/${id}`);
      } else {
        const newJob = await propertyManagementService.createMaintenanceJob(submitData);
        success('Maintenance job created successfully');
        navigate(`/property-management/maintenance/${newJob.id}`);
      }
    } catch (err: any) {
      showError(err.response?.data?.error?.message || `Failed to ${isEdit ? 'update' : 'create'} maintenance job`);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof MaintenanceJob, value: any) => {
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
          onClick={() => navigate('/property-management/maintenance')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-content-primary">
            {isEdit ? 'Edit Maintenance Job' : 'New Maintenance Job'}
          </h1>
          <p className="text-content-secondary">
            {isEdit ? 'Update job details' : 'Create a new maintenance request'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Location */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wrench className="w-5 h-5 text-accent-primary" />
            <h2 className="text-lg font-semibold text-content-primary">Location</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <option value="">Common Area / Entire Property</option>
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

        {/* Job Details */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-content-primary mb-4">Job Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Title *"
                value={formData.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Brief description of the issue"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-content-secondary mb-1">Description *</label>
              <textarea
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                rows={4}
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Detailed description of the maintenance issue..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Category *</label>
              <select
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                required
              >
                {Object.values(ExpenseCategory).map(category => (
                  <option key={category} value={category}>{category.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Priority *</label>
              <select
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                required
              >
                {Object.values(MaintenancePriority).map(priority => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>
            {isEdit && (
              <div>
                <label className="block text-sm font-medium text-content-secondary mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  {Object.values(MaintenanceStatus).map(status => (
                    <option key={status} value={status}>{status.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </Card>

        {/* Scheduling */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-content-primary mb-4">Scheduling</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Reported Date *"
              type="date"
              value={formData.reportedDate || ''}
              onChange={(e) => handleChange('reportedDate', e.target.value)}
              required
            />
            <Input
              label="Scheduled Date"
              type="date"
              value={formData.scheduledDate || ''}
              onChange={(e) => handleChange('scheduledDate', e.target.value)}
            />
            <Input
              label="Assigned To"
              value={formData.assignedTo || ''}
              onChange={(e) => handleChange('assignedTo', e.target.value)}
              placeholder="Contractor or staff name"
            />
          </div>
        </Card>

        {/* Cost Estimate */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-content-primary mb-4">Cost Estimate</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              label="Estimated Cost"
              type="number"
              min="0"
              step="0.01"
              value={formData.estimatedCost || ''}
              onChange={(e) => handleChange('estimatedCost', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="0.00"
            />
            <Input
              label="Budget Code"
              value={formData.budgetCode || ''}
              onChange={(e) => handleChange('budgetCode', e.target.value)}
              placeholder="Budget line item"
            />
          </div>
        </Card>

        {/* Impact */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-content-primary mb-4">Impact</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.tenantAccessRequired || false}
                  onChange={(e) => handleChange('tenantAccessRequired', e.target.checked)}
                  className="w-4 h-4 text-accent-primary rounded"
                />
                <span className="text-sm text-content-primary">Tenant access required</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.affectsOccupancy || false}
                  onChange={(e) => handleChange('affectsOccupancy', e.target.checked)}
                  className="w-4 h-4 text-accent-primary rounded"
                />
                <span className="text-sm text-content-primary">Affects occupancy</span>
              </label>
            </div>
            {formData.affectsOccupancy && (
              <Input
                label="Vacancy Days Impact"
                type="number"
                min="0"
                value={formData.vacancyDaysImpact || ''}
                onChange={(e) => handleChange('vacancyDaysImpact', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Expected days of vacancy"
              />
            )}
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
            placeholder="Any additional notes..."
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
            {isEdit ? 'Update Job' : 'Create Job'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/property-management/maintenance')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

export default MaintenanceFormPage;
