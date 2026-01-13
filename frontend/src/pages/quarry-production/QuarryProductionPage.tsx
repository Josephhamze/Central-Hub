import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Mountain, ArrowRight, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { PageContainer } from '@components/layout/PageContainer';
import { Card, CardHeader } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { dashboardApi, type ProductionSummary, type KPI } from '@services/quarry-production/dashboard';
import { useAuth } from '@contexts/AuthContext';

export function QuarryProductionPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedShift, setSelectedShift] = useState<'DAY' | 'NIGHT' | undefined>(undefined);

  const { data: varianceData, isLoading: varianceLoading } = useQuery<ProductionSummary>({
    queryKey: ['quarry-dashboard', 'variance', selectedDate, selectedShift],
    queryFn: () => dashboardApi.getVarianceAnalysis({ date: selectedDate, shift: selectedShift }),
    enabled: !!selectedDate,
  });

  const { data: kpis, isLoading: kpisLoading } = useQuery<KPI[]>({
    queryKey: ['quarry-dashboard', 'kpis', selectedDate],
    queryFn: () => {
      const date = new Date(selectedDate);
      const dateFrom = new Date(date);
      dateFrom.setDate(dateFrom.getDate() - 7);
      return dashboardApi.getKPIs({
        dateFrom: dateFrom.toISOString().split('T')[0],
        dateTo: selectedDate,
      });
    },
    enabled: !!selectedDate,
  });

  const canViewDashboard = hasPermission('quarry:dashboard:view');

  if (!canViewDashboard) {
    return (
      <PageContainer title="Quarry Production" description="Production tracking dashboard">
        <Card className="p-8 text-center">
          <p className="text-content-secondary">You don't have permission to view this page.</p>
        </Card>
      </PageContainer>
    );
  }

  const getVarianceStatusColor = (status: 'OK' | 'WARNING' | 'ALERT') => {
    switch (status) {
      case 'OK': return 'success';
      case 'WARNING': return 'warning';
      case 'ALERT': return 'error';
    }
  };

  const getVarianceIcon = (status: 'OK' | 'WARNING' | 'ALERT') => {
    switch (status) {
      case 'OK': return CheckCircle2;
      case 'WARNING': return AlertTriangle;
      case 'ALERT': return AlertTriangle;
    }
  };

  return (
    <PageContainer
      title="Quarry Production Dashboard"
      description="Track material flow from extraction to finished stock"
      actions={
        <div className="flex gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-border-default rounded-lg bg-bg-tertiary text-content-primary"
          />
          <select
            value={selectedShift || ''}
            onChange={(e) => setSelectedShift(e.target.value as 'DAY' | 'NIGHT' | '' || undefined)}
            className="px-3 py-2 border border-border-default rounded-lg bg-bg-tertiary text-content-primary"
          >
            <option value="">All Shifts</option>
            <option value="DAY">Day</option>
            <option value="NIGHT">Night</option>
          </select>
        </div>
      }
    >
      {/* Production Flow Diagram */}
      <Card className="mb-6">
        <CardHeader title="Production Flow" description={`${selectedDate} ${selectedShift ? `- ${selectedShift} Shift` : ''}`} />
        {varianceLoading ? (
          <div className="p-8 text-center text-content-secondary">Loading...</div>
        ) : varianceData?.data ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Excavator */}
              <div className="text-center">
                <div className="bg-bg-elevated rounded-lg p-4 mb-2">
                  <Mountain className="w-8 h-8 mx-auto mb-2 text-content-primary" />
                  <div className="text-2xl font-bold text-content-primary">
                    {varianceData.data.excavatorTonnage.toFixed(2)}
                  </div>
                  <div className="text-sm text-content-secondary">tonnes</div>
                  <div className="text-xs text-content-tertiary mt-1">Excavator</div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-content-tertiary" />
                {varianceData.data.variances[0] && (
                  <Badge
                    variant={getVarianceStatusColor(varianceData.data.variances[0].status)}
                    className="ml-2"
                  >
                    {varianceData.data.variances[0].variancePercent.toFixed(1)}%
                  </Badge>
                )}
              </div>

              {/* Hauling */}
              <div className="text-center">
                <div className="bg-bg-elevated rounded-lg p-4 mb-2">
                  <Mountain className="w-8 h-8 mx-auto mb-2 text-content-primary" />
                  <div className="text-2xl font-bold text-content-primary">
                    {varianceData.data.haulingTonnage.toFixed(2)}
                  </div>
                  <div className="text-sm text-content-secondary">tonnes</div>
                  <div className="text-xs text-content-tertiary mt-1">Hauling</div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-content-tertiary" />
                {varianceData.data.variances[1] && (
                  <Badge
                    variant={getVarianceStatusColor(varianceData.data.variances[1].status)}
                    className="ml-2"
                  >
                    {varianceData.data.variances[1].variancePercent.toFixed(1)}%
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Crusher Feed */}
              <div className="text-center">
                <div className="bg-bg-elevated rounded-lg p-4 mb-2">
                  <Mountain className="w-8 h-8 mx-auto mb-2 text-content-primary" />
                  <div className="text-2xl font-bold text-content-primary">
                    {varianceData.data.crusherFeedTonnage.toFixed(2)}
                  </div>
                  <div className="text-sm text-content-secondary">tonnes</div>
                  <div className="text-xs text-content-tertiary mt-1">Crusher Feed</div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-content-tertiary" />
                {varianceData.data.variances[2] && (
                  <Badge
                    variant={getVarianceStatusColor(varianceData.data.variances[2].status)}
                    className="ml-2"
                  >
                    {varianceData.data.variances[2].variancePercent.toFixed(1)}%
                  </Badge>
                )}
              </div>

              {/* Crusher Output */}
              <div className="text-center">
                <div className="bg-bg-elevated rounded-lg p-4 mb-2">
                  <Mountain className="w-8 h-8 mx-auto mb-2 text-content-primary" />
                  <div className="text-2xl font-bold text-content-primary">
                    {varianceData.data.crusherOutputTonnage.toFixed(2)}
                  </div>
                  <div className="text-sm text-content-secondary">tonnes</div>
                  <div className="text-xs text-content-tertiary mt-1">Crusher Output</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-content-secondary">No data available</div>
        )}
      </Card>

      {/* Variance Checkpoints */}
      {varianceData?.data && varianceData.data.variances.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {varianceData.data.variances.map((checkpoint) => {
            const Icon = getVarianceIcon(checkpoint.status);
            return (
              <Card key={checkpoint.checkpoint} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-content-secondary">{checkpoint.name}</h3>
                  <Icon className={`w-5 h-5 text-status-${getVarianceStatusColor(checkpoint.status)}`} />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-content-tertiary">Expected:</span>
                    <span className="text-content-primary font-medium">{checkpoint.expected.toFixed(2)} t</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-content-tertiary">Actual:</span>
                    <span className="text-content-primary font-medium">{checkpoint.actual.toFixed(2)} t</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-content-tertiary">Variance:</span>
                    <span className={`font-medium ${
                      checkpoint.status === 'OK' ? 'text-status-success' :
                      checkpoint.status === 'WARNING' ? 'text-status-warning' :
                      'text-status-error'
                    }`}>
                      {checkpoint.variancePercent > 0 ? '+' : ''}{checkpoint.variancePercent.toFixed(2)}%
                    </span>
                  </div>
                  <Badge variant={getVarianceStatusColor(checkpoint.status)} className="mt-2">
                    {checkpoint.status}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* KPIs */}
      <Card>
        <CardHeader title="Key Performance Indicators" description="Last 7 days" />
        {kpisLoading ? (
          <div className="p-8 text-center text-content-secondary">Loading...</div>
        ) : kpis?.data && kpis.data.length > 0 ? (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.data.map((kpi) => (
              <div key={kpi.name} className="text-center">
                <div className="text-sm text-content-secondary mb-1">{kpi.name}</div>
                <div className="text-2xl font-bold text-content-primary">
                  {typeof kpi.value === 'number' ? kpi.value.toFixed(2) : kpi.value} {kpi.unit}
                </div>
                {kpi.target && (
                  <div className="text-xs text-content-tertiary mt-1">
                    Target: {kpi.target} {kpi.unit}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-content-secondary">No KPI data available</div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <Button
          variant="secondary"
          onClick={() => navigate('/quarry-production/excavator-entries')}
          className="w-full"
        >
          Excavator Entries
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate('/quarry-production/hauling-entries')}
          className="w-full"
        >
          Hauling Entries
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate('/quarry-production/crusher-feed')}
          className="w-full"
        >
          Crusher Feed
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate('/quarry-production/crusher-output')}
          className="w-full"
        >
          Crusher Output
        </Button>
      </div>
    </PageContainer>
  );
}
