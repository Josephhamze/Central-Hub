import { Wrench } from 'lucide-react';
import { ModulePlaceholder } from '@components/common/ModulePlaceholder';

export function AssetsPage() {
  return (
    <ModulePlaceholder
      title="Assets & Maintenance"
      description="Track assets and manage maintenance activities"
      icon={<Wrench className="w-8 h-8 text-content-secondary" />}
      sections={[
        {
          name: 'Asset Registry',
          description: 'Maintain asset inventory',
        },
        {
          name: 'Maintenance Schedules',
          description: 'Plan preventive maintenance',
        },
        {
          name: 'Work Orders',
          description: 'Manage maintenance work orders',
        },
        {
          name: 'Parts & Spares',
          description: 'Track spare parts inventory',
        },
        {
          name: 'Asset History',
          description: 'View asset maintenance history',
        },
        {
          name: 'Depreciation',
          description: 'Track asset depreciation',
        },
      ]}
      features={[
        'Asset lifecycle management',
        'Preventive maintenance scheduling',
        'Corrective maintenance tracking',
        'Spare parts management',
        'Asset condition monitoring',
        'Maintenance cost tracking',
        'Equipment downtime analysis',
        'Asset documentation storage',
      ]}
    />
  );
}
