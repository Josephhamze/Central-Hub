import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { useToast } from '@contexts/ToastContext';
import { useAuth } from '@contexts/AuthContext';
import { routesApi, type Route, type CreateRouteDto } from '@services/logistics/routes';

export function RouteFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: existingRoute } = useQuery({
    queryKey: ['route', id],
    queryFn: async () => {
      const res = await routesApi.findOne(id!);
      return res.data.data;
    },
    enabled: isEdit,
  });

  const [formData, setFormData] = useState<CreateRouteDto>({
    fromCity: '',
    toCity: '',
    distanceKm: 0,
    timeHours: undefined,
    costPerKm: undefined,
    isActive: true,
    notes: '',
  });

  useEffect(() => {
    if (existingRoute) {
      setFormData({
        fromCity: existingRoute.fromCity,
        toCity: existingRoute.toCity,
        distanceKm: existingRoute.distanceKm,
        timeHours: existingRoute.timeHours,
        costPerKm: existingRoute.costPerKm,
        isActive: existingRoute.isActive,
        notes: existingRoute.notes || '',
      });
    }
  }, [existingRoute]);

  const createMutation = useMutation({
    mutationFn: () => routesApi.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      success('Route created');
      navigate('/logistics/routes');
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to create route'),
  });

  const updateMutation = useMutation({
    mutationFn: () => routesApi.update(id!, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      queryClient.invalidateQueries({ queryKey: ['route', id] });
      success('Route updated');
      navigate(`/logistics/routes/${id}`);
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to update route'),
  });

  const canManage = hasPermission('logistics:routes:manage');

  if (!canManage) {
    return (
      <PageContainer>
        <Card className="p-12 text-center">
          <p className="text-content-secondary">You don't have permission to manage routes</p>
          <Button onClick={() => navigate('/logistics/routes')} className="mt-4">
            Back to Routes
          </Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/logistics/routes')} icon={ArrowLeft}>
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-content-primary">
                {isEdit ? 'Edit Route' : 'New Route'}
              </h1>
              <p className="text-content-secondary mt-1">
                {isEdit ? 'Update route information' : 'Create a new delivery route'}
              </p>
            </div>
          </div>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="From City *"
                value={formData.fromCity}
                onChange={(e) => setFormData({ ...formData, fromCity: e.target.value })}
                required
              />
              <Input
                label="To City *"
                value={formData.toCity}
                onChange={(e) => setFormData({ ...formData, toCity: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Distance (km) *"
                type="number"
                step="0.01"
                value={formData.distanceKm}
                onChange={(e) => setFormData({ ...formData, distanceKm: parseFloat(e.target.value) || 0 })}
                required
              />
              <Input
                label="Time (hours)"
                type="number"
                step="0.01"
                value={formData.timeHours || ''}
                onChange={(e) =>
                  setFormData({ ...formData, timeHours: e.target.value ? parseFloat(e.target.value) : undefined })
                }
              />
            </div>

            <Input
              label="Cost Per Km (legacy, optional)"
              type="number"
              step="0.01"
              value={formData.costPerKm || ''}
              onChange={(e) =>
                setFormData({ ...formData, costPerKm: e.target.value ? parseFloat(e.target.value) : undefined })
              }
            />

            <div>
              <label className="block text-sm font-medium mb-1 text-content-primary">Notes</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-border-default bg-background-primary text-content-primary"
                rows={4}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="isActive" className="text-sm text-content-primary">
                Active
              </label>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-border-default">
              <Button
                onClick={() => (isEdit ? updateMutation.mutate() : createMutation.mutate())}
                loading={createMutation.isPending || updateMutation.isPending}
                icon={Save}
              >
                {isEdit ? 'Update Route' : 'Create Route'}
              </Button>
              <Button variant="secondary" onClick={() => navigate('/logistics/routes')}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
