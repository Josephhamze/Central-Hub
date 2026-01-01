import { Truck } from 'lucide-react';
import { ModulePlaceholder } from '@components/common/ModulePlaceholder';

export function LogisticsPage() {
  return (
    <ModulePlaceholder
      title="Logistics & Transport"
      description="Manage fleet, shipments, and transportation operations"
      icon={<Truck className="w-8 h-8 text-content-secondary" />}
      sections={[
        {
          name: 'Fleet Management',
          description: 'Manage vehicle fleet',
        },
        {
          name: 'Shipments',
          description: 'Track inbound and outbound shipments',
        },
        {
          name: 'Routes',
          description: 'Plan delivery routes',
        },
        {
          name: 'Drivers',
          description: 'Manage driver information',
        },
        {
          name: 'Fuel Tracking',
          description: 'Monitor fuel consumption',
        },
        {
          name: 'Delivery Tracking',
          description: 'Track delivery status',
        },
      ]}
      features={[
        'Vehicle tracking and management',
        'Route optimization',
        'Shipment scheduling',
        'Driver assignment and scheduling',
        'Fuel consumption tracking',
        'Delivery proof capture',
        'Transportation cost analysis',
        'Carrier management',
      ]}
    />
  );
}
