import { BarChart3 } from 'lucide-react';
import { ModulePlaceholder } from '@components/common/ModulePlaceholder';

export function ReportingPage() {
  return (
    <ModulePlaceholder
      title="Reporting & Analytics"
      description="Generate reports and analyze operational data"
      icon={<BarChart3 className="w-8 h-8 text-content-secondary" />}
      sections={[
        {
          name: 'Report Builder',
          description: 'Create custom reports',
        },
        {
          name: 'Dashboards',
          description: 'Build analytical dashboards',
        },
        {
          name: 'Scheduled Reports',
          description: 'Automate report delivery',
        },
        {
          name: 'Data Export',
          description: 'Export data in various formats',
        },
        {
          name: 'KPI Tracking',
          description: 'Monitor key performance indicators',
        },
        {
          name: 'Trend Analysis',
          description: 'Analyze data trends',
        },
      ]}
      features={[
        'Drag-and-drop report builder',
        'Interactive dashboards',
        'Scheduled report delivery',
        'Multiple export formats (PDF, Excel, CSV)',
        'Custom KPI definitions',
        'Data visualization widgets',
        'Cross-module analytics',
        'Report templates library',
      ]}
    />
  );
}
