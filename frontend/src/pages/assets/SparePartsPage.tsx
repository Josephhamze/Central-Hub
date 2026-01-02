import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, Package, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Badge } from '@components/ui/Badge';
import { sparePartsApi } from '@services/assets/parts';
import { useAuth } from '@contexts/AuthContext';

export function SparePartsPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['spare-parts', 'list', search],
    queryFn: () => sparePartsApi.findAll(1, 50, search || undefined),
  });

  const { data: lowStock } = useQuery({
    queryKey: ['spare-parts', 'low-stock'],
    queryFn: () => sparePartsApi.getLowStock(),
  });

  const canManage = hasPermission('parts:manage');

  return (
    <PageContainer
      title="Spare Parts"
      description="Manage spare parts inventory"
      actions={
        canManage ? (
          <Button
            variant="primary"
            onClick={() => navigate('/assets/parts?action=create')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Part
          </Button>
        ) : undefined
      }
    >
      {lowStock && lowStock.length > 0 && (
        <Card className="p-4 mb-6 bg-status-warning-bg border border-status-warning">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-status-warning" />
            <h3 className="font-semibold text-status-warning">{lowStock.length} Parts Low on Stock</h3>
          </div>
          <p className="text-sm text-content-secondary">
            {lowStock.length} spare part{lowStock.length !== 1 ? 's' : ''} {lowStock.length === 1 ? 'is' : 'are'} below minimum stock level
          </p>
        </Card>
      )}

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-content-tertiary" />
          <Input
            placeholder="Search parts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            aria-label="Search spare parts"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-content-secondary">Loading...</div>
      ) : !data || data.items.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-content-tertiary" />
          <h3 className="text-lg font-semibold text-content-primary mb-2">No spare parts found</h3>
          <p className="text-content-secondary mb-4">Get started by creating your first spare part</p>
          {canManage && (
            <Button variant="primary" onClick={() => navigate('/assets/parts?action=create')} leftIcon={<Plus className="w-4 h-4" />}>
              Create Part
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {data.items.map((part) => (
            <Card key={part.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-content-primary">{part.name}</h3>
                    {part.isLowStock && <Badge variant="error">Low Stock</Badge>}
                    {part.isCritical && <Badge variant="warning" size="sm">Critical</Badge>}
                    <span className="text-sm text-content-tertiary font-mono">{part.sku}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-content-tertiary">Quantity:</span>
                      <p className={`font-medium ${part.isLowStock ? 'text-status-error' : 'text-content-primary'}`}>
                        {Number(part.quantityOnHand).toLocaleString()} {part.uom}
                      </p>
                    </div>
                    <div>
                      <span className="text-content-tertiary">Min Stock:</span>
                      <p className="text-content-primary font-medium">{Number(part.minStockLevel).toLocaleString()} {part.uom}</p>
                    </div>
                    <div>
                      <span className="text-content-tertiary">Unit Cost:</span>
                      <p className="text-content-primary font-medium">${Number(part.unitCost).toLocaleString()}</p>
                    </div>
                    {part.warehouse && (
                      <div>
                        <span className="text-content-tertiary">Warehouse:</span>
                        <p className="text-content-primary font-medium">{part.warehouse.name}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
