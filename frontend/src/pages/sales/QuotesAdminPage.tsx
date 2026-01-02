import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
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

export function QuotesAdminPage() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { hasPermission, user } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<{ status?: QuoteStatus; companyId?: string; projectId?: string }>({});
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [outcomeModalOpen, setOutcomeModalOpen] = useState(false);
  const [outcomeType, setOutcomeType] = useState<'WON' | 'LOST'>('WON');

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
      success('Quote approved');
      setApproveModalOpen(false);
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to approve quote'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => quotesApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
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
      success(`Quote marked as ${outcomeType}`);
      setOutcomeModalOpen(false);
    },
    onError: (err: any) => showError(err.response?.data?.error?.message || 'Failed to update outcome'),
  });

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
    <PageContainer title="Quotes Administration" description="Manage and approve sales quotes" actions={<Button variant="primary" onClick={() => navigate('/sales/quotes/new')} leftIcon={<Plus className="w-4 h-4" />}>Create New Quote</Button>}>
      <Card className="mb-6">
        <CardHeader title="Filters" />
        <div className="p-6 flex gap-4">
          <select
            className="px-3 py-2 border rounded-lg bg-background-primary"
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
        </div>
      </Card>

      <Card>
        <CardHeader title="Quotes" />
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
                    {quote.status === 'PENDING_APPROVAL' && hasPermission('quotes:approve') && (
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
