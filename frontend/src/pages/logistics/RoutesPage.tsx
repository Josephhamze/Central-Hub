import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Route as RouteIcon, MapPin, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Modal, ModalFooter } from '@components/ui/Modal';
import { useToast } from '@contexts/ToastContext';
import { routesApi, type Route, type CreateRouteDto, type CreateTollDto } from '@services/sales/routes';
import { useAuth } from '@contexts/AuthContext';

export function RoutesPage() {
  const { hasPermission, hasRole } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTollModalOpen, setIsTollModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [formData, setFormData] = useState<CreateRouteDto>({
    fromCity: '',
    toCity: '',
    distanceKm: 0,
    costPerKm: 0,
  });
  const [tollData, setTollData] = useState<CreateTollDto>({
    routeId: '',
    name: '',
    cost: 0,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      const res = await routesApi.findAll(1, 100);
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateRouteDto) => routesApi.create(data),
    onSuccess: () => {
      success('Route created successfully');
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      setIsCreateModalOpen(false);
      setFormData({ fromCity: '', toCity: '', distanceKm: 0, costPerKm: 0 });
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to create route');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateRouteDto> }) =>
      routesApi.update(id, data),
    onSuccess: () => {
      success('Route updated successfully');
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      setIsEditModalOpen(false);
      setSelectedRoute(null);
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to update route');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => routesApi.remove(id),
    onSuccess: () => {
      success('Route deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to delete route');
    },
  });

  const addTollMutation = useMutation({
    mutationFn: (data: CreateTollDto) => routesApi.addToll(data),
    onSuccess: () => {
      success('Toll added successfully');
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      setIsTollModalOpen(false);
      setTollData({ routeId: '', name: '', cost: 0 });
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to add toll');
    },
  });

  const removeTollMutation = useMutation({
    mutationFn: (id: string) => routesApi.removeToll(id),
    onSuccess: () => {
      success('Toll removed successfully');
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to remove toll');
    },
  });

  const handleCreate = () => {
    if (!formData.fromCity.trim() || !formData.toCity.trim() || formData.distanceKm <= 0 || formData.costPerKm <= 0) {
      showError('All fields are required and must be positive');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (route: Route) => {
    setSelectedRoute(route);
    setFormData({
      fromCity: route.fromCity,
      toCity: route.toCity,
      distanceKm: route.distanceKm,
      costPerKm: route.costPerKm,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = () => {
    if (!formData.fromCity.trim() || !formData.toCity.trim() || formData.distanceKm <= 0 || formData.costPerKm <= 0) {
      showError('All fields are required and must be positive');
      return;
    }
    if (!selectedRoute) return;
    updateMutation.mutate({ id: selectedRoute.id, data: formData });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this route?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddToll = (routeId: string) => {
    setTollData({ routeId, name: '', cost: 0 });
    setIsTollModalOpen(true);
  };

  const handleCreateToll = () => {
    if (!tollData.name.trim() || tollData.cost <= 0) {
      showError('Toll name and cost are required');
      return;
    }
    addTollMutation.mutate(tollData);
  };

  const handleRemoveToll = (id: string) => {
    if (window.confirm('Are you sure you want to remove this toll?')) {
      removeTollMutation.mutate(id);
    }
  };

  const canCreate = hasPermission('routes:create') || hasRole('Administrator');
  const canUpdate = hasPermission('routes:update') || hasRole('Administrator');
  const canDelete = hasPermission('routes:delete') || hasRole('Administrator');

  const filteredRoutes = (data?.items || []).filter(route => 
    !search || route.fromCity?.toLowerCase().includes(search.toLowerCase()) ||
    route.toCity?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageContainer
      title="Routes & Tolls"
      description="Manage delivery routes and toll costs (Admin only)"
      actions={
        canCreate ? (
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Route
          </Button>
        ) : undefined
      }
    >
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-content-tertiary" />
          <Input
            placeholder="Search routes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-content-secondary">Loading...</div>
      ) : filteredRoutes.length === 0 ? (
        <Card className="p-12 text-center">
          <RouteIcon className="w-12 h-12 mx-auto mb-4 text-content-tertiary" />
          <h3 className="text-lg font-semibold text-content-primary mb-2">No routes found</h3>
          <p className="text-content-secondary mb-4">
            {search ? 'Try adjusting your search terms' : 'Get started by creating your first route'}
          </p>
          {canCreate && (
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Create Route
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRoutes.map((route) => (
            <Card key={route.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin className="w-5 h-5 text-content-tertiary" />
                    <h3 className="text-lg font-semibold text-content-primary">
                      {route.fromCity} → {route.toCity}
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <p className="text-content-secondary"><span className="font-medium">Distance:</span> {route.distanceKm} km</p>
                    <p className="text-content-secondary"><span className="font-medium">Cost per km:</span> ${Number(route.costPerKm).toFixed(2)}</p>
                    <p className="text-content-secondary"><span className="font-medium">Base Cost:</span> ${(Number(route.distanceKm) * Number(route.costPerKm)).toFixed(2)}</p>
                    {route.tolls && route.tolls.length > 0 && (
                      <p className="text-content-secondary"><span className="font-medium">Tolls:</span> {route.tolls.length} toll(s)</p>
                    )}
                  </div>
                  {route.tolls && route.tolls.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium text-content-primary mb-2">Tolls:</p>
                      <div className="space-y-2">
                        {route.tolls.map((toll) => (
                          <div key={toll.id} className="flex justify-between items-center bg-background-secondary p-2 rounded">
                            <span className="text-sm text-content-secondary">{toll.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-content-primary">${Number(toll.cost).toFixed(2)}</span>
                              {canDelete && (
                                <Button size="sm" variant="ghost" onClick={() => handleRemoveToll(toll.id)}>
                                  <X className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-content-secondary mt-2">
                        Total Tolls: ${route.tolls.reduce((sum, toll) => sum + Number(toll.cost), 0).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {canCreate && (
                    <Button size="sm" variant="secondary" onClick={() => handleAddToll(route.id)} leftIcon={<Plus className="w-4 h-4" />}>
                      Add Toll
                    </Button>
                  )}
                  {canUpdate && (
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(route)} leftIcon={<Edit className="w-4 h-4" />}>
                      Edit
                    </Button>
                  )}
                  {canDelete && (
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(route.id)} leftIcon={<Trash2 className="w-4 h-4" />}>
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Route">
        <div className="space-y-4">
          <Input label="From City *" value={formData.fromCity} onChange={(e) => setFormData({ ...formData, fromCity: e.target.value })} placeholder="Origin city" />
          <Input label="To City *" value={formData.toCity} onChange={(e) => setFormData({ ...formData, toCity: e.target.value })} placeholder="Destination city" />
          <Input label="Distance (km) *" type="number" step="0.01" min="0" value={formData.distanceKm} onChange={(e) => setFormData({ ...formData, distanceKm: Number(e.target.value) })} />
          <Input label="Cost per km *" type="number" step="0.01" min="0" value={formData.costPerKm} onChange={(e) => setFormData({ ...formData, costPerKm: Number(e.target.value) })} />
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate} isLoading={createMutation.isPending}>Create Route</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setSelectedRoute(null); }} title="Edit Route">
        <div className="space-y-4">
          <Input label="From City *" value={formData.fromCity} onChange={(e) => setFormData({ ...formData, fromCity: e.target.value })} placeholder="Origin city" />
          <Input label="To City *" value={formData.toCity} onChange={(e) => setFormData({ ...formData, toCity: e.target.value })} placeholder="Destination city" />
          <Input label="Distance (km) *" type="number" step="0.01" min="0" value={formData.distanceKm} onChange={(e) => setFormData({ ...formData, distanceKm: Number(e.target.value) })} />
          <Input label="Cost per km *" type="number" step="0.01" min="0" value={formData.costPerKm} onChange={(e) => setFormData({ ...formData, costPerKm: Number(e.target.value) })} />
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => { setIsEditModalOpen(false); setSelectedRoute(null); }}>Cancel</Button>
          <Button variant="primary" onClick={handleUpdate} isLoading={updateMutation.isPending}>Update Route</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={isTollModalOpen} onClose={() => { setIsTollModalOpen(false); setTollData({ routeId: '', name: '', cost: 0 }); }} title="Add Toll">
        <div className="space-y-4">
          <Input label="Toll Name *" value={tollData.name} onChange={(e) => setTollData({ ...tollData, name: e.target.value })} placeholder="Toll name" />
          <Input label="Cost *" type="number" step="0.01" min="0" value={tollData.cost} onChange={(e) => setTollData({ ...tollData, cost: Number(e.target.value) })} />
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => { setIsTollModalOpen(false); setTollData({ routeId: '', name: '', cost: 0 }); }}>Cancel</Button>
          <Button variant="primary" onClick={handleCreateToll} isLoading={addTollMutation.isPending}>Add Toll</Button>
        </ModalFooter>
      </Modal>
    </PageContainer>
  );
}
