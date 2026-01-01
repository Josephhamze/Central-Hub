import { Warehouse } from 'lucide-react';
import { ModulePlaceholder } from '@components/common/ModulePlaceholder';

export function InventoryPage() {
  return (
    <ModulePlaceholder
      title="Inventory & Warehousing"
      description="Manage stock levels, warehouses, and inventory movements"
      icon={<Warehouse className="w-8 h-8 text-content-secondary" />}
      sections={[
        {
          name: 'Warehouses',
          description: 'Configure warehouse locations',
        },
        {
          name: 'Stock Items',
          description: 'Manage inventory items catalog',
        },
        {
          name: 'Stock Levels',
          description: 'Monitor current stock quantities',
        },
        {
          name: 'Stock Movements',
          description: 'Track inventory transactions',
        },
        {
          name: 'Stock Counts',
          description: 'Perform physical inventory counts',
        },
        {
          name: 'Reorder Management',
          description: 'Configure reorder points and alerts',
        },
      ]}
      features={[
        'Multi-warehouse management',
        'Location and bin tracking',
        'Serial and batch number tracking',
        'Stock reservation system',
        'Automatic reorder notifications',
        'Stock valuation methods',
        'Inventory aging analysis',
        'Barcode/QR code support',
      ]}
    />
  );
}
