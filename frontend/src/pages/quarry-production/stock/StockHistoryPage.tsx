import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Badge } from '@components/ui/Badge';
import { stockLevelsApi } from '@services/quarry-production/stock';
import { productTypesApi, stockpileLocationsApi } from '@services/quarry-production/settings';

export function StockHistoryPage() {
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [productTypeFilter, setProductTypeFilter] = useState('');
  const [stockpileLocationFilter, setStockpileLocationFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['stock-levels', 'history', dateFrom, dateTo, productTypeFilter, stockpileLocationFilter],
    queryFn: () => stockLevelsApi.list({
      page: 1,
      limit: 200,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      productTypeId: productTypeFilter || undefined,
      stockpileLocationId: stockpileLocationFilter || undefined,
    }),
  });

  const { data: productTypesData } = useQuery({
    queryKey: ['product-types', 'active'],
    queryFn: () => productTypesApi.list({ page: 1, limit: 100, isActive: true }),
  });

  const { data: stockpileLocationsData } = useQuery({
    queryKey: ['stockpile-locations', 'active'],
    queryFn: () => stockpileLocationsApi.list({ page: 1, limit: 100, isActive: true }),
  });

  return (
    <PageContainer
      title="Stock History"
      description="View historical stock movements"
    >
      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            type="date"
            label="From Date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <Input
            type="date"
            label="To Date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
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

      {/* History Table */}
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
                  <th className="text-left p-4 text-sm font-medium text-content-secondary">Adjustment Reason</th>
                  <th className="text-right p-4 text-sm font-medium text-content-secondary">Closing</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.data.items.map((stock) => (
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
                    <td className="p-4 text-content-tertiary text-sm">
                      {stock.adjustmentReason || '-'}
                    </td>
                    <td className="p-4 text-right text-content-primary font-medium">
                      {stock.closingStock.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data?.data.data.items.length === 0 && (
              <div className="p-8 text-center text-content-secondary">No stock history found</div>
            )}
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
