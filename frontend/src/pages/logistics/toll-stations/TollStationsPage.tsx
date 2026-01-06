import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, MapPin, DollarSign, Edit, Trash2, X } from 'lucide-react';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Input } from '@components/ui/Input';
import { Modal, ModalFooter } from '@components/ui/Modal';
import { useToast } from '@contexts/ToastContext';
import { useAuth } from '@contexts/AuthContext';
import { tollStationsApi, type TollStation, type TollRate, type VehicleType } from '@services/logistics/toll-stations';
import { cn } from '@utils/cn';

export function TollStationsPage() {
  const { success, error: showError } = useToast();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editStation, setEditStation] = useState<TollStation | null>(null);
  const [selectedStation, setSelectedStation] = useState<TollStation | null>(null);
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<TollRate | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['toll-stations', search, isActiveFilter],
    queryFn: async () => {
      const res = await tollStationsApi.findAll(1, 100, {
        search: search || undefined,
        isActive: isActiveFilter,
      });
      return res.data.data;
    },
  });

  const canManage = hasPermission('logistics:tolls:manage');

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-content-primary">Toll Stations</h1>
            <p className="text-content-secondary mt-1">Manage toll stations and rates by vehicle type</p>
          </div>
          {canManage && (
            <Button onClick={() => setCreateModalOpen(true)} icon={Plus}>
              New Station
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search stations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
            <select
              value={isActiveFilter === undefined ? '' : isActiveFilter ? 'active' : 'inactive'}
              onChange={(e) => setIsActiveFilter(e.target.value === '' ? undefined : e.target.value === 'active')}
              className="px-4 py-2 rounded-lg border border-border-default bg-background-primary text-content-primary"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </Card>

        {/* Stations Grid */}
        {isLoading ? (
          <Card className="p-12 text-center">
            <p className="text-content-secondary">Loading stations...</p>
          </Card>
        ) : data?.items.length === 0 ? (
          <Card className="p-12 text-center border-2 border-dashed border-border-default">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-content-tertiary" />
            <p className="text-lg font-semibold text-content-primary mb-2">No toll stations found</p>
            <p className="text-content-secondary mb-4">Get started by creating your first toll station</p>
            {canManage && (
              <Button onClick={() => setCreateModalOpen(true)} icon={Plus}>
                Create Station
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.items.map((station) => (
              <TollStationCard
                key={station.id}
                station={station}
                canManage={canManage}
                onEdit={() => setEditStation(station)}
                onViewRates={() => {
                  setSelectedStation(station);
                  setRateModalOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Station Modal */}
      <StationModal
        isOpen={createModalOpen || !!editStation}
        onClose={() => {
          setCreateModalOpen(false);
          setEditStation(null);
        }}
        station={editStation}
      />

      {/* Rates Modal */}
      {selectedStation && (
        <RatesModal
          isOpen={rateModalOpen}
          onClose={() => {
            setRateModalOpen(false);
            setSelectedStation(null);
            setEditingRate(null);
          }}
          station={selectedStation}
          editingRate={editingRate}
          onEditRate={(rate) => {
            setEditingRate(rate);
            setRateModalOpen(true);
          }}
        />
      )}
    </PageContainer>
  );
}

function TollStationCard({
  station,
  canManage,
  onEdit,
  onViewRates,
}: {
  station: TollStation;
  canManage: boolean;
  onEdit: () => void;
  onViewRates: () => void;
}) {
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => tollStationsApi.remove(station.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['toll-stations'] });
      success('Toll station deleted');
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to delete station'),
  });

  return (
    <Card className="p-5 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-content-primary mb-1">{station.name}</h3>
          {station.cityOrArea && (
            <p className="text-sm text-content-secondary mb-1">{station.cityOrArea}</p>
          )}
          {station.code && (
            <Badge variant="secondary" className="text-xs">
              {station.code}
            </Badge>
          )}
        </div>
        <Badge variant={station.isActive ? 'success' : 'secondary'}>
          {station.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-sm text-content-secondary mb-4">
        <span>{station.rates?.length || 0} rate{station.rates?.length !== 1 ? 's' : ''}</span>
        <span>{station._count?.routeStations || 0} route{station._count?.routeStations !== 1 ? 's' : ''}</span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onViewRates} className="flex-1">
          <DollarSign className="w-4 h-4 mr-1" />
          Rates
        </Button>
        {canManage && (
          <>
            <Button variant="ghost" size="sm" onClick={onEdit} icon={Edit} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteMutation.mutate()}
              icon={Trash2}
              loading={deleteMutation.isPending}
            />
          </>
        )}
      </div>
    </Card>
  );
}

function StationModal({
  isOpen,
  onClose,
  station,
}: {
  isOpen: boolean;
  onClose: () => void;
  station: TollStation | null;
}) {
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: station?.name || '',
    cityOrArea: station?.cityOrArea || '',
    code: station?.code || '',
    isActive: station?.isActive !== undefined ? station.isActive : true,
  });

  const createMutation = useMutation({
    mutationFn: () => tollStationsApi.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['toll-stations'] });
      success('Toll station created');
      onClose();
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to create station'),
  });

  const updateMutation = useMutation({
    mutationFn: () => tollStationsApi.update(station!.id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['toll-stations'] });
      success('Toll station updated');
      onClose();
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to update station'),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={station ? 'Edit Toll Station' : 'New Toll Station'}>
      <div className="space-y-4">
        <Input
          label="Name *"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <Input
          label="City/Area"
          value={formData.cityOrArea}
          onChange={(e) => setFormData({ ...formData, cityOrArea: e.target.value })}
        />
        <Input
          label="Code (optional, unique)"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
        />
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
      </div>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={() => (station ? updateMutation.mutate() : createMutation.mutate())}
          loading={createMutation.isPending || updateMutation.isPending}
        >
          {station ? 'Update' : 'Create'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

function RatesModal({
  isOpen,
  onClose,
  station,
  editingRate,
  onEditRate,
}: {
  isOpen: boolean;
  onClose: () => void;
  station: TollStation;
  editingRate: TollRate | null;
  onEditRate: (rate: TollRate) => void;
}) {
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [rateForm, setRateForm] = useState({
    vehicleType: (editingRate?.vehicleType || 'FLATBED') as VehicleType,
    amount: editingRate?.amount || 0,
    currency: editingRate?.currency || 'USD',
    effectiveFrom: editingRate?.effectiveFrom?.split('T')[0] || '',
    effectiveTo: editingRate?.effectiveTo?.split('T')[0] || '',
    isActive: editingRate?.isActive !== undefined ? editingRate.isActive : true,
  });

  const { data: rates } = useQuery({
    queryKey: ['toll-station-rates', station.id],
    queryFn: async () => {
      const res = await tollStationsApi.getRates(station.id);
      return res.data.data;
    },
    enabled: isOpen,
  });

  const createRateMutation = useMutation({
    mutationFn: () => tollStationsApi.createRate(station.id, rateForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['toll-station-rates', station.id] });
      queryClient.invalidateQueries({ queryKey: ['toll-stations'] });
      success('Toll rate created');
      setRateForm({
        vehicleType: 'FLATBED',
        amount: 0,
        currency: 'USD',
        effectiveFrom: '',
        effectiveTo: '',
        isActive: true,
      });
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to create rate'),
  });

  const updateRateMutation = useMutation({
    mutationFn: () => tollStationsApi.updateRate(station.id, editingRate!.id, rateForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['toll-station-rates', station.id] });
      queryClient.invalidateQueries({ queryKey: ['toll-stations'] });
      success('Toll rate updated');
      onEditRate(null as any);
      setRateForm({
        vehicleType: 'FLATBED',
        amount: 0,
        currency: 'USD',
        effectiveFrom: '',
        effectiveTo: '',
        isActive: true,
      });
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to update rate'),
  });

  const deleteRateMutation = useMutation({
    mutationFn: (rateId: string) => tollStationsApi.removeRate(station.id, rateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['toll-station-rates', station.id] });
      queryClient.invalidateQueries({ queryKey: ['toll-stations'] });
      success('Toll rate deleted');
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to delete rate'),
  });

  const canManage = hasPermission('logistics:tolls:manage');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Toll Rates - ${station.name}`} size="lg">
      <div className="space-y-6">
        {/* Existing Rates */}
        <div>
          <h3 className="text-sm font-semibold text-content-primary mb-3">Current Rates</h3>
          {rates && rates.length > 0 ? (
            <div className="space-y-2">
              {rates.map((rate) => (
                <div
                  key={rate.id}
                  className="flex items-center justify-between p-3 bg-background-secondary rounded-lg"
                >
                  <div>
                    <div className="font-medium text-content-primary">
                      {rate.vehicleType} - {rate.amount} {rate.currency}
                    </div>
                    {rate.effectiveFrom || rate.effectiveTo ? (
                      <div className="text-sm text-content-secondary">
                        {rate.effectiveFrom && `From: ${rate.effectiveFrom.split('T')[0]}`}
                        {rate.effectiveFrom && rate.effectiveTo && ' • '}
                        {rate.effectiveTo && `To: ${rate.effectiveTo.split('T')[0]}`}
                      </div>
                    ) : (
                      <div className="text-sm text-content-secondary">No date restrictions</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={rate.isActive ? 'success' : 'secondary'}>
                      {rate.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {canManage && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => onEditRate(rate)} icon={Edit}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRateMutation.mutate(rate.id)}
                          icon={Trash2}
                          loading={deleteRateMutation.isPending}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-content-secondary text-sm">No rates configured</p>
          )}
        </div>

        {/* Add/Edit Rate Form */}
        {canManage && (
          <div className="border-t border-border-default pt-4">
            <h3 className="text-sm font-semibold text-content-primary mb-3">
              {editingRate ? 'Edit Rate' : 'Add New Rate'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1 text-content-primary">Vehicle Type *</label>
                <select
                  value={rateForm.vehicleType}
                  onChange={(e) => setRateForm({ ...rateForm, vehicleType: e.target.value as VehicleType })}
                  className="w-full px-4 py-2 rounded-lg border border-border-default bg-background-primary text-content-primary"
                >
                  <option value="FLATBED">Flatbed</option>
                  <option value="TIPPER">Tipper</option>
                </select>
              </div>
              <Input
                label="Amount *"
                type="number"
                step="0.01"
                value={rateForm.amount}
                onChange={(e) => setRateForm({ ...rateForm, amount: parseFloat(e.target.value) || 0 })}
                required
              />
              <Input
                label="Currency"
                value={rateForm.currency}
                onChange={(e) => setRateForm({ ...rateForm, currency: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Effective From"
                  type="date"
                  value={rateForm.effectiveFrom}
                  onChange={(e) => setRateForm({ ...rateForm, effectiveFrom: e.target.value })}
                />
                <Input
                  label="Effective To"
                  type="date"
                  value={rateForm.effectiveTo}
                  onChange={(e) => setRateForm({ ...rateForm, effectiveTo: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rateIsActive"
                  checked={rateForm.isActive}
                  onChange={(e) => setRateForm({ ...rateForm, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="rateIsActive" className="text-sm text-content-primary">
                  Active
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => (editingRate ? updateRateMutation.mutate() : createRateMutation.mutate())}
                  loading={createRateMutation.isPending || updateRateMutation.isPending}
                  className="flex-1"
                >
                  {editingRate ? 'Update Rate' : 'Add Rate'}
                </Button>
                {editingRate && (
                  <Button variant="secondary" onClick={() => onEditRate(null as any)}>
                    Cancel Edit
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
}
