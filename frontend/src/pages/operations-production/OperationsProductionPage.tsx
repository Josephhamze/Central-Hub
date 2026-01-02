import { useNavigate } from 'react-router-dom';
import { Cog, Factory } from 'lucide-react';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';

export function OperationsProductionPage() {
  const navigate = useNavigate();

  return (
    <PageContainer
      title="Operations & Production"
      description="Manage operational activities and production processes"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6 cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/operations')}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-accent-primary/10 flex items-center justify-center">
              <Cog className="w-6 h-6 text-accent-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-content-primary mb-1">Operations</h3>
              <p className="text-sm text-content-secondary">Manage day-to-day operational activities and workflows</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/production')}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-accent-primary/10 flex items-center justify-center">
              <Factory className="w-6 h-6 text-accent-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-content-primary mb-1">Production Tracking</h3>
              <p className="text-sm text-content-secondary">Monitor and manage production processes and output</p>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
