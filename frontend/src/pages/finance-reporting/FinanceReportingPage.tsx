import { useNavigate } from 'react-router-dom';
import { Calculator, BarChart3 } from 'lucide-react';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';

export function FinanceReportingPage() {
  const navigate = useNavigate();

  return (
    <PageContainer
      title="Finance & Reporting"
      description="Track costs, budgets, and generate analytical reports"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6 cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/costing')}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-accent-primary/10 flex items-center justify-center">
              <Calculator className="w-6 h-6 text-accent-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-content-primary mb-1">Finance & Costing</h3>
              <p className="text-sm text-content-secondary">Track and analyze operational costs and budgets</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/reporting')}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-accent-primary/10 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-accent-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-content-primary mb-1">Reporting & Analytics</h3>
              <p className="text-sm text-content-secondary">Generate reports and analyze operational data</p>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
