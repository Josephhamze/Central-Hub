import { useNavigate } from 'react-router-dom';
import { Warehouse, Package, Wrench } from 'lucide-react';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';

export function InventoryAssetsPage() {
  const navigate = useNavigate();

  return (
    <PageContainer
      title="Inventory & Assets"
      description="Manage stock levels, warehouses, inventory, and asset maintenance"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6 cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/inventory/warehouses')}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-accent-primary/10 flex items-center justify-center">
              <Warehouse className="w-6 h-6 text-accent-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-content-primary mb-1">Warehouses</h3>
              <p className="text-sm text-content-secondary">Manage warehouse locations</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/inventory/stock-items')}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-accent-primary/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-accent-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-content-primary mb-1">Stock Items</h3>
              <p className="text-sm text-content-secondary">Manage inventory products</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/assets')}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-accent-primary/10 flex items-center justify-center">
              <Wrench className="w-6 h-6 text-accent-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-content-primary mb-1">Assets & Maintenance</h3>
              <p className="text-sm text-content-secondary">Track assets and manage maintenance activities</p>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
