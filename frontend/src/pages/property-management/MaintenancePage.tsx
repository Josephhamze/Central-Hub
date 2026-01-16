import { useState, useEffect } from 'react';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Building2,
  PlayCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';
import propertyManagementService, {
  MaintenanceJob,
  MaintenanceStatus,
  MaintenancePriority,
  ExpenseCategory,
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

const getPriorityIcon = (priority: MaintenancePriority) => {
  switch (priority) {
    case MaintenancePriority.URGENT:
      return AlertTriangle;
    case MaintenancePriority.HIGH:
      return AlertTriangle;
    default:
      return Clock;
  }
};

export function MaintenancePage() {
  const [jobs, setJobs] = useState<MaintenanceJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<{
    status?: MaintenanceStatus;
    priority?: MaintenancePriority;
    category?: ExpenseCategory;
  }>({});
  const [showFilters, setShowFilters] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    loadJobs();
  }, [pagination.page, filters]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await propertyManagementService.getMaintenanceJobs({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        ...filters,
      });
      setJobs(response?.items || []);
      setPagination(prev => ({
        ...prev,
        total: response?.pagination?.total ?? 0,
        totalPages: response?.pagination?.totalPages ?? 0,
      }));
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to load maintenance jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadJobs();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this maintenance job?')) return;
    try {
      await propertyManagementService.deleteMaintenanceJob(id);
      success('Maintenance job deleted successfully');
      loadJobs();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to delete maintenance job');
    }
  };

  const handleStartJob = async (id: string) => {
    try {
      await propertyManagementService.startMaintenanceJob(id);
      success('Maintenance job started');
      loadJobs();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to start job');
    }
  };

  const handleCompleteJob = async (id: string) => {
    const costStr = prompt('Enter actual cost:');
    if (!costStr) return;
    const actualCost = parseFloat(costStr);
    if (isNaN(actualCost)) {
      error('Please enter a valid cost');
      return;
    }
    const resolutionNotes = prompt('Enter resolution notes (optional):') || undefined;
    try {
      await propertyManagementService.completeMaintenanceJob(id, actualCost, resolutionNotes);
      success('Maintenance job completed');
      loadJobs();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to complete job');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Maintenance</h1>
          <p className="text-content-secondary">Manage maintenance jobs and requests</p>
        </div>
        <Button
          variant="primary"
          onClick={() => window.location.href = '/property-management/maintenance/new'}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Job
        </Button>
      </div>

      {/* Search & Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Search maintenance jobs..."
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
                  status: e.target.value as MaintenanceStatus || undefined,
                }))}
              >
                <option value="">All Statuses</option>
                {Object.values(MaintenanceStatus).map(status => (
                  <option key={status} value={status}>{status.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Priority</label>
              <select
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                value={filters.priority || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  priority: e.target.value as MaintenancePriority || undefined,
                }))}
              >
                <option value="">All Priorities</option>
                {Object.values(MaintenancePriority).map(priority => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Category</label>
              <select
                className="w-full px-3 py-2 border border-border-default rounded-lg bg-background-primary text-content-primary"
                value={filters.category || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  category: e.target.value as ExpenseCategory || undefined,
                }))}
              >
                <option value="">All Categories</option>
                {Object.values(ExpenseCategory).map(category => (
                  <option key={category} value={category}>{category.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </Card>

      {/* Jobs List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
        </div>
      ) : jobs.length === 0 ? (
        <Card className="p-12 text-center">
          <Wrench className="w-12 h-12 mx-auto text-content-tertiary mb-4" />
          <h3 className="text-lg font-medium text-content-primary mb-2">No maintenance jobs found</h3>
          <p className="text-content-secondary mb-4">Create your first maintenance job</p>
          <Button
            variant="primary"
            onClick={() => window.location.href = '/property-management/maintenance/new'}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Job
          </Button>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {jobs.map((job) => {
              const PriorityIcon = getPriorityIcon(job.priority);
              return (
                <Card key={job.id} className="p-4 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${getPriorityColor(job.priority)}`}>
                        <PriorityIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs text-content-tertiary">{job.jobCode}</p>
                          <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(job.status)}`}>
                            {job.status.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs ${getPriorityColor(job.priority)}`}>
                            {job.priority}
                          </span>
                        </div>
                        <h3 className="font-medium text-content-primary mb-1">{job.title}</h3>
                        <p className="text-sm text-content-secondary line-clamp-1">{job.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1 text-sm text-content-secondary">
                            <Building2 className="w-4 h-4" />
                            {job.property?.name || 'Unknown Property'}
                            {job.unit && ` - ${job.unit.name}`}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-content-secondary">
                            <Calendar className="w-4 h-4" />
                            Reported: {formatDate(job.reportedDate)}
                          </div>
                          {job.scheduledDate && (
                            <div className="flex items-center gap-1 text-sm text-content-secondary">
                              <Clock className="w-4 h-4" />
                              Scheduled: {formatDate(job.scheduledDate)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-xs text-content-tertiary">Estimated</p>
                          <p className="font-semibold text-content-primary">
                            {formatCurrency(job.estimatedCost, job.currency)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-content-tertiary">Actual</p>
                          <p className="font-semibold text-content-primary">
                            {formatCurrency(job.actualCost, job.currency)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => window.location.href = `/property-management/maintenance/${job.id}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        {job.status === MaintenanceStatus.SCHEDULED && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleStartJob(job.id)}
                          >
                            <PlayCircle className="w-4 h-4 text-status-success" />
                          </Button>
                        )}
                        {job.status === MaintenanceStatus.IN_PROGRESS && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleCompleteJob(job.id)}
                          >
                            <CheckCircle className="w-4 h-4 text-status-success" />
                          </Button>
                        )}
                        {(job.status === MaintenanceStatus.PENDING || job.status === MaintenanceStatus.SCHEDULED) && (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => window.location.href = `/property-management/maintenance/${job.id}/edit`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleDelete(job.id)}
                            >
                              <Trash2 className="w-4 h-4 text-status-error" />
                            </Button>
                          </>
                        )}
                      </div>
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
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} jobs
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

export default MaintenancePage;
