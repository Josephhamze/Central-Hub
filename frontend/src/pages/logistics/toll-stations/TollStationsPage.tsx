import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, MapPin, DollarSign, Edit, Trash2, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Input } from '@components/ui/Input';
import { Modal, ModalFooter } from '@components/ui/Modal';
import { useToast } from '@contexts/ToastContext';
import { useAuth } from '@contexts/AuthContext';
import { tollStationsApi, type TollStation, type TollRate, type VehicleType } from '@services/logistics/toll-stations';

export function TollStationsPage() {
  const { hasPermission } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editStation, setEditStation] = useState<TollStation | null>(null);
  const [selectedStation, setSelectedStation] = useState<TollStation | null>(null);
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<TollRate | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadResults, setUploadResults] = useState<{ success: Array<{ row: number; name: string; ratesCreated: number }>; errors: Array<{ row: number; error: string }> } | null>(null);

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

  const bulkImportMutation = useMutation({
    mutationFn: (file: File) => tollStationsApi.bulkImport(file),
    onSuccess: (response) => {
      const results = response.data.data;
      setUploadResults(results);
      queryClient.invalidateQueries({ queryKey: ['toll-stations'] });
      if (results.errors.length === 0) {
        success(`Successfully imported ${results.success.length} toll station(s)`);
        setTimeout(() => {
          setIsUploadModalOpen(false);
          setUploadFile(null);
          setUploadResults(null);
        }, 3000);
      } else {
        showError(`Imported ${results.success.length} station(s), but ${results.errors.length} error(s) occurred. Check details below.`);
      }
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to import toll stations');
    },
  });

  const downloadTemplate = () => {
    // Create Excel-like CSV template
    const headers = ['Name', 'City/Area', 'Code', 'Is Active', 'FLATBED Rate', 'TIPPER Rate', 'Currency', 'Effective From', 'Effective To'];
    const exampleRow = ['Kasumbalesa Border', 'Kasumbalesa', 'KAS-001', 'Yes', '25.00', '30.00', 'USD', '2026-01-01', ''];
    
    const csvContent = [headers, exampleRow].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'toll_stations_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Template downloaded. You can open it in Excel and save as .xlsx format.');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
        showError('Please select an Excel file (.xlsx, .xls) or CSV file');
        return;
      }
      setUploadFile(file);
      setUploadResults(null);
    }
  };

  const handleUpload = () => {
    if (!uploadFile) {
      showError('Please select a file');
      return;
    }
    bulkImportMutation.mutate(uploadFile);
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-content-primary">Toll Stations</h1>
            <p className="text-content-secondary mt-1">Manage toll stations and rates by vehicle type</p>
          </div>
          {canManage && (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={downloadTemplate}
                leftIcon={<Download />}
              >
                Download Template
              </Button>
              <Button
                variant="secondary"
                onClick={() => setIsUploadModalOpen(true)}
                leftIcon={<Upload />}
              >
                Upload Excel
              </Button>
              <Button onClick={() => setCreateModalOpen(true)} leftIcon={<Plus />}>
                New Station
              </Button>
            </div>
          )}
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search stations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search />}
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
              <Button onClick={() => setCreateModalOpen(true)} leftIcon={<Plus />}>
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

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setUploadFile(null);
          setUploadResults(null);
        }}
        title="Upload Toll Stations from Excel"
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-3 bg-status-info-bg border-l-4 border-status-info rounded-r-lg">
            <div className="flex items-start gap-2">
              <FileSpreadsheet className="w-4 h-4 text-status-info mt-0.5 flex-shrink-0" />
              <div className="text-xs text-content-secondary">
                <p className="font-medium mb-1">Excel Format Requirements:</p>
                <p>Columns: Name (required), City/Area (optional), Code (optional), Is Active (Yes/No), FLATBED Rate (optional), TIPPER Rate (optional), Currency (optional, default USD), Effective From (optional date), Effective To (optional date)</p>
                <p className="mt-2">
                  <button onClick={downloadTemplate} className="text-accent-primary hover:underline">
                    Download template
                  </button>
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-content-primary mb-2">
              Select Excel File (.xlsx, .xls)
            </label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="block w-full text-sm text-content-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-accent-primary file:text-white hover:file:bg-accent-primary-hover"
            />
            {uploadFile && (
              <p className="mt-2 text-sm text-content-secondary">
                Selected: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {uploadResults && (
            <div className="space-y-3">
              {uploadResults.success.length > 0 && (
                <div className="p-3 bg-status-success-bg border border-status-success rounded-lg">
                  <p className="text-sm font-medium text-status-success mb-2">
                    Successfully imported {uploadResults.success.length} toll station(s):
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {uploadResults.success.map((item, idx) => (
                      <p key={idx} className="text-xs text-content-secondary">
                        Row {item.row}: {item.name} ({item.ratesCreated} rate{item.ratesCreated !== 1 ? 's' : ''} created)
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {uploadResults.errors.length > 0 && (
                <div className="p-3 bg-status-error-bg border border-status-error rounded-lg">
                  <p className="text-sm font-medium text-status-error mb-2">
                    {uploadResults.errors.length} error(s) occurred:
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {uploadResults.errors.map((error, idx) => (
                      <p key={idx} className="text-xs text-content-secondary">
                        Row {error.row}: {error.error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setIsUploadModalOpen(false);
              setUploadFile(null);
              setUploadResults(null);
            }}
          >
            {uploadResults ? 'Close' : 'Cancel'}
          </Button>
          {!uploadResults && (
            <Button
              variant="primary"
              onClick={handleUpload}
              isLoading={bulkImportMutation.isPending}
              disabled={!uploadFile}
              leftIcon={<Upload />}
            >
              Upload & Import
            </Button>
          )}
        </ModalFooter>
      </Modal>
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
            <Badge variant="default" className="text-xs">
              {station.code}
            </Badge>
          )}
        </div>
        <Badge variant={station.isActive ? 'success' : 'default'}>
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
            <Button variant="ghost" size="sm" onClick={onEdit} leftIcon={<Edit />} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteMutation.mutate()}
              leftIcon={<Trash2 />}
              isLoading={deleteMutation.isPending}
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
    name: '',
    cityOrArea: '',
    code: '',
    isActive: true,
  });

  // Update form data when station prop changes
  useEffect(() => {
    if (station) {
      setFormData({
        name: station.name || '',
        cityOrArea: station.cityOrArea || '',
        code: station.code || '',
        isActive: station.isActive !== undefined ? station.isActive : true,
      });
    } else {
      // Reset form when creating new station
      setFormData({
        name: '',
        cityOrArea: '',
        code: '',
        isActive: true,
      });
    }
  }, [station]);

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
          isLoading={createMutation.isPending || updateMutation.isPending}
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
    mutationFn: () => {
      // Prepare data: convert empty strings to undefined for optional fields
      const rateData = {
        vehicleType: rateForm.vehicleType,
        amount: Number(rateForm.amount),
        currency: rateForm.currency || 'USD',
        effectiveFrom: rateForm.effectiveFrom || undefined,
        effectiveTo: rateForm.effectiveTo || undefined,
        isActive: rateForm.isActive,
      };
      return tollStationsApi.createRate(station.id, rateData);
    },
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
    mutationFn: () => {
      // Prepare data: convert empty strings to undefined for optional fields
      const rateData = {
        vehicleType: rateForm.vehicleType,
        amount: Number(rateForm.amount),
        currency: rateForm.currency || 'USD',
        effectiveFrom: rateForm.effectiveFrom || undefined,
        effectiveTo: rateForm.effectiveTo || undefined,
        isActive: rateForm.isActive,
      };
      return tollStationsApi.updateRate(station.id, editingRate!.id, rateData);
    },
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
                    <Badge variant={rate.isActive ? 'success' : 'default'}>
                      {rate.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {canManage && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => onEditRate(rate)} leftIcon={<Edit />}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRateMutation.mutate(rate.id)}
                          leftIcon={<Trash2 />}
                          isLoading={deleteRateMutation.isPending}
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
                min="0"
                value={rateForm.amount}
                onChange={(e) => {
                  const value = e.target.value;
                  setRateForm({ ...rateForm, amount: value === '' ? 0 : parseFloat(value) || 0 });
                }}
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
                  isLoading={createRateMutation.isPending || updateRateMutation.isPending}
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
