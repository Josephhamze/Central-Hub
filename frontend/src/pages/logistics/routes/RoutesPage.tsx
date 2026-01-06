import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, MapPin, Clock, Truck, Edit, Trash2, Eye, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Input } from '@components/ui/Input';
import { Modal, ModalFooter } from '@components/ui/Modal';
import { useToast } from '@contexts/ToastContext';
import { useAuth } from '@contexts/AuthContext';
import { routesApi, type Route } from '@services/logistics/routes';

export function RoutesPage() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<Route | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadResults, setUploadResults] = useState<{ success: Array<{ row: number; fromCity: string; toCity: string }>; errors: Array<{ row: number; error: string }> } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['routes', search, fromCity, toCity, isActiveFilter],
    queryFn: async () => {
      const res = await routesApi.findAll(1, 100, {
        search: search || undefined,
        fromCity: fromCity || undefined,
        toCity: toCity || undefined,
        isActive: isActiveFilter,
      });
      return res.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => routesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      success('Route deleted');
      setDeleteModalOpen(false);
      setRouteToDelete(null);
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to delete route'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => routesApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      success('Route deactivated');
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to deactivate route'),
  });

  const bulkImportMutation = useMutation({
    mutationFn: (file: File) => routesApi.bulkImport(file),
    onSuccess: (response) => {
      const results = response.data.data;
      setUploadResults(results);
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      if (results.errors.length === 0) {
        success(`Successfully imported ${results.success.length} route(s)`);
        setTimeout(() => {
          setIsUploadModalOpen(false);
          setUploadFile(null);
          setUploadResults(null);
        }, 3000);
      } else {
        showError(`Imported ${results.success.length} route(s), but ${results.errors.length} error(s) occurred. Check details below.`);
      }
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to import routes');
    },
  });

  const downloadTemplate = () => {
    // Create Excel-like CSV template
    const headers = ['From City', 'To City', 'Distance (km)', 'Time (hours)', 'Cost Per Km', 'Notes', 'Is Active'];
    const exampleRow = ['LUBUMBASHI TOWN', 'GCK LIKASI', '140', '5', '0.11', 'Main route via Kasumbalesa', 'Yes'];
    
    const csvContent = [headers, exampleRow].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'routes_template.csv');
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

  const canManage = hasPermission('logistics:routes:manage');

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-content-primary">Routes</h1>
            <p className="text-content-secondary mt-1">Manage delivery routes and toll stations</p>
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
              <Button onClick={() => navigate('/logistics/routes/new')} leftIcon={<Plus />}>
                New Route
              </Button>
            </div>
          )}
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search routes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search />}
            />
            <Input
              placeholder="From city..."
              value={fromCity}
              onChange={(e) => setFromCity(e.target.value)}
            />
            <Input
              placeholder="To city..."
              value={toCity}
              onChange={(e) => setToCity(e.target.value)}
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

        {/* Routes Table */}
        {isLoading ? (
          <Card className="p-12 text-center">
            <p className="text-content-secondary">Loading routes...</p>
          </Card>
        ) : data?.items.length === 0 ? (
          <Card className="p-12 text-center border-2 border-dashed border-border-default">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-content-tertiary" />
            <p className="text-lg font-semibold text-content-primary mb-2">No routes found</p>
            <p className="text-content-secondary mb-4">Get started by creating your first route</p>
            {canManage && (
              <Button onClick={() => navigate('/logistics/routes/new')} leftIcon={<Plus />}>
                Create Route
              </Button>
            )}
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background-secondary border-b border-border-default">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-content-primary">Route</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-content-primary">Distance</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-content-primary">Time</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-content-primary">Toll Stations</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-content-primary">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-content-primary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {data?.items.map((route) => (
                    <tr key={route.id} className="hover:bg-background-secondary transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-content-tertiary" />
                          <div>
                            <div className="font-medium text-content-primary">
                              {route.fromCity} → {route.toCity}
                            </div>
                            {route.notes && (
                              <div className="text-sm text-content-secondary">{route.notes}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-content-primary">{route.distanceKm} km</td>
                      <td className="px-4 py-3 text-content-primary">
                        {route.timeHours ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-content-tertiary" />
                            {route.timeHours} hrs
                          </div>
                        ) : (
                          <span className="text-content-tertiary">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-content-tertiary" />
                          <span className="text-content-primary">
                            {route.tollStations?.filter((ts) => ts.isActive).length || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={route.isActive ? 'success' : 'default'}>
                          {route.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/logistics/routes/${route.id}`)}
                            leftIcon={<Eye />}
                          >
                            View
                          </Button>
                          {canManage && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/logistics/routes/${route.id}/edit`)}
                                leftIcon={<Edit />}
                              >
                                Edit
                              </Button>
                              {route.isActive && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deactivateMutation.mutate(route.id)}
                                  leftIcon={<Trash2 />}
                                >
                                  Deactivate
                                </Button>
                              )}
                              {!route.isActive && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setRouteToDelete(route);
                                    setDeleteModalOpen(true);
                                  }}
                                  leftIcon={<Trash2 />}
                                >
                                  Delete
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setRouteToDelete(null);
        }}
        title="Delete Route"
      >
        <p className="text-content-secondary">
          Are you sure you want to delete the route from {routeToDelete?.fromCity} to {routeToDelete?.toCity}?
          This action cannot be undone.
        </p>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setDeleteModalOpen(false);
              setRouteToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => routeToDelete && deleteMutation.mutate(routeToDelete.id)}
            isLoading={deleteMutation.isPending}
          >
            Delete
          </Button>
        </ModalFooter>
      </Modal>

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setUploadFile(null);
          setUploadResults(null);
        }}
        title="Upload Routes from Excel"
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-3 bg-status-info-bg border-l-4 border-status-info rounded-r-lg">
            <div className="flex items-start gap-2">
              <FileSpreadsheet className="w-4 h-4 text-status-info mt-0.5 flex-shrink-0" />
              <div className="text-xs text-content-secondary">
                <p className="font-medium mb-1">Excel Format Requirements:</p>
                <p>Columns: From City, To City, Distance (km), Time (hours) (optional), Cost Per Km (optional), Notes (optional), Is Active (Yes/No)</p>
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
                    Successfully imported {uploadResults.success.length} route(s):
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {uploadResults.success.map((item, idx) => (
                      <p key={idx} className="text-xs text-content-secondary">
                        Row {item.row}: {item.fromCity} → {item.toCity}
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
