import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Package, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Modal, ModalFooter } from '@components/ui/Modal';
import { useToast } from '@contexts/ToastContext';
import { stockItemsApi, type StockItem, type CreateStockItemDto } from '@services/sales/stock-items';
import { companiesApi } from '@services/sales/companies';
import { projectsApi } from '@services/sales/projects';
import { warehousesApi } from '@services/sales/warehouses';
import { useAuth } from '@contexts/AuthContext';

export function StockItemsPage() {
  const { hasPermission, hasRole } = useAuth();
  const isAdmin = hasRole('Administrator') || hasRole('Admin') || hasRole('ADMIN');
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string | undefined>(undefined);
  const [projectFilter] = useState<string | undefined>(undefined);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadResults, setUploadResults] = useState<{ success: Array<{ row: number; name: string; sku: string }>; errors: Array<{ row: number; error: string }> } | null>(null);
  const [selectedStockItem, setSelectedStockItem] = useState<StockItem | null>(null);
  const [formData, setFormData] = useState<CreateStockItemDto>({
    companyId: '',
    projectId: '',
    warehouseId: '',
    sku: '',
    name: '',
    description: '',
    uom: '',
    minUnitPrice: 0,
    defaultUnitPrice: 0,
    minOrderQty: 1,
    truckloadOnly: false,
    isActive: true,
  });

  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await companiesApi.findAll(1, 100);
      return res.data.data;
    },
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects', formData.companyId],
    queryFn: async () => {
      const res = await projectsApi.findAll(formData.companyId, 1, 100);
      return res.data.data;
    },
    enabled: !!formData.companyId,
  });

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', formData.companyId, formData.projectId],
    queryFn: async () => {
      const res = await warehousesApi.findAll(formData.companyId, formData.projectId, 1, 100);
      return res.data.data;
    },
    enabled: !!formData.companyId,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['stock-items', companyFilter, projectFilter],
    queryFn: async () => {
      const res = await stockItemsApi.findAll(companyFilter, projectFilter, 1, 100);
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateStockItemDto) => stockItemsApi.create(data),
    onSuccess: () => {
      success('Stock item created successfully');
      queryClient.invalidateQueries({ queryKey: ['stock-items'] });
      setIsCreateModalOpen(false);
      setFormData({
        companyId: '', projectId: '', warehouseId: '', sku: '', name: '', description: '', uom: '',
        minUnitPrice: 0, defaultUnitPrice: 0, minOrderQty: 1, truckloadOnly: false, isActive: true,
      });
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to create stock item');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateStockItemDto> }) =>
      stockItemsApi.update(id, data),
    onSuccess: () => {
      success('Stock item updated successfully');
      queryClient.invalidateQueries({ queryKey: ['stock-items'] });
      setIsEditModalOpen(false);
      setSelectedStockItem(null);
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to update stock item');
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: (file: File) => stockItemsApi.bulkImport(file),
    onSuccess: (response) => {
      const results = response.data.data;
      setUploadResults(results);
      queryClient.invalidateQueries({ queryKey: ['stock-items'] });
      if (results.errors.length === 0) {
        success(`Successfully imported ${results.success.length} stock item(s)`);
        setTimeout(() => {
          setIsUploadModalOpen(false);
          setUploadFile(null);
          setUploadResults(null);
        }, 3000);
      } else {
        showError(`Imported ${results.success.length} item(s), but ${results.errors.length} error(s) occurred. Check details below.`);
      }
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to import stock items');
    },
  });

  const downloadTemplate = () => {
    // Create Excel-like CSV template
    const headers = ['Project Name', 'Warehouse Name', 'Name', 'SKU', 'Description', 'UOM', 'Min Unit Price', 'Default Unit Price', 'Min Order Qty', 'Truckload Only', 'Is Active'];
    const exampleRow = ['Katonto', 'Main Warehouse', 'Cement 50kg', 'CEM-50KG', 'Portland Cement 50kg bag', 'BAG', '8.50', '10.00', '100', 'No', 'Yes'];
    
    const csvContent = [headers, exampleRow].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'stock_items_template.csv');
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => stockItemsApi.remove(id),
    onSuccess: () => {
      success('Stock item deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['stock-items'] });
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Failed to delete stock item');
    },
  });

  const handleCreate = () => {
    if (!formData.projectId || !formData.warehouseId || !formData.name.trim() || !formData.uom.trim()) {
      showError('Project, warehouse, name, and unit of measure are required');
      return;
    }
    if (formData.defaultUnitPrice < formData.minUnitPrice) {
      showError('Default unit price must be >= min unit price');
      return;
    }
    // Remove companyId and description before sending (they're not in the schema)
    const { companyId, description, ...apiData } = formData;
    createMutation.mutate(apiData);
  };

  const handleEdit = (stockItem: StockItem) => {
    setSelectedStockItem(stockItem);
    // Get companyId from stockItem, project relation, or projectsData
    let companyId = stockItem.companyId || '';
    if (!companyId && stockItem.project?.companyId) {
      companyId = stockItem.project.companyId;
    } else if (!companyId && stockItem.projectId) {
      const project = projectsData?.items.find(p => p.id === stockItem.projectId);
      if (project) {
        companyId = project.companyId || '';
      }
    }
    
    setFormData({
      companyId: companyId,
      projectId: stockItem.projectId || '',
      warehouseId: stockItem.warehouseId || '',
      sku: stockItem.sku || '',
      name: stockItem.name,
      description: stockItem.description || '',
      uom: stockItem.uom,
      minUnitPrice: Number(stockItem.minUnitPrice),
      defaultUnitPrice: Number(stockItem.defaultUnitPrice),
      minOrderQty: Number(stockItem.minOrderQty),
      truckloadOnly: stockItem.truckloadOnly || false,
      isActive: stockItem.isActive !== undefined ? stockItem.isActive : true,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = () => {
    if (!formData.name.trim() || !formData.uom.trim()) {
      showError('Name and unit of measure are required');
      return;
    }
    if (!formData.projectId || !formData.warehouseId) {
      showError('Project and warehouse are required');
      return;
    }
    if (formData.defaultUnitPrice < formData.minUnitPrice) {
      showError('Default unit price must be >= min unit price');
      return;
    }
    if (!selectedStockItem) return;
    
    // Filter out fields that shouldn't be sent (companyId, description)
    const { companyId, description, ...updateData } = formData;
    updateMutation.mutate({ id: selectedStockItem.id, data: updateData });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this stock item? This action cannot be undone.')) {
      deleteMutation.mutate(id, {
        onError: (err: any) => {
          const errorMessage = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to delete stock item';
          if (errorMessage.includes('quote items')) {
            showError('Cannot delete stock item that is used in quotes. Please remove it from all quotes first.');
          } else {
            showError(errorMessage);
          }
        },
      });
    }
  };

  const canCreate = hasPermission('stock:create') || hasRole('Administrator');
  const canUpdate = hasPermission('stock:update') || hasRole('Administrator');
  const canDelete = hasPermission('stock:delete') || hasRole('Administrator');

  const filteredItems = (data?.items || []).filter(item => 
    !search || item.name?.toLowerCase().includes(search.toLowerCase()) ||
    item.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageContainer
      title="Stock Items"
      description="Manage inventory stock items"
      actions={
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <Button
                variant="secondary"
                onClick={downloadTemplate}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Download Template
              </Button>
              <Button
                variant="secondary"
                onClick={() => setIsUploadModalOpen(true)}
                leftIcon={<Upload className="w-4 h-4" />}
              >
                Upload Excel
              </Button>
            </>
          )}
          {(canCreate || isAdmin) && (
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Add Item
            </Button>
          )}
        </div>
      }
    >
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-content-tertiary" />
            <Input
              placeholder="Search stock items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            className="px-4 py-2 border rounded-lg bg-background-primary text-content-primary cursor-pointer hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-w-[180px]"
            value={companyFilter || ''}
            onChange={(e) => {
              const value = e.target.value;
              setCompanyFilter(value === '' ? undefined : value);
            }}
          >
            <option value="">All Companies</option>
            {companiesData?.items.map((company) => (
              <option key={company.id} value={company.id}>{company.name}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-content-secondary">Loading...</div>
      ) : filteredItems.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-content-tertiary" />
          <h3 className="text-lg font-semibold text-content-primary mb-2">No stock items found</h3>
          <p className="text-content-secondary mb-4">
            {search ? 'Try adjusting your search terms' : 'Get started by creating your first stock item'}
          </p>
          {(canCreate || isAdmin) && (
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Add Item
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-content-primary mb-1">{item.name}</h3>
                  {item.sku && <p className="text-sm text-content-secondary mb-2">SKU: {item.sku}</p>}
                  <div className="flex gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${item.isActive ? 'bg-status-success text-white' : 'bg-status-error text-white'}`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {item.truckloadOnly && (
                      <span className="text-xs bg-status-warning text-white px-2 py-1 rounded">Truckload Only</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {canUpdate && (
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(item)} leftIcon={<Edit className="w-4 h-4" />}>
                      Edit
                    </Button>
                  )}
                  {(canDelete || isAdmin) && (
                    <Button 
                      size="sm" 
                      variant="danger" 
                      onClick={() => handleDelete(item.id)} 
                      leftIcon={<Trash2 className="w-4 h-4" />}
                      disabled={deleteMutation.isPending}
                      title="Delete stock item"
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-content-secondary"><span className="font-medium">UOM:</span> {item.uom}</p>
                <p className="text-content-secondary"><span className="font-medium">Price:</span> ${Number(item.defaultUnitPrice).toFixed(2)} (Min: ${Number(item.minUnitPrice).toFixed(2)})</p>
                <p className="text-content-secondary"><span className="font-medium">Min Qty:</span> {item.minOrderQty}</p>
                {item.company && (
                  <p className="text-content-tertiary text-xs">Company: {item.company.name}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Stock Item">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium mb-2">Company *</label>
            <select
              className="w-full px-3 py-2 border rounded-lg bg-background-primary text-content-primary"
              value={formData.companyId}
              onChange={(e) => setFormData({ ...formData, companyId: e.target.value, projectId: '', warehouseId: '' })}
            >
              <option value="">Select a company</option>
              {companiesData?.items.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>
          {formData.companyId && (
            <div>
              <label className="block text-sm font-medium mb-2">Project</label>
              <select
                className="w-full px-3 py-2 border rounded-lg bg-background-primary text-content-primary"
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value, warehouseId: '' })}
              >
                <option value="">No project</option>
                {projectsData?.items.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
          )}
          {formData.companyId && (
            <div>
              <label className="block text-sm font-medium mb-2">Warehouse</label>
              <select
                className="w-full px-3 py-2 border rounded-lg bg-background-primary text-content-primary"
                value={formData.warehouseId}
                onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
              >
                <option value="">No warehouse</option>
                {warehousesData?.items.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                ))}
              </select>
            </div>
          )}
          <Input label="SKU (optional, auto-generated if empty)" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} placeholder="Leave empty to auto-generate" />
          <Input label="Product Name *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Product name" />
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg bg-background-primary text-content-primary"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Product description"
              rows={3}
            />
          </div>
          <Input label="Unit of Measure *" value={formData.uom} onChange={(e) => setFormData({ ...formData, uom: e.target.value })} placeholder="e.g., kg, ton, m³" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Min Unit Price *" type="number" step="0.01" min="0" value={formData.minUnitPrice} onChange={(e) => setFormData({ ...formData, minUnitPrice: Number(e.target.value) })} />
            <Input label="Default Unit Price *" type="number" step="0.01" min="0" value={formData.defaultUnitPrice} onChange={(e) => setFormData({ ...formData, defaultUnitPrice: Number(e.target.value) })} />
          </div>
          <Input label="Min Order Quantity *" type="number" min="1" value={formData.minOrderQty} onChange={(e) => setFormData({ ...formData, minOrderQty: Number(e.target.value) })} />
          <div className="flex items-center gap-2">
            <input type="checkbox" id="truckloadOnly" checked={formData.truckloadOnly} onChange={(e) => setFormData({ ...formData, truckloadOnly: e.target.checked })} className="w-4 h-4" />
            <label htmlFor="truckloadOnly" className="text-sm text-content-secondary">Truckload only</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4" />
            <label htmlFor="isActive" className="text-sm text-content-secondary">Active</label>
          </div>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate} isLoading={createMutation.isPending}>Create Stock Item</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setSelectedStockItem(null); }} title="Edit Stock Item">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium mb-2">Company *</label>
            <select
              className="w-full px-3 py-2 border rounded-lg bg-background-primary text-content-primary"
              value={formData.companyId}
              onChange={(e) => setFormData({ ...formData, companyId: e.target.value, projectId: '', warehouseId: '' })}
            >
              <option value="">Select a company</option>
              {companiesData?.items.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>
          {formData.companyId && (
            <div>
              <label className="block text-sm font-medium mb-2">Project</label>
              <select
                className="w-full px-3 py-2 border rounded-lg bg-background-primary text-content-primary"
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value, warehouseId: '' })}
              >
                <option value="">No project</option>
                {projectsData?.items.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
          )}
          {formData.companyId && (
            <div>
              <label className="block text-sm font-medium mb-2">Warehouse</label>
              <select
                className="w-full px-3 py-2 border rounded-lg bg-background-primary text-content-primary"
                value={formData.warehouseId}
                onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
              >
                <option value="">No warehouse</option>
                {warehousesData?.items.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                ))}
              </select>
            </div>
          )}
          <Input label="SKU (optional, auto-generated if empty)" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} placeholder="Leave empty to auto-generate" />
          <Input label="Product Name *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Product name" />
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg bg-background-primary text-content-primary"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Product description"
              rows={3}
            />
          </div>
          <Input label="Unit of Measure *" value={formData.uom} onChange={(e) => setFormData({ ...formData, uom: e.target.value })} placeholder="e.g., kg, ton, m³" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Min Unit Price *" type="number" step="0.01" min="0" value={formData.minUnitPrice} onChange={(e) => setFormData({ ...formData, minUnitPrice: Number(e.target.value) })} />
            <Input label="Default Unit Price *" type="number" step="0.01" min="0" value={formData.defaultUnitPrice} onChange={(e) => setFormData({ ...formData, defaultUnitPrice: Number(e.target.value) })} />
          </div>
          <Input label="Min Order Quantity *" type="number" min="1" value={formData.minOrderQty} onChange={(e) => setFormData({ ...formData, minOrderQty: Number(e.target.value) })} />
          <div className="flex items-center gap-2">
            <input type="checkbox" id="truckloadOnlyEdit" checked={formData.truckloadOnly} onChange={(e) => setFormData({ ...formData, truckloadOnly: e.target.checked })} className="w-4 h-4" />
            <label htmlFor="truckloadOnlyEdit" className="text-sm text-content-secondary">Truckload only</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActiveEdit" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4" />
            <label htmlFor="isActiveEdit" className="text-sm text-content-secondary">Active</label>
          </div>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => { setIsEditModalOpen(false); setSelectedStockItem(null); }}>Cancel</Button>
          <Button variant="primary" onClick={handleUpdate} isLoading={updateMutation.isPending}>Update Stock Item</Button>
        </ModalFooter>
      </Modal>
      {/* Upload Modal */}
      <Modal isOpen={isUploadModalOpen} onClose={() => { setIsUploadModalOpen(false); setUploadFile(null); setUploadResults(null); }} title="Upload Stock Items from Excel" size="lg">
        <div className="space-y-4">
          <div className="p-3 bg-status-info-bg border-l-4 border-status-info rounded-r-lg">
            <div className="flex items-start gap-2">
              <FileSpreadsheet className="w-4 h-4 text-status-info mt-0.5 flex-shrink-0" />
              <div className="text-xs text-content-secondary">
                <p className="font-medium mb-1">Excel Format Requirements:</p>
                <p>Columns: Project Name, Warehouse Name, Name, SKU (optional), Description (optional), UOM, Min Unit Price, Default Unit Price, Min Order Qty, Truckload Only (Yes/No), Is Active (Yes/No)</p>
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
                    Successfully imported {uploadResults.success.length} item(s):
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {uploadResults.success.map((item, idx) => (
                      <p key={idx} className="text-xs text-content-secondary">
                        Row {item.row}: {item.name} (SKU: {item.sku})
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
          <Button variant="secondary" onClick={() => { setIsUploadModalOpen(false); setUploadFile(null); setUploadResults(null); }}>
            {uploadResults ? 'Close' : 'Cancel'}
          </Button>
          {!uploadResults && (
            <Button
              variant="primary"
              onClick={handleUpload}
              isLoading={bulkImportMutation.isPending}
              disabled={!uploadFile}
              leftIcon={<Upload className="w-4 h-4" />}
            >
              Upload & Import
            </Button>
          )}
        </ModalFooter>
      </Modal>
    </PageContainer>
  );
}
