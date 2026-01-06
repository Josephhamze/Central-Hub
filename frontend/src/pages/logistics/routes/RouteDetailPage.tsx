import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Clock, Truck, DollarSign, History, Edit, Plus, Trash2, GripVertical } from 'lucide-react';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Input } from '@components/ui/Input';
import { useToast } from '@contexts/ToastContext';
import { useAuth } from '@contexts/AuthContext';
import { routesApi, type Route, type VehicleType } from '@services/logistics/routes';
import { tollStationsApi, type TollStation } from '@services/logistics/toll-stations';
import { cn } from '@utils/cn';

type Tab = 'overview' | 'stations' | 'costing' | 'history';

export function RouteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [expectedTollVehicleType, setExpectedTollVehicleType] = useState<VehicleType>('FLATBED');

  const { data: route, isLoading } = useQuery({
    queryKey: ['route', id],
    queryFn: async () => {
      const res = await routesApi.findOne(id!);
      return res.data.data;
    },
    enabled: !!id,
  });

  const { data: expectedToll } = useQuery({
    queryKey: ['route-expected-toll', id, expectedTollVehicleType],
    queryFn: async () => {
      const res = await routesApi.getExpectedToll(id!, expectedTollVehicleType);
      return res.data.data;
    },
    enabled: !!id,
  });

  const { data: allStations } = useQuery({
    queryKey: ['toll-stations'],
    queryFn: async () => {
      const res = await tollStationsApi.findAll(1, 100, { isActive: true });
      return res.data.data;
    },
    enabled: activeTab === 'stations',
  });

  const canManage = hasPermission('logistics:routes:manage');

  if (isLoading) {
    return (
      <PageContainer>
        <Card className="p-12 text-center">
          <p className="text-content-secondary">Loading route...</p>
        </Card>
      </PageContainer>
    );
  }

  if (!route) {
    return (
      <PageContainer>
        <Card className="p-12 text-center">
          <p className="text-content-secondary">Route not found</p>
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/logistics/routes')} icon={ArrowLeft}>
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-content-primary">
                {route.fromCity} → {route.toCity}
              </h1>
              <p className="text-content-secondary mt-1">Route Details</p>
            </div>
          </div>
          {canManage && (
            <Button onClick={() => navigate(`/logistics/routes/${id}/edit`)} icon={Edit}>
              Edit Route
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-border-default">
          <div className="flex gap-1">
            {(['overview', 'stations', 'costing', 'history'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab
                    ? 'border-accent-primary text-accent-primary'
                    : 'border-transparent text-content-secondary hover:text-content-primary',
                )}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-8 h-8 text-accent-primary" />
                  <div>
                    <p className="text-sm text-content-secondary">Distance</p>
                    <p className="text-xl font-bold text-content-primary">{route.distanceKm} km</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-8 h-8 text-accent-primary" />
                  <div>
                    <p className="text-sm text-content-secondary">Time</p>
                    <p className="text-xl font-bold text-content-primary">
                      {route.timeHours ? `${route.timeHours} hrs` : '—'}
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <Truck className="w-8 h-8 text-accent-primary" />
                  <div>
                    <p className="text-sm text-content-secondary">Toll Stations</p>
                    <p className="text-xl font-bold text-content-primary">
                      {route.tollStations?.filter((ts) => ts.isActive).length || 0}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-content-primary mb-4">Route Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-content-secondary">Status:</span>
                  <Badge variant={route.isActive ? 'success' : 'secondary'}>
                    {route.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {route.notes && (
                  <div>
                    <span className="text-content-secondary">Notes:</span>
                    <p className="text-content-primary mt-1">{route.notes}</p>
                  </div>
                )}
                {route.creator && (
                  <div className="flex justify-between">
                    <span className="text-content-secondary">Created by:</span>
                    <span className="text-content-primary">
                      {route.creator.firstName} {route.creator.lastName}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-content-primary mb-4">Expected Toll by Vehicle Type</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="text-content-secondary">Vehicle Type:</label>
                  <select
                    value={expectedTollVehicleType}
                    onChange={(e) => setExpectedTollVehicleType(e.target.value as VehicleType)}
                    className="px-4 py-2 rounded-lg border border-border-default bg-background-primary text-content-primary"
                  >
                    <option value="FLATBED">Flatbed</option>
                    <option value="TIPPER">Tipper</option>
                  </select>
                </div>
                {expectedToll && (
                  <div className="p-4 bg-status-info-bg rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-content-secondary">Expected Toll Total:</span>
                      <span className="text-2xl font-bold text-content-primary">
                        {parseFloat(expectedToll.total).toFixed(2)} {route.tollStations?.[0]?.tollStation?.rates?.[0]?.currency || 'USD'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'stations' && (
          <RouteStationsTab route={route} canManage={canManage} allStations={allStations?.items || []} />
        )}

        {activeTab === 'costing' && <RouteCostingTab route={route} />}

        {activeTab === 'history' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-content-primary mb-4">Change History</h3>
            <p className="text-content-secondary">History tracking coming soon...</p>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}

function RouteStationsTab({
  route,
  canManage,
  allStations,
}: {
  route: Route;
  canManage: boolean;
  allStations: TollStationType[];
}) {
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [selectedStations, setSelectedStations] = useState(
    route.tollStations
      ?.filter((ts) => ts.isActive)
      .map((ts, idx) => ({ tollStationId: ts.tollStation.id, sortOrder: idx + 1 })) || [],
  );

  const setStationsMutation = useMutation({
    mutationFn: (stations: Array<{ tollStationId: string; sortOrder: number }>) =>
      routesApi.setStations(route.id, { stations }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['route', route.id] });
      success('Route stations updated');
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to update stations'),
  });

  const addStation = (stationId: string) => {
    if (selectedStations.find((s) => s.tollStationId === stationId)) return;
    setSelectedStations([...selectedStations, { tollStationId: stationId, sortOrder: selectedStations.length + 1 }]);
  };

  const removeStation = (stationId: string) => {
    setSelectedStations(
      selectedStations.filter((s) => s.tollStationId !== stationId).map((s, idx) => ({ ...s, sortOrder: idx + 1 })),
    );
  };

  const moveStation = (index: number, direction: 'up' | 'down') => {
    const newStations = [...selectedStations];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newStations.length) return;
    [newStations[index], newStations[newIndex]] = [newStations[newIndex], newStations[index]];
    setSelectedStations(newStations.map((s, idx) => ({ ...s, sortOrder: idx + 1 })));
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-content-primary">Toll Stations</h3>
          {canManage && (
            <Button
              onClick={() => setStationsMutation.mutate(selectedStations)}
              loading={setStationsMutation.isPending}
            >
              Save Order
            </Button>
          )}
        </div>

        {selectedStations.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-border-default rounded-lg">
            <Truck className="w-12 h-12 mx-auto mb-4 text-content-tertiary" />
            <p className="text-content-secondary mb-4">No toll stations assigned</p>
            {canManage && <p className="text-sm text-content-tertiary">Select stations below to add them</p>}
          </div>
        ) : (
          <div className="space-y-2">
            {selectedStations.map((selected, idx) => {
              const station = allStations.find((s) => s.id === selected.tollStationId);
              if (!station) return null;
              return (
                <div
                  key={selected.tollStationId}
                  className="flex items-center gap-3 p-3 bg-background-secondary rounded-lg"
                >
                  <GripVertical className="w-5 h-5 text-content-tertiary" />
                  <span className="text-content-secondary w-8">{selected.sortOrder}.</span>
                  <div className="flex-1">
                    <div className="font-medium text-content-primary">{station.name}</div>
                    {station.cityOrArea && (
                      <div className="text-sm text-content-secondary">{station.cityOrArea}</div>
                    )}
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveStation(idx, 'up')}
                        disabled={idx === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveStation(idx, 'down')}
                        disabled={idx === selectedStations.length - 1}
                      >
                        ↓
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => removeStation(selected.tollStationId)} icon={Trash2}>
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {canManage && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-content-primary mb-4">Available Stations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allStations
              .filter((s) => !selectedStations.find((sel) => sel.tollStationId === s.id))
              .map((station) => (
                <div
                  key={station.id}
                  className="flex items-center justify-between p-3 border border-border-default rounded-lg hover:bg-background-secondary transition-colors"
                >
                  <div>
                    <div className="font-medium text-content-primary">{station.name}</div>
                    {station.cityOrArea && (
                      <div className="text-sm text-content-secondary">{station.cityOrArea}</div>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => addStation(station.id)} icon={Plus}>
                    Add
                  </Button>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function RouteCostingTab({ route }: { route: Route }) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-content-primary mb-4">Route Costing</h3>
      <p className="text-content-secondary">Costing calculator coming soon...</p>
      <p className="text-sm text-content-tertiary mt-2">
        Use the costing calculator to compute transport costs for this route.
      </p>
    </Card>
  );
}
