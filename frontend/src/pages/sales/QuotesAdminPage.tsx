import { useNavigate } from 'react-router-dom';
import { Plus, FileText, CheckCircle2, XCircle, TrendingUp, DollarSign, Target, Clock, ChevronDown, Users, Truck, Trash2, Archive, RotateCw } from 'lucide-react';
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
  const [approveNotes, setApproveNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [lossReasonCategory, setLossReasonCategory] = useState<'PRICE_TOO_HIGH' | 'FOUND_BETTER_DEAL' | 'PROJECT_CANCELLED' | 'DELIVERY_TIMING' | 'QUALITY_CONCERNS' | 'OTHER' | ''>('');
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'quotes' | 'all-quotes' | 'customers' | 'logistics'>('quotes');

  const { data: kpiData, isLoading: isLoadingKPIs, refetch: refetchKPIs } = useQuery({
    queryKey: ['quotes-kpis', filters],
    queryFn: async () => {
      const res = await quotesApi.getKPIs(filters);
      return res.data.data;
    },
  });

  const { data, isLoading, refetch: refetchQuotes } = useQuery({
    queryKey: ['quotes', filters, activeTab],
    queryFn: async () => {
      const res = await quotesApi.findAll({ 
        ...filters, 
        page: 1, 
        limit: 50,
        includeArchived: activeTab === 'all-quotes' ? true : false // Show all statuses except archived on main quotes tab
      });
      return res.data.data;
    },
  });

  const handleRefresh = () => {
    // Invalidate and refetch to ensure fresh data from database
    queryClient.invalidateQueries({ queryKey: ['quotes'] });
    queryClient.invalidateQueries({ queryKey: ['quotes-kpis'] });
    refetchQuotes();
    refetchKPIs();
  };

  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => quotesApi.approve(id, notes),
    onSuccess: () => {
      // Invalidate only the specific queries that need updating
      queryClient.invalidateQueries({ queryKey: ['quotes', filters, activeTab] });
      queryClient.invalidateQueries({ queryKey: ['quotes-kpis'] }); // Invalidate all KPI queries regardless of filters
      queryClient.invalidateQueries({ queryKey: ['quote', selectedQuote?.id] });
      success('Quote approved successfully');
      setApproveModalOpen(false);
      setApproveNotes('');
      setSelectedQuote(null);
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to approve quote';
      showError(errorMessage);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => quotesApi.reject(id, reason),
    onSuccess: () => {
      // Invalidate only the specific queries that need updating
      queryClient.invalidateQueries({ queryKey: ['quotes', filters, activeTab] });
      queryClient.invalidateQueries({ queryKey: ['quotes-kpis'] }); // Invalidate all KPI queries regardless of filters
      queryClient.invalidateQueries({ queryKey: ['quote', selectedQuote?.id] });
      success('Quote rejected');
      setRejectModalOpen(false);
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to reject quote'),
  });

  const outcomeMutation = useMutation({
    mutationFn: ({ id, outcome, lossReasonCategory, reasonNotes }: { id: string; outcome: 'WON' | 'LOST'; lossReasonCategory?: 'PRICE_TOO_HIGH' | 'FOUND_BETTER_DEAL' | 'PROJECT_CANCELLED' | 'DELIVERY_TIMING' | 'QUALITY_CONCERNS' | 'OTHER'; reasonNotes?: string }) =>
      quotesApi.markOutcome(id, outcome, lossReasonCategory, reasonNotes),
    onSuccess: () => {
      // Invalidate only the specific queries that need updating
      queryClient.invalidateQueries({ queryKey: ['quotes', filters, activeTab] });
      queryClient.invalidateQueries({ queryKey: ['quotes-kpis'] }); // Invalidate all KPI queries regardless of filters
      queryClient.invalidateQueries({ queryKey: ['quote', selectedQuote?.id] });
      success(`Quote marked as ${outcomeType}`);
      setOutcomeModalOpen(false);
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to update outcome'),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => quotesApi.archive(id),
    onSuccess: (_, id) => {
      // Invalidate only the specific queries that need updating
      queryClient.invalidateQueries({ queryKey: ['quotes', filters, activeTab] });
      queryClient.invalidateQueries({ queryKey: ['quotes-kpis'] }); // Invalidate all KPI queries regardless of filters
      queryClient.invalidateQueries({ queryKey: ['quote', id] });
      success('Quote archived successfully');
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to archive quote';
      showError(errorMessage);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => quotesApi.remove(id),
    onSuccess: (_, id) => {
      // Invalidate only the specific queries that need updating
      queryClient.invalidateQueries({ queryKey: ['quotes', filters, activeTab] });
      queryClient.invalidateQueries({ queryKey: ['quotes-kpis'] }); // Invalidate all KPI queries regardless of filters
      queryClient.invalidateQueries({ queryKey: ['quote', id] });
      success('Quote deleted successfully');
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to delete quote';
      showError(errorMessage);
    },
  });

  const handleDelete = (quote: Quote) => {
    if (window.confirm(`Are you sure you want to delete quote ${quote.quoteNumber}? This action cannot be undone.`)) {
      deleteMutation.mutate(quote.id);
    }
  };

  // Check if user is admin
  const isAdmin = hasRole('Administrator') || hasRole('Admin') || hasRole('ADMIN') || hasRole('admin');

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
    <PageContainer 
      title="Quotes" 
      description="Manage quotes and view sales KPIs" 
      actions={
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            onClick={handleRefresh} 
            leftIcon={<RotateCw className="w-4 h-4" />}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Button variant="primary" onClick={() => navigate('/sales/quotes/new')} leftIcon={<Plus className="w-4 h-4" />}>
            Create New Quote
          </Button>
        </div>
      }
    >
      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-border-default">
        <button
          onClick={() => setActiveTab('quotes')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'quotes'
              ? 'border-accent-primary text-accent-primary'
              : 'border-transparent text-content-secondary hover:text-content-primary'
          )}
        >
          Quotes
        </button>
        <button
          onClick={() => setActiveTab('all-quotes')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'all-quotes'
              ? 'border-accent-primary text-accent-primary'
              : 'border-transparent text-content-secondary hover:text-content-primary'
          )}
        >
          All Quotes
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'customers'
              ? 'border-accent-primary text-accent-primary'
              : 'border-transparent text-content-secondary hover:text-content-primary'
          )}
        >
          Customers
        </button>
        <button
          onClick={() => setActiveTab('logistics')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'logistics'
              ? 'border-accent-primary text-accent-primary'
              : 'border-transparent text-content-secondary hover:text-content-primary'
          )}
        >
          Logistics
        </button>
      </div>

      {/* Quotes Tab */}
      {activeTab === 'quotes' && (
        <>
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
            <div className="relative">
              <select
                className="px-4 py-2 pr-10 text-sm font-medium rounded-lg border border-border-default bg-background-primary text-content-primary hover:bg-background-hover focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors cursor-pointer appearance-none"
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
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-content-tertiary pointer-events-none" />
            </div>
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
                    {/* Show Archive for WON, LOST, REJECTED quotes that aren't archived */}
                    {!quote.archived && ['WON', 'LOST', 'REJECTED'].includes(quote.status) && (isAdmin || isCreator) && (
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to archive quote ${quote.quoteNumber}?`)) {
                            archiveMutation.mutate(quote.id);
                          }
                        }}
                        leftIcon={<Archive className="w-4 h-4" />}
                        disabled={archiveMutation.isPending}
                        title="Archive quote"
                      >
                        Archive
                      </Button>
                    )}
                    {/* Show Delete only for DRAFT quotes */}
                    {((isAdmin) || (isCreator && quote.status === 'DRAFT')) && (
                      <Button 
                        size="sm" 
                        variant="danger" 
                        onClick={() => handleDelete(quote)}
                        leftIcon={<Trash2 className="w-4 h-4" />}
                        disabled={deleteMutation.isPending}
                        title={isAdmin ? "Delete quote (Admin)" : "Delete draft quote"}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>
      </Card>
        </>
      )}

      {/* All Quotes Tab */}
      {activeTab === 'all-quotes' && (
        <Card>
          <CardHeader 
            title="All Quotes (Including Archived)" 
            action={
              <div className="relative">
                <select
                  className="px-4 py-2 pr-10 text-sm font-medium rounded-lg border border-border-default bg-background-primary text-content-primary hover:bg-background-hover focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors cursor-pointer appearance-none"
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
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-content-tertiary pointer-events-none" />
              </div>
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
                  <div key={quote.id} className={cn(
                    "border rounded-lg p-4 flex justify-between items-center hover:bg-background-hover transition-colors",
                    quote.archived && "opacity-60"
                  )}>
                    <div className="flex-1 cursor-pointer" onClick={() => navigate(`/sales/quotes/${quote.id}`)}>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold">{quote.quoteNumber}</span>
                        {getStatusBadge(quote.status)}
                        {quote.archived && (
                          <Badge variant="default" className="bg-gray-500">Archived</Badge>
                        )}
                      </div>
                      <p className="text-sm text-content-secondary">
                        {quote.company?.name} • {quote.customer?.companyName || `${quote.customer?.firstName} ${quote.customer?.lastName}`}
                      </p>
                      <p className="text-sm text-content-tertiary">Total: ${Number(quote.grandTotal).toFixed(2)}</p>
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      {!quote.archived && canApprove(quote) && (
                        <>
                          <Button size="sm" variant="primary" onClick={() => { setSelectedQuote(quote); setApproveModalOpen(true); }}>
                            Approve
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => { setSelectedQuote(quote); setRejectModalOpen(true); }}>
                            Reject
                          </Button>
                        </>
                      )}
                      {!quote.archived && quote.status === 'APPROVED' && isCreator && (
                        <>
                          <Button size="sm" variant="primary" onClick={() => { setSelectedQuote(quote); setOutcomeType('WON'); setOutcomeModalOpen(true); }}>
                            Mark Won
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => { setSelectedQuote(quote); setOutcomeType('LOST'); setOutcomeModalOpen(true); }}>
                            Mark Lost
                          </Button>
                        </>
                      )}
                      {/* Show Archive for WON, LOST, REJECTED quotes that aren't archived */}
                      {!quote.archived && ['WON', 'LOST', 'REJECTED'].includes(quote.status) && (isAdmin || isCreator) && (
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to archive quote ${quote.quoteNumber}?`)) {
                              archiveMutation.mutate(quote.id);
                            }
                          }}
                          leftIcon={<Archive className="w-4 h-4" />}
                          disabled={archiveMutation.isPending}
                          title="Archive quote"
                        >
                          Archive
                        </Button>
                      )}
                      {/* Show Delete only for DRAFT quotes */}
                      {!quote.archived && ((isAdmin) || (isCreator && quote.status === 'DRAFT')) && (
                        <Button 
                          size="sm" 
                          variant="danger" 
                          onClick={() => handleDelete(quote)}
                          leftIcon={<Trash2 className="w-4 h-4" />}
                          disabled={deleteMutation.isPending}
                          title={isAdmin ? "Delete quote (Admin)" : "Delete draft quote"}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                );
                })}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Customers Tab */}
      {activeTab === 'customers' && (
        <Card>
          <CardHeader title="Customers & Sales" />
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="p-6 cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/customers/customers')}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-accent-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-content-primary mb-1">Customers</h3>
                    <p className="text-sm text-content-secondary">Manage customer directory</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/customers/contacts')}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent-primary/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-accent-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-content-primary mb-1">Contacts</h3>
                    <p className="text-sm text-content-secondary">Manage customer contacts</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Card>
      )}

      {/* Logistics Tab */}
      {activeTab === 'logistics' && (
        <Card>
          <CardHeader title="Logistics & Transport" />
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="p-6 cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/logistics/routes')}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent-primary/10 flex items-center justify-center">
                    <Truck className="w-6 h-6 text-accent-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-content-primary mb-1">Routes & Tolls</h3>
                    <p className="text-sm text-content-secondary">Manage delivery routes and toll costs</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Card>
      )}

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
      <Modal isOpen={outcomeModalOpen} onClose={() => { setOutcomeModalOpen(false); setLossReasonCategory(''); setOutcomeNotes(''); }} title={`Mark Quote as ${outcomeType}`} size="md">
        {outcomeType === 'LOST' && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-content-primary">Loss Reason *</label>
            <select
              value={lossReasonCategory}
              onChange={(e) => setLossReasonCategory(e.target.value as any)}
              className="w-full px-4 py-2 rounded-lg border border-border-default bg-background-primary text-content-primary"
              required
            >
              <option value="">Select a reason</option>
              <option value="PRICE_TOO_HIGH">Price Too High</option>
              <option value="FOUND_BETTER_DEAL">Found Better Deal</option>
              <option value="PROJECT_CANCELLED">Project Cancelled</option>
              <option value="DELIVERY_TIMING">Delivery Timing</option>
              <option value="QUALITY_CONCERNS">Quality Concerns</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        )}
        <Input label="Notes (optional)" value={outcomeNotes} onChange={(e) => setOutcomeNotes(e.target.value)} placeholder="Add any additional notes..." />
        <ModalFooter>
          <Button variant="secondary" onClick={() => { setOutcomeModalOpen(false); setLossReasonCategory(''); setOutcomeNotes(''); }}>Cancel</Button>
          <Button variant="primary" onClick={() => {
            if (outcomeType === 'LOST' && !lossReasonCategory) {
              showError('Loss reason is required');
              return;
            }
            selectedQuote && outcomeMutation.mutate({ 
              id: selectedQuote.id, 
              outcome: outcomeType, 
              lossReasonCategory: outcomeType === 'LOST' ? lossReasonCategory as any : undefined, 
              reasonNotes: outcomeNotes || undefined 
            });
          }}>
            Mark {outcomeType}
          </Button>
        </ModalFooter>
      </Modal>
    </PageContainer>
  );
}
