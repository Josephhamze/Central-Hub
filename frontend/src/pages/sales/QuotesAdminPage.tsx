import { useNavigate } from 'react-router-dom';
import { Plus, FileText, CheckCircle2, XCircle, TrendingUp, DollarSign, Target, Clock, Building2 } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '@components/layout/PageContainer';
import { Card, CardHeader } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Input } from '@components/ui/Input';
import { Modal, ModalFooter } from '@components/ui/Modal';
import { useToast } from '@contexts/ToastContext';
import { quotesApi, type Quote, type QuoteStatus } from '@services/sales/quotes';
import { companiesApi } from '@services/sales/companies';
import { useAuth } from '@contexts/AuthContext';
import { cn } from '@utils/cn';

export function QuotesAdminPage() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { hasPermission, hasRole, user } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<{ status?: QuoteStatus; companyId?: string; projectId?: string }>({});
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [outcomeModalOpen, setOutcomeModalOpen] = useState(false);
  const [outcomeType, setOutcomeType] = useState<'WON' | 'LOST'>('WON');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [approveNotes, setApproveNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [outcomeCategory, setOutcomeCategory] = useState('');
  const [outcomeNotes, setOutcomeNotes] = useState('');

  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await companiesApi.findAll(1, 100);
      return res.data.data;
    },
  });

  const { data: kpiData, isLoading: isLoadingKPIs } = useQuery({
    queryKey: ['quotes-kpis', filters],
    queryFn: async () => {
      const res = await quotesApi.getKPIs(filters);
      return res.data.data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['quotes', filters],
    queryFn: async () => {
      const res = await quotesApi.findAll({ ...filters, page: 1, limit: 50 });
      return res.data.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => quotesApi.approve(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quotes-kpis'] });
      success('Quote approved');
      setApproveModalOpen(false);
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to approve quote'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => quotesApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quotes-kpis'] });
      success('Quote rejected');
      setRejectModalOpen(false);
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to reject quote'),
  });

  const outcomeMutation = useMutation({
    mutationFn: ({ id, outcome, reasonCategory, reasonNotes }: { id: string; outcome: 'WON' | 'LOST'; reasonCategory: string; reasonNotes?: string }) =>
      quotesApi.markOutcome(id, outcome, reasonCategory, reasonNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quotes-kpis'] });
      success(`Quote marked as ${outcomeType}`);
      setOutcomeModalOpen(false);
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to update outcome'),
  });

  // Check if user can approve (has permission OR is sales manager OR is admin)
  // Admins can approve their own quotes
  const canApprove = (quote: Quote) => {
    if (quote.status !== 'PENDING_APPROVAL') return false;
    
    // Check various role name formats
    const isAdmin = hasRole('Administrator') || hasRole('Admin') || hasRole('ADMIN') || hasRole('admin');
    const isSalesManager = hasRole('Sales Manager') || hasRole('SALES_MANAGER') || hasRole('sales_manager');
    const hasApprovePermission = hasPermission('quotes:approve');
    
    // Debug logging (remove in production)
    if (quote.status === 'PENDING_APPROVAL') {
      console.log('Quote approval check:', {
        quoteId: quote.id,
        status: quote.status,
        isAdmin,
        isSalesManager,
        hasApprovePermission,
        userId: user?.id,
        quoteCreatorId: quote.salesRepUserId,
        isOwnQuote: user?.id === quote.salesRepUserId,
      });
    }
    
    // If admin, can always approve (including own quotes)
    if (isAdmin) return true;
    
    // If sales manager or has permission, can approve
    if (isSalesManager || hasApprovePermission) {
      // Only block if it's their own quote AND they're not admin
      if (user?.id === quote.salesRepUserId && !isAdmin) {
        return false;
      }
      return true;
    }
    
    return false;
  };

  const handleCompanySelect = (companyId: string) => {
    setSelectedCompanyId(companyId);
    // Navigate to quote wizard with company pre-selected
    navigate(`/sales/quotes/new?companyId=${companyId}`);
  };

  const getStatusBadge = (status: QuoteStatus) => {
    const variants: Record<QuoteStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
      DRAFT: 'default',
      PENDING_APPROVAL: 'warning',
      APPROVED: 'info',
      REJECTED: 'error',
      WON: 'success',
      LOST: 'error',
    };
    return <Badge variant={variants[status]}>{status.replace('_', ' ')}</Badge>;
  };

  return (
    <PageContainer title="Quotes" description="Manage quotes and view sales KPIs" actions={<Button variant="primary" onClick={() => navigate('/sales/quotes/new')} leftIcon={<Plus className="w-4 h-4" />}>Create New Quote</Button>}>
      {/* KPIs Section */}
      <Card className="mb-6">
        <CardHeader title="Sales KPIs" />
        <div className="p-6">
          {isLoadingKPIs ? (
            <div className="text-center py-8 text-content-secondary">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Quotes', value: kpiData?.totalQuotes || 0, icon: FileText, color: 'text-blue-500' },
                { label: 'Wins', value: kpiData?.wins || 0, icon: CheckCircle2, color: 'text-green-500' },
                { label: 'Losses', value: kpiData?.losses || 0, icon: XCircle, color: 'text-red-500' },
                { label: 'Win Rate', value: `${kpiData?.winRate || 0}%`, icon: TrendingUp, color: 'text-purple-500' },
                { label: 'Avg Quote Value', value: `$${Number(kpiData?.avgQuoteValue || 0).toFixed(2)}`, icon: DollarSign, color: 'text-yellow-500' },
                { label: 'Pipeline Value', value: `$${Number(kpiData?.pipelineValue || 0).toFixed(2)}`, icon: Target, color: 'text-indigo-500' },
                { label: 'Won Value', value: `$${Number(kpiData?.wonValue || 0).toFixed(2)}`, icon: DollarSign, color: 'text-green-500' },
                { label: 'Avg Approval Time', value: `${Number(kpiData?.avgApprovalTimeHours || 0).toFixed(1)}h`, icon: Clock, color: 'text-orange-500' },
              ].map((kpi) => (
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

      {/* Quotes List */}
      <Card>
        <CardHeader 
          title="Quotes" 
          action={
            <select
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border-default bg-background-primary text-content-primary hover:bg-background-hover focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M6%209L1%204h10z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_12px_center] bg-no-repeat pr-10"
              value={filters.status || ''}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as QuoteStatus || undefined })}
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="WON">Won</option>
              <option value="LOST">Lost</option>
            </select>
          }
        />
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8 text-content-secondary">Loading...</div>
          ) : (
            <div className="space-y-4">
              {data?.items.map((quote) => {
                const isCreator = user?.id === quote.salesRepUserId;
                return (
                <div key={quote.id} className="border rounded-lg p-4 flex justify-between items-center hover:bg-background-hover transition-colors">
                  <div className="flex-1 cursor-pointer" onClick={() => navigate(`/sales/quotes/${quote.id}`)}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold">{quote.quoteNumber}</span>
                      {getStatusBadge(quote.status)}
                    </div>
                    <p className="text-sm text-content-secondary">
                      {quote.company?.name} • {quote.customer?.companyName || `${quote.customer?.firstName} ${quote.customer?.lastName}`}
                    </p>
                    <p className="text-sm text-content-tertiary">Total: ${Number(quote.grandTotal).toFixed(2)}</p>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    {canApprove(quote) && (
                      <>
                        <Button size="sm" variant="primary" onClick={() => { setSelectedQuote(quote); setApproveModalOpen(true); }}>
                          Approve
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => { setSelectedQuote(quote); setRejectModalOpen(true); }}>
                          Reject
                        </Button>
                      </>
                    )}
                    {quote.status === 'APPROVED' && isCreator && (
                      <>
                        <Button size="sm" variant="primary" onClick={() => { setSelectedQuote(quote); setOutcomeType('WON'); setOutcomeModalOpen(true); }}>
                          Mark Won
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => { setSelectedQuote(quote); setOutcomeType('LOST'); setOutcomeModalOpen(true); }}>
                          Mark Lost
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Quick Quote Creation - Step 1 */}
      <Card>
        <CardHeader title="Quick Create Quote" />
        <div className="p-6">
          <p className="text-sm text-content-secondary mb-4">Select a company to start creating a new quote</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companiesData?.items.map((company) => (
              <Card
                key={company.id}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-lg border-2',
                  selectedCompanyId === company.id
                    ? 'border-status-success bg-status-success-bg ring-2 ring-status-success ring-opacity-50'
                    : 'border-border-default hover:border-accent-primary'
                )}
                onClick={() => handleCompanySelect(company.id)}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                      selectedCompanyId === company.id ? 'bg-status-success text-white' : 'bg-accent-primary/10 text-accent-primary'
                    )}>
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-bold text-content-primary mb-1">{company.name}</h3>
                        {selectedCompanyId === company.id && (
                          <CheckCircle2 className="w-5 h-5 text-status-success flex-shrink-0" />
                        )}
                      </div>
                      {company.legalName && (
                        <p className="text-xs text-content-secondary mb-1">{company.legalName}</p>
                      )}
                      {company.email && (
                        <p className="text-xs text-content-tertiary">{company.email}</p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Card>

      {/* Approve Modal */}
      <Modal isOpen={approveModalOpen} onClose={() => { setApproveModalOpen(false); setApproveNotes(''); }} title="Approve Quote" size="md">
        <Input label="Notes (optional)" value={approveNotes} onChange={(e) => setApproveNotes(e.target.value)} placeholder="Add any notes..." />
        <ModalFooter>
          <Button variant="secondary" onClick={() => { setApproveModalOpen(false); setApproveNotes(''); }}>Cancel</Button>
          <Button variant="primary" onClick={() => selectedQuote && approveMutation.mutate({ id: selectedQuote.id, notes: approveNotes })}>
            Approve
          </Button>
        </ModalFooter>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={rejectModalOpen} onClose={() => { setRejectModalOpen(false); setRejectReason(''); }} title="Reject Quote" size="md">
        <Input label="Reason" required value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Enter rejection reason..." />
        <ModalFooter>
          <Button variant="secondary" onClick={() => { setRejectModalOpen(false); setRejectReason(''); }}>Cancel</Button>
          <Button variant="danger" onClick={() => {
            if (!rejectReason.trim()) {
              showError('Reason is required');
              return;
            }
            selectedQuote && rejectMutation.mutate({ id: selectedQuote.id, reason: rejectReason });
          }}>
            Reject
          </Button>
        </ModalFooter>
      </Modal>

      {/* Outcome Modal */}
      <Modal isOpen={outcomeModalOpen} onClose={() => { setOutcomeModalOpen(false); setOutcomeCategory(''); setOutcomeNotes(''); }} title={`Mark Quote as ${outcomeType}`} size="md">
        <Input label="Reason Category" required value={outcomeCategory} onChange={(e) => setOutcomeCategory(e.target.value)} placeholder="e.g., Price, Timing, Competition, etc." />
        <Input label="Notes (optional)" value={outcomeNotes} onChange={(e) => setOutcomeNotes(e.target.value)} placeholder="Add any additional notes..." />
        <ModalFooter>
          <Button variant="secondary" onClick={() => { setOutcomeModalOpen(false); setOutcomeCategory(''); setOutcomeNotes(''); }}>Cancel</Button>
          <Button variant="primary" onClick={() => {
            if (!outcomeCategory.trim()) {
              showError('Reason category is required');
              return;
            }
            selectedQuote && outcomeMutation.mutate({ id: selectedQuote.id, outcome: outcomeType, reasonCategory: outcomeCategory, reasonNotes: outcomeNotes || undefined });
          }}>
            Mark {outcomeType}
          </Button>
        </ModalFooter>
      </Modal>
    </PageContainer>
  );
}
