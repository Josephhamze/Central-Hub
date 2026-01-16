import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Wrench,
  Building2,
  Calendar,
  DollarSign,
  User,
  AlertTriangle,
  PlayCircle,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';
import propertyManagementService, {
  MaintenanceJob,
  MaintenanceStatus,
  MaintenancePriority,
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

const getStatusColor = (status: MaintenanceStatus) => {
  const colors: Record<MaintenanceStatus, string> = {
    [MaintenanceStatus.PENDING]: 'bg-status-warning/10 text-status-warning',
    [MaintenanceStatus.SCHEDULED]: 'bg-accent-primary/10 text-accent-primary',
    [MaintenanceStatus.IN_PROGRESS]: 'bg-status-success/10 text-status-success',
    [MaintenanceStatus.ON_HOLD]: 'bg-content-tertiary/10 text-content-tertiary',
    [MaintenanceStatus.COMPLETED]: 'bg-status-success/10 text-status-success',
    [MaintenanceStatus.CANCELLED]: 'bg-status-error/10 text-status-error',
  };
  return colors[status] || colors[MaintenanceStatus.PENDING];
};

const getPriorityColor = (priority: MaintenancePriority) => {
  const colors: Record<MaintenancePriority, string> = {
    [MaintenancePriority.LOW]: 'bg-content-tertiary/10 text-content-tertiary',
    [MaintenancePriority.MEDIUM]: 'bg-accent-primary/10 text-accent-primary',
    [MaintenancePriority.HIGH]: 'bg-status-warning/10 text-status-warning',
    [MaintenancePriority.URGENT]: 'bg-status-error/10 text-status-error',
  };
  return colors[priority] || colors[MaintenancePriority.MEDIUM];
};

export function MaintenanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [job, setJob] = useState<MaintenanceJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [scheduleData, setScheduleData] = useState({ scheduledDate: '', assignedTo: '' });
  const [completeData, setCompleteData] = useState({ actualCost: '', resolutionNotes: '' });

  useEffect(() => {
    if (id) {
      loadJob();
    }
  }, [id]);

  const loadJob = async () => {
    try {
      setLoading(true);
      const data = await propertyManagementService.getMaintenanceJob(id!);
      setJob(data);
    } catch (err: any) {
      showError(err.response?.data?.error?.message || 'Failed to load maintenance job');
      navigate('/property-management/maintenance');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduleData.scheduledDate) {
      showError('Please enter a scheduled date');
      return;
    }
    try {
      await propertyManagementService.scheduleMaintenanceJob(
        id!,
        scheduleData.scheduledDate,
        scheduleData.assignedTo
      );
      success('Job scheduled successfully');
      setShowScheduleModal(false);
      loadJob();
    } catch (err: any) {
      showError(err.response?.data?.error?.message || 'Failed to schedule job');
    }
  };

  const handleStart = async () => {
    try {
      await propertyManagementService.startMaintenanceJob(id!);
      success('Job started successfully');
      loadJob();
    } catch (err: any) {
      showError(err.response?.data?.error?.message || 'Failed to start job');
    }
  };

  const handleComplete = async () => {
    if (!completeData.actualCost) {
      showError('Please enter actual cost');
      return;
    }
    try {
      await propertyManagementService.completeMaintenanceJob(
        id!,
        parseFloat(completeData.actualCost),
        completeData.resolutionNotes || undefined
      );
      success('Job completed successfully');
      setShowCompleteModal(false);
      loadJob();
    } catch (err: any) {
      showError(err.response?.data?.error?.message || 'Failed to complete job');
    }
  };

  const handleCancel = async () => {
    const reason = prompt('Please enter cancellation reason:');
    if (!reason) return;
    try {
      await propertyManagementService.cancelMaintenanceJob(id!, reason);
      success('Job cancelled');
      loadJob();
    } catch (err: any) {
      showError(err.response?.data?.error?.message || 'Failed to cancel job');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <Card className="p-12 text-center">
        <Wrench className="w-12 h-12 mx-auto text-content-tertiary mb-4" />
        <h3 className="text-lg font-medium text-content-primary mb-2">Job not found</h3>
        <Button onClick={() => navigate('/property-management/maintenance')}>
          Back to Maintenance
        </Button>
      </Card>
    );
  }

  const canSchedule = job.status === MaintenanceStatus.PENDING;
  const canStart = job.status === MaintenanceStatus.SCHEDULED;
  const canComplete = job.status === MaintenanceStatus.IN_PROGRESS;
  const canCancel = [MaintenanceStatus.PENDING, MaintenanceStatus.SCHEDULED, MaintenanceStatus.ON_HOLD].includes(job.status);
  const canEdit = [MaintenanceStatus.PENDING, MaintenanceStatus.SCHEDULED].includes(job.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/property-management/maintenance')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${getPriorityColor(job.priority)}`}>
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-content-tertiary">{job.jobCode}</p>
              <h1 className="text-2xl font-bold text-content-primary">{job.title}</h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canSchedule && (
            <Button variant="secondary" onClick={() => setShowScheduleModal(true)}>
              <Calendar className="w-4 h-4 mr-2" />
              Schedule
            </Button>
          )}
          {canStart && (
            <Button variant="secondary" onClick={handleStart}>
              <PlayCircle className="w-4 h-4 mr-2" />
              Start
            </Button>
          )}
          {canComplete && (
            <Button variant="primary" onClick={() => setShowCompleteModal(true)}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete
            </Button>
          )}
          {canEdit && (
            <Button
              variant="secondary"
              onClick={() => navigate(`/property-management/maintenance/${id}/edit`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          {canCancel && (
            <Button variant="secondary" onClick={handleCancel}>
              <XCircle className="w-4 h-4 text-status-error" />
            </Button>
          )}
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex items-center gap-3">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
          {job.status.replace('_', ' ')}
        </span>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(job.priority)}`}>
          {job.priority} Priority
        </span>
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-accent-primary/10 text-accent-primary">
          {job.category.replace('_', ' ')}
        </span>
        {job.affectsOccupancy && (
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-status-warning/10 text-status-warning flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Affects Occupancy
          </span>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-primary/10 rounded-lg">
              <Calendar className="w-5 h-5 text-accent-primary" />
            </div>
            <div>
              <p className="text-sm text-content-tertiary">Reported</p>
              <p className="text-xl font-semibold text-content-primary">
                {formatDate(job.reportedDate)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-primary/10 rounded-lg">
              <Clock className="w-5 h-5 text-accent-primary" />
            </div>
            <div>
              <p className="text-sm text-content-tertiary">Scheduled</p>
              <p className="text-xl font-semibold text-content-primary">
                {formatDate(job.scheduledDate)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-status-warning/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-status-warning" />
            </div>
            <div>
              <p className="text-sm text-content-tertiary">Estimated</p>
              <p className="text-xl font-semibold text-content-primary">
                {formatCurrency(job.estimatedCost, job.currency)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${job.actualCost ? 'bg-status-error/10' : 'bg-content-tertiary/10'}`}>
              <DollarSign className={`w-5 h-5 ${job.actualCost ? 'text-status-error' : 'text-content-tertiary'}`} />
            </div>
            <div>
              <p className="text-sm text-content-tertiary">Actual</p>
              <p className="text-xl font-semibold text-content-primary">
                {formatCurrency(job.actualCost, job.currency)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Description */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-content-primary mb-4">Description</h2>
          <p className="text-content-secondary whitespace-pre-wrap">{job.description}</p>
        </Card>

        {/* Location */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-accent-primary" />
            <h2 className="text-lg font-semibold text-content-primary">Location</h2>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-content-tertiary">Property</p>
              <p className="text-content-primary font-medium">{job.property?.name || 'Unknown Property'}</p>
            </div>
            {job.unit && (
              <div>
                <p className="text-sm text-content-tertiary">Unit</p>
                <p className="text-content-primary">{job.unit.name}</p>
              </div>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/property-management/properties/${job.propertyId}`)}
            >
              View Property
            </Button>
          </div>
        </Card>

        {/* Assignment */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-accent-primary" />
            <h2 className="text-lg font-semibold text-content-primary">Assignment</h2>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-content-tertiary">Assigned To</p>
              <p className="text-content-primary">{job.assignedTo || 'Not assigned'}</p>
            </div>
            {job.contractorId && (
              <div>
                <p className="text-sm text-content-tertiary">Contractor ID</p>
                <p className="text-content-primary">{job.contractorId}</p>
              </div>
            )}
            {job.budgetCode && (
              <div>
                <p className="text-sm text-content-tertiary">Budget Code</p>
                <p className="text-content-primary">{job.budgetCode}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Timeline */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-accent-primary" />
            <h2 className="text-lg font-semibold text-content-primary">Timeline</h2>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-content-tertiary">Reported</p>
                <p className="text-content-primary">{formatDate(job.reportedDate)}</p>
              </div>
              <div>
                <p className="text-sm text-content-tertiary">Scheduled</p>
                <p className="text-content-primary">{formatDate(job.scheduledDate)}</p>
              </div>
              <div>
                <p className="text-sm text-content-tertiary">Started</p>
                <p className="text-content-primary">{formatDate(job.startedDate)}</p>
              </div>
              <div>
                <p className="text-sm text-content-tertiary">Completed</p>
                <p className="text-content-primary">{formatDate(job.completedDate)}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Impact */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-content-primary mb-4">Impact</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs ${job.tenantAccessRequired ? 'bg-status-warning/10 text-status-warning' : 'bg-content-tertiary/10 text-content-tertiary'}`}>
                {job.tenantAccessRequired ? 'Tenant access required' : 'No tenant access needed'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs ${job.affectsOccupancy ? 'bg-status-error/10 text-status-error' : 'bg-content-tertiary/10 text-content-tertiary'}`}>
                {job.affectsOccupancy ? `Affects occupancy (${job.vacancyDaysImpact || 0} days)` : 'Does not affect occupancy'}
              </span>
            </div>
          </div>
        </Card>

        {/* Notes */}
        {job.notes && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-content-primary mb-4">Notes</h2>
            <p className="text-content-secondary whitespace-pre-wrap">{job.notes}</p>
          </Card>
        )}

        {/* Resolution Notes */}
        {job.resolutionNotes && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-content-primary mb-4">Resolution Notes</h2>
            <p className="text-content-secondary whitespace-pre-wrap">{job.resolutionNotes}</p>
          </Card>
        )}
      </div>

      {/* Timestamps */}
      <Card className="p-4">
        <div className="flex items-center justify-between text-sm text-content-tertiary">
          <span>Created: {new Date(job.createdAt).toLocaleString()}</span>
          <span>Last Updated: {new Date(job.updatedAt).toLocaleString()}</span>
        </div>
      </Card>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-content-primary mb-4">Schedule Maintenance Job</h2>
            <div className="space-y-4">
              <Input
                label="Scheduled Date *"
                type="date"
                value={scheduleData.scheduledDate}
                onChange={(e) => setScheduleData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                required
              />
              <Input
                label="Assigned To"
                value={scheduleData.assignedTo}
                onChange={(e) => setScheduleData(prev => ({ ...prev, assignedTo: e.target.value }))}
                placeholder="Contractor or staff name"
              />
              <div className="flex items-center gap-4">
                <Button variant="primary" onClick={handleSchedule}>
                  Schedule Job
                </Button>
                <Button variant="secondary" onClick={() => setShowScheduleModal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Complete Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-content-primary mb-4">Complete Maintenance Job</h2>
            <div className="space-y-4">
              <Input
                label="Actual Cost *"
                type="number"
                min="0"
                step="0.01"
                value={completeData.actualCost}
                onChange={(e) => setCompleteData(prev => ({ ...prev, actualCost: e.target.value }))}
                placeholder={job.estimatedCost ? `Estimated: ${formatCurrency(job.estimatedCost, job.currency)}` : '0.00'}
                required
              />
              <div>
                <label className="block text-sm font-medium text-content-secondary mb-1">Resolution Notes</label>
                <textarea
                  className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                  rows={3}
                  value={completeData.resolutionNotes}
                  onChange={(e) => setCompleteData(prev => ({ ...prev, resolutionNotes: e.target.value }))}
                  placeholder="Describe what was done..."
                />
              </div>
              <div className="flex items-center gap-4">
                <Button variant="primary" onClick={handleComplete}>
                  Complete Job
                </Button>
                <Button variant="secondary" onClick={() => setShowCompleteModal(false)}>
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

export default MaintenanceDetailPage;
