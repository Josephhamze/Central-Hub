import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, Clock, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Badge } from '@components/ui/Badge';
import { maintenanceSchedulesApi } from '@services/assets/maintenance';
import { useAuth } from '@contexts/AuthContext';

export function MaintenanceSchedulesPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['maintenance-schedules', 'list'],
    queryFn: () => maintenanceSchedulesApi.findAll(1, 50),
  });

  const { data: overdue } = useQuery({
    queryKey: ['maintenance', 'overdue'],
    queryFn: () => maintenanceSchedulesApi.getOverdue(),
  });

  const canCreate = hasPermission('maintenance:schedule');

  return (
    <PageContainer
      title="Maintenance Schedules"
      description="Manage preventive maintenance schedules"
      actions={
        canCreate ? (
          <Button
            variant="primary"
            onClick={() => navigate('/assets/maintenance/schedules?action=create')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Schedule
          </Button>
        ) : undefined
      }
    >
      {overdue && overdue.length > 0 && (
        <Card className="p-4 mb-6 bg-status-warning-bg border border-status-warning">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-status-warning" />
            <h3 className="font-semibold text-status-warning">{overdue.length} Overdue Maintenance</h3>
          </div>
          <p className="text-sm text-content-secondary">
            {overdue.length} maintenance schedule{overdue.length !== 1 ? 's' : ''} are overdue
          </p>
        </Card>
      )}

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-content-tertiary" />
          <Input
            placeholder="Search schedules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            aria-label="Search maintenance schedules"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-content-secondary">Loading...</div>
      ) : !data || data.items.length === 0 ? (
        <Card className="p-12 text-center">
          <Clock className="w-12 h-12 mx-auto mb-4 text-content-tertiary" />
          <h3 className="text-lg font-semibold text-content-primary mb-2">No maintenance schedules</h3>
          <p className="text-content-secondary mb-4">Get started by creating your first maintenance schedule</p>
          {canCreate && (
            <Button variant="primary" onClick={() => navigate('/assets/maintenance/schedules?action=create')} leftIcon={<Plus className="w-4 h-4" />}>
              Create Schedule
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {data.items.map((schedule) => {
            const isOverdue = schedule.nextDueAt && new Date(schedule.nextDueAt) < new Date();
            return (
              <Card key={schedule.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-content-primary">{schedule.asset?.name || 'Unknown Asset'}</h3>
                      {isOverdue && <Badge variant="error">Overdue</Badge>}
                      {!schedule.isActive && <Badge variant="default">Inactive</Badge>}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-content-tertiary">Type:</span>
                        <p className="text-content-primary font-medium capitalize">{schedule.type.toLowerCase().replace('_', ' ')}</p>
                      </div>
                      {schedule.intervalDays && (
                        <div>
                          <span className="text-content-tertiary">Interval:</span>
                          <p className="text-content-primary font-medium">{schedule.intervalDays} days</p>
                        </div>
                      )}
                      {schedule.nextDueAt && (
                        <div>
                          <span className="text-content-tertiary">Next Due:</span>
                          <p className={`font-medium ${isOverdue ? 'text-status-error' : 'text-content-primary'}`}>
                            {new Date(schedule.nextDueAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {schedule.lastPerformedAt && (
                        <div>
                          <span className="text-content-tertiary">Last Performed:</span>
                          <p className="text-content-primary font-medium">
                            {new Date(schedule.lastPerformedAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
