import { useNavigate } from 'react-router-dom';
import { Route } from 'lucide-react';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';

export function LogisticsPage() {
  const navigate = useNavigate();

  return (
    <PageContainer
      title="Logistics & Transport"
      description="Manage fleet, shipments, and transportation operations"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6 cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/logistics/routes')}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-accent-primary/10 flex items-center justify-center">
              <Route className="w-6 h-6 text-accent-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-content-primary mb-1">Routes & Tolls</h3>
              <p className="text-sm text-content-secondary">Manage delivery routes and toll costs</p>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
