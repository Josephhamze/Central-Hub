import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, CheckCircle2, XCircle, TrendingUp, DollarSign, Target, Clock } from 'lucide-react';
import { PageContainer } from '@components/layout/PageContainer';
import { Card, CardHeader } from '@components/ui/Card';
import { quotesApi } from '@services/sales/quotes';

export function SalesKPIsPage() {
  const [filters, setFilters] = useState<{ companyId?: string; projectId?: string; startDate?: string; endDate?: string }>({});

  const { data, isLoading } = useQuery({
    queryKey: ['quotes-kpis', filters],
    queryFn: async () => {
      const res = await quotesApi.getKPIs(filters);
      return res.data.data;
    },
  });

  const kpis = [
    { label: 'Total Quotes', value: data?.totalQuotes || 0, icon: FileText, color: 'text-blue-500' },
    { label: 'Wins', value: data?.wins || 0, icon: CheckCircle2, color: 'text-green-500' },
    { label: 'Losses', value: data?.losses || 0, icon: XCircle, color: 'text-red-500' },
    { label: 'Win Rate', value: `${data?.winRate || 0}%`, icon: TrendingUp, color: 'text-purple-500' },
    { label: 'Avg Quote Value', value: `$${data?.avgQuoteValue?.toFixed(2) || '0.00'}`, icon: DollarSign, color: 'text-yellow-500' },
    { label: 'Pipeline Value', value: `$${data?.pipelineValue?.toFixed(2) || '0.00'}`, icon: Target, color: 'text-indigo-500' },
    { label: 'Won Value', value: `$${data?.wonValue?.toFixed(2) || '0.00'}`, icon: DollarSign, color: 'text-green-500' },
    { label: 'Avg Approval Time', value: `${data?.avgApprovalTimeHours?.toFixed(1) || '0'}h`, icon: Clock, color: 'text-orange-500' },
  ];

  return (
    <PageContainer title="Sales KPIs" description="Key performance indicators for sales">
      <Card>
        <CardHeader title="Metrics" />
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8 text-content-secondary">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpis.map((kpi) => (
                <Card key={kpi.label} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-content-secondary">{kpi.label}</span>
                    <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                  <div className="text-2xl font-bold text-content-primary">{kpi.value}</div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Card>
    </PageContainer>
  );
}
