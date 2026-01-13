import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TrendingUp } from 'lucide-react';
import { PageContainer } from '@components/layout/PageContainer';
import { Card, CardHeader } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Badge } from '@components/ui/Badge';
import { Modal, ModalFooter } from '@components/ui/Modal';
import { stockLevelsApi, type StockLevel } from '@services/quarry-production/stock';
import { productTypesApi, stockpileLocationsApi } from '@services/quarry-production/settings';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@contexts/ToastContext';

export function StockLevelsPage() {
  const { hasPermission } = useAuth();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [productTypeFilter, setProductTypeFilter] = useState('');
  const [stockpileLocationFilter, setStockpileLocationFilter] = useState('');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustingStock, setAdjustingStock] = useState<StockLevel | null>(null);
  const [adjustmentData, setAdjustmentData] = useState({
    adjustments: 0,
    adjustmentReason: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['stock-levels', dateFilter, productTypeFilter, stockpileLocationFilter],
    queryFn: async () => {
      const response = await stockLevelsApi.list({
        page: 1,
        limit: 100,
        dateFrom: dateFilter,
        dateTo: dateFilter,
        productTypeId: productTypeFilter || undefined,
        stockpileLocationId: stockpileLocationFilter || undefined,
      });
      return response.data.data;
    },
  });

  const { data: currentStock } = useQuery({
    queryKey: ['stock-levels', 'current', productTypeFilter, stockpileLocationFilter],
    queryFn: async () => {
      const response = await stockLevelsApi.getCurrent({
        productTypeId: productTypeFilter || undefined,
        stockpileLocationId: stockpileLocationFilter || undefined,
      });
      return response.data.data;
    },
  });

  const { data: productTypesData } = useQuery({
    queryKey: ['product-types', 'active'],
    queryFn: () => productTypesApi.list({ page: 1, limit: 100, isActive: true }),
  });

  const { data: stockpileLocationsData } = useQuery({
    queryKey: ['stockpile-locations', 'active'],
    queryFn: () => stockpileLocationsApi.list({ page: 1, limit: 100, isActive: true }),
  });

  const canAdjust = hasPermission('quarry:stock:adjust');

  const adjustMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { adjustments: number; adjustmentReason: string } }) =>
      stockLevelsApi.adjust(id, data),
    onSuccess: () => {
      success('Stock adjusted successfully');
      queryClient.invalidateQueries({ queryKey: ['stock-levels'] });
      setIsAdjustModalOpen(false);
      setAdjustingStock(null);
      setAdjustmentData({ adjustments: 0, adjustmentReason: '' });
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to adjust stock'),
  });

  const handleAdjust = (stock: StockLevel) => {
    setAdjustingStock(stock);
    setAdjustmentData({ adjustments: 0, adjustmentReason: '' });
    setIsAdjustModalOpen(true);
  };

  const handleSubmitAdjustment = () => {
    if (!adjustingStock) return;
    if (!adjustmentData.adjustmentReason.trim()) {
      showError('Please provide a reason for the adjustment');
      return;
    }
    adjustMutation.mutate({
      id: adjustingStock.id,
      data: {
        adjustments: adjustmentData.adjustments,
        adjustmentReason: adjustmentData.adjustmentReason,
      },
    });
  };

  return (
    <PageContainer
      title="Stock Levels"
      description="Manage finished product inventory"
    >
      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            type="date"
            label="Date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-2">Product Type</label>
            <select
              value={productTypeFilter}
              onChange={(e) => setProductTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-tertiary text-content-primary"
            >
              <option value="">All Products</option>
              {productTypesData?.data.data.items.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-2">Stockpile Location</label>
            <select
              value={stockpileLocationFilter}
              onChange={(e) => setStockpileLocationFilter(e.target.value)}
              className="w-full px-3 py-2 border border-border-default rounded-lg bg-bg-tertiary text-content-primary"
            >
              <option value="">All Locations</option>
              {stockpileLocationsData?.data.data.items.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Current Stock Summary */}
      {currentStock && currentStock.length > 0 && (
        <Card className="mb-6">
          <CardHeader title="Current Stock Summary" />
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {currentStock.map((stock) => (
                <div key={`${stock.productTypeId}-${stock.stockpileLocationId}`} className="bg-bg-elevated p-4 rounded-lg">
                  <div className="text-sm text-content-secondary mb-1">
                    {stock.productType?.name} - {stock.stockpileLocation?.name}
                  </div>
                  <div className="text-2xl font-bold text-content-primary">
                    {stock.closingStock.toFixed(2)} t
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Stock Levels Table */}
      <Card>
        {isLoading ? (
          <div className="p-8 text-center text-content-secondary">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="text-left p-4 text-sm font-medium text-content-secondary">Date</th>
                  <th className="text-left p-4 text-sm font-medium text-content-secondary">Product</th>
                  <th className="text-left p-4 text-sm font-medium text-content-secondary">Location</th>
                  <th className="text-right p-4 text-sm font-medium text-content-secondary">Opening</th>
                  <th className="text-right p-4 text-sm font-medium text-content-secondary">Produced</th>
                  <th className="text-right p-4 text-sm font-medium text-content-secondary">Sold</th>
                  <th className="text-right p-4 text-sm font-medium text-content-secondary">Adjustments</th>
                  <th className="text-right p-4 text-sm font-medium text-content-secondary">Closing</th>
                  <th className="text-right p-4 text-sm font-medium text-content-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((stock) => (
                  <tr key={stock.id} className="border-b border-border-default hover:bg-bg-hover">
                    <td className="p-4 text-content-primary">{new Date(stock.date).toLocaleDateString()}</td>
                    <td className="p-4 text-content-primary">{stock.productType?.name || 'N/A'}</td>
                    <td className="p-4 text-content-primary">{stock.stockpileLocation?.name || 'N/A'}</td>
                    <td className="p-4 text-right text-content-primary">{stock.openingStock.toFixed(2)}</td>
                    <td className="p-4 text-right text-status-success">{stock.produced.toFixed(2)}</td>
                    <td className="p-4 text-right text-status-error">{stock.sold.toFixed(2)}</td>
                    <td className="p-4 text-right">
                      {stock.adjustments !== 0 && (
                        <Badge variant={stock.adjustments > 0 ? 'success' : 'error'}>
                          {stock.adjustments > 0 ? '+' : ''}{stock.adjustments.toFixed(2)}
                        </Badge>
                      )}
                      {stock.adjustments === 0 && <span className="text-content-tertiary">0.00</span>}
                    </td>
                    <td className="p-4 text-right text-content-primary font-medium">
                      {stock.closingStock.toFixed(2)}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end">
                        {canAdjust && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAdjust(stock)}
                            leftIcon={<TrendingUp className="w-4 h-4" />}
                          >
                            Adjust
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data?.items.length === 0 && (
              <div className="p-8 text-center text-content-secondary">No stock levels found</div>
            )}
          </div>
        )}
      </Card>

      {/* Adjustment Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => {
          setIsAdjustModalOpen(false);
          setAdjustingStock(null);
          setAdjustmentData({ adjustments: 0, adjustmentReason: '' });
        }}
        title="Adjust Stock Level"
      >
        {adjustingStock && (
          <div className="space-y-4">
            <div className="bg-bg-elevated p-3 rounded-lg">
              <div className="text-sm text-content-secondary mb-1">Product</div>
              <div className="text-content-primary font-medium">
                {adjustingStock.productType?.name} - {adjustingStock.stockpileLocation?.name}
              </div>
              <div className="text-sm text-content-secondary mt-2">Current Closing Stock: {adjustingStock.closingStock.toFixed(2)} t</div>
            </div>
            <Input
              label="Adjustment Amount"
              type="number"
              step="0.01"
              value={adjustmentData.adjustments}
              onChange={(e) => setAdjustmentData({ ...adjustmentData, adjustments: parseFloat(e.target.value) || 0 })}
              placeholder="Positive for increase, negative for decrease"
              required
            />
            {adjustmentData.adjustments !== 0 && (
              <div className="bg-bg-elevated p-3 rounded-lg">
                <div className="text-sm text-content-secondary mb-1">New Closing Stock:</div>
                <div className="text-content-primary font-medium">
                  {(adjustingStock.closingStock + adjustmentData.adjustments).toFixed(2)} t
                </div>
              </div>
            )}
            <Input
              label="Reason for Adjustment *"
              value={adjustmentData.adjustmentReason}
              onChange={(e) => setAdjustmentData({ ...adjustmentData, adjustmentReason: e.target.value })}
              placeholder="e.g., Stock count discrepancy, Damage, etc."
              required
            />
          </div>
        )}
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setIsAdjustModalOpen(false);
              setAdjustingStock(null);
              setAdjustmentData({ adjustments: 0, adjustmentReason: '' });
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmitAdjustment}
            isLoading={adjustMutation.isPending}
            disabled={adjustmentData.adjustments === 0 || !adjustmentData.adjustmentReason.trim()}
          >
            Apply Adjustment
          </Button>
        </ModalFooter>
      </Modal>
    </PageContainer>
  );
}
