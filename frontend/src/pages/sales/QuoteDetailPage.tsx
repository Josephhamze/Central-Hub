import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Edit,
  Send,
  X,
  CheckCircle2,
  XCircle,
  Building2,
  User,
  Package,
  Truck,
  MapPin,
  FolderKanban,
  Info,
} from 'lucide-react';
import { PageContainer } from '@components/layout/PageContainer';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Modal, ModalFooter } from '@components/ui/Modal';
import { Input } from '@components/ui/Input';
import { useToast } from '@contexts/ToastContext';
import { quotesApi } from '@services/sales/quotes';
import { useAuth } from '@contexts/AuthContext';

export function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [outcomeModalOpen, setOutcomeModalOpen] = useState(false);
  const [outcomeType, setOutcomeType] = useState<'WON' | 'LOST'>('WON');
  const [submitNotes, setSubmitNotes] = useState('');
  const [outcomeCategory, setOutcomeCategory] = useState('');
  const [outcomeNotes, setOutcomeNotes] = useState('');

  const { data: quoteData, isLoading } = useQuery({
    queryKey: ['quote', id],
    queryFn: async () => {
      const res = await quotesApi.findOne(id!);
      return res.data.data;
    },
    enabled: !!id,
  });

  const submitMutation = useMutation({
    mutationFn: (notes?: string) => quotesApi.submit(id!, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote', id] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      success('Quote submitted for approval');
      setSubmitModalOpen(false);
      setSubmitNotes('');
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Failed to submit quote';
      showError(errorMessage);
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: () => quotesApi.withdraw(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote', id] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      success('Quote withdrawn and returned to draft');
      setWithdrawModalOpen(false);
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Failed to withdraw quote';
      showError(errorMessage);
    },
  });

  const outcomeMutation = useMutation({
    mutationFn: ({ outcome, reasonCategory, reasonNotes }: { outcome: 'WON' | 'LOST'; reasonCategory: string; reasonNotes?: string }) =>
      quotesApi.markOutcome(id!, outcome, reasonCategory, reasonNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote', id] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      success(`Quote marked as ${outcomeType}`);
      setOutcomeModalOpen(false);
      setOutcomeCategory('');
      setOutcomeNotes('');
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Failed to update outcome';
      showError(errorMessage);
    },
  });

  if (isLoading) {
    return (
      <PageContainer title="Quote Details">
        <div className="text-center py-12 text-content-secondary">Loading...</div>
      </PageContainer>
    );
  }

  if (!quoteData) {
    return (
      <PageContainer title="Quote Details">
        <Card className="p-8 text-center">
          <p className="text-content-secondary mb-4">Quote not found</p>
          <Button variant="secondary" onClick={() => navigate('/sales/quotes')}>
            Back to Quotes
          </Button>
        </Card>
      </PageContainer>
    );
  }

  const quote = quoteData;
  const isCreator = user?.id === quote.salesRepUserId;
  const canEdit = (quote.status === 'DRAFT' || quote.status === 'REJECTED') && isCreator;
  const canSubmit = quote.status === 'DRAFT' && isCreator;
  const canWithdraw = quote.status === 'PENDING_APPROVAL' && isCreator;
  const canMarkOutcome = quote.status === 'APPROVED' && isCreator;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
      DRAFT: 'default',
      PENDING_APPROVAL: 'warning',
      APPROVED: 'info',
      REJECTED: 'error',
      WON: 'success',
      LOST: 'error',
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ')}</Badge>;
  };

  return (
    <PageContainer
      title="Quote Details"
      description={`Quote ${quote.quoteNumber}`}
      actions={
        <Button variant="secondary" onClick={() => navigate('/sales/quotes')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back to Quotes
        </Button>
      }
    >
      {/* Action Buttons */}
      <Card className="mb-6" padding="lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-content-primary">{quote.quoteNumber}</h2>
            {getStatusBadge(quote.status)}
          </div>
          <div className="flex gap-3">
            {canEdit && (
              <Button
                variant="secondary"
                onClick={() => navigate(`/sales/quotes/${id}/edit`)}
                leftIcon={<Edit className="w-4 h-4" />}
              >
                Edit Quote
              </Button>
            )}
            {canSubmit && (
              <Button
                variant="primary"
                onClick={() => setSubmitModalOpen(true)}
                leftIcon={<Send className="w-4 h-4" />}
              >
                Submit for Approval
              </Button>
            )}
            {canWithdraw && (
              <Button
                variant="secondary"
                onClick={() => setWithdrawModalOpen(true)}
                leftIcon={<X className="w-4 h-4" />}
              >
                Withdraw Quote
              </Button>
            )}
            {canMarkOutcome && (
              <>
                <Button
                  variant="primary"
                  onClick={() => {
                    setOutcomeType('WON');
                    setOutcomeModalOpen(true);
                  }}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Mark Won
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    setOutcomeType('LOST');
                    setOutcomeModalOpen(true);
                  }}
                  leftIcon={<XCircle className="w-4 h-4" />}
                >
                  Mark Lost
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Quote Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-accent-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-accent-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-content-primary">Company</h3>
              <p className="text-sm text-content-secondary">{quote.company?.name || 'N/A'}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-accent-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-accent-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-content-primary">Customer</h3>
              <p className="text-sm text-content-secondary">
                {quote.customer?.companyName || `${quote.customer?.firstName || ''} ${quote.customer?.lastName || ''}`.trim() || 'N/A'}
              </p>
              {quote.contact && (
                <p className="text-xs text-content-tertiary mt-1">Contact: {quote.contact.name}</p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-accent-primary/10 flex items-center justify-center">
              <FolderKanban className="w-6 h-6 text-accent-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-content-primary">Project</h3>
              <p className="text-sm text-content-secondary">{quote.project?.name || 'N/A'}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-accent-primary/10 flex items-center justify-center">
              <Truck className="w-6 h-6 text-accent-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-content-primary">Delivery Method</h3>
              <p className="text-sm text-content-secondary">{quote.deliveryMethod || 'N/A'}</p>
              {quote.deliveryMethod === 'DELIVERED' && quote.deliveryCity && (
                <p className="text-xs text-content-tertiary mt-1">
                  {quote.deliveryAddressLine1}, {quote.deliveryCity}
                  {quote.deliveryPostalCode && ` ${quote.deliveryPostalCode}`}
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Route Information */}
      {quote.route && (
        <Card className="mb-6" padding="lg">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-5 h-5 text-content-primary" />
            <h3 className="text-lg font-semibold text-content-primary">Route Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-content-secondary mb-1">From</p>
              <p className="font-medium text-content-primary">{quote.route.fromCity}</p>
            </div>
            <div>
              <p className="text-sm text-content-secondary mb-1">To</p>
              <p className="font-medium text-content-primary">{quote.route.toCity}</p>
            </div>
            <div>
              <p className="text-sm text-content-secondary mb-1">Distance</p>
              <p className="font-medium text-content-primary">
                {quote.distanceKmSnapshot ? `${Number(quote.distanceKmSnapshot).toFixed(2)} km` : 'N/A'}
              </p>
            </div>
          </div>
          {quote.route.tolls && quote.route.tolls.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border-default">
              <p className="text-sm text-content-secondary mb-2">Tolls:</p>
              <div className="space-y-1">
                {quote.route.tolls.map((toll) => (
                  <div key={toll.id} className="flex justify-between text-sm">
                    <span className="text-content-secondary">{toll.name}</span>
                    <span className="text-content-primary font-medium">${Number(toll.cost).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Products & Pricing */}
      <Card className="mb-6" padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <Package className="w-6 h-6 text-content-primary" />
          <h3 className="text-xl font-semibold text-content-primary">Products & Pricing</h3>
        </div>
        <div className="space-y-4">
          {quote.items && quote.items.length > 0 ? (
            quote.items.map((item, index) => (
              <div key={index} className="flex justify-between items-start py-4 border-b border-border-default">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-content-tertiary" />
                    <p className="font-semibold text-content-primary">{item.nameSnapshot}</p>
                  </div>
                  <p className="text-sm text-content-secondary mb-1">
                    {Number(item.qty).toFixed(2)} {item.uomSnapshot} × ${Number(item.unitPrice).toFixed(2)}
                    {item.discount > 0 && (
                      <span className="text-status-warning ml-2">- ${Number(item.discount).toFixed(2)} discount</span>
                    )}
                  </p>
                  {item.stockItem?.sku && (
                    <p className="text-xs text-content-tertiary">SKU: {item.stockItem.sku}</p>
                  )}
                </div>
                <p className="text-lg font-bold text-content-primary ml-4">${Number(item.lineTotal).toFixed(2)}</p>
              </div>
            ))
          ) : (
            <p className="text-content-secondary text-center py-4">No items in this quote</p>
          )}
        </div>
        <div className="mt-6 pt-6 border-t border-border-default space-y-3">
          <div className="flex justify-between text-content-secondary">
            <span>Subtotal:</span>
            <span className="font-semibold">${Number(quote.subtotal).toFixed(2)}</span>
          </div>
          {Number(quote.discountTotal) > 0 && (
            <div className="flex justify-between text-status-warning">
              <span>Discount:</span>
              <span className="font-semibold">-${Number(quote.discountTotal).toFixed(2)}</span>
            </div>
          )}
          {Number(quote.transportTotal) > 0 && (
            <div className="flex justify-between text-content-secondary">
              <span>Transport:</span>
              <span className="font-semibold">${Number(quote.transportTotal).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-bold text-content-primary pt-3 border-t border-border-default">
            <span>Grand Total:</span>
            <span>${Number(quote.grandTotal).toFixed(2)}</span>
          </div>
        </div>
      </Card>

      {/* Sales Rep & Timestamps */}
      <Card padding="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-content-primary mb-3">Sales Representative</h3>
            <p className="text-sm text-content-secondary">
              {quote.salesRep ? `${quote.salesRep.firstName} ${quote.salesRep.lastName}` : 'N/A'}
            </p>
            {quote.salesRep?.email && (
              <p className="text-xs text-content-tertiary mt-1">{quote.salesRep.email}</p>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-content-primary mb-3">Timeline</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-content-secondary">Created:</span>{' '}
                <span className="text-content-primary">{new Date(quote.createdAt).toLocaleString()}</span>
              </div>
              {quote.submittedAt && (
                <div>
                  <span className="text-content-secondary">Submitted:</span>{' '}
                  <span className="text-content-primary">{new Date(quote.submittedAt).toLocaleString()}</span>
                </div>
              )}
              {quote.approvedAt && (
                <div>
                  <span className="text-content-secondary">Approved:</span>{' '}
                  <span className="text-content-primary">{new Date(quote.approvedAt).toLocaleString()}</span>
                </div>
              )}
              {quote.rejectedAt && (
                <div>
                  <span className="text-content-secondary">Rejected:</span>{' '}
                  <span className="text-content-primary">{new Date(quote.rejectedAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Submit Modal */}
      <Modal isOpen={submitModalOpen} onClose={() => setSubmitModalOpen(false)} title="Submit Quote for Approval" size="md">
        <div className="space-y-4">
          <div className="p-3 bg-status-info-bg border-l-4 border-status-info rounded-r-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-status-info mt-0.5 flex-shrink-0" />
              <p className="text-xs text-content-secondary">
                Submitting this quote will send it for approval. You can withdraw it later if needed.
              </p>
            </div>
          </div>
          <Input
            label="Notes (optional)"
            value={submitNotes}
            onChange={(e) => setSubmitNotes(e.target.value)}
            placeholder="Add any notes for the approver..."
          />
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => { setSubmitModalOpen(false); setSubmitNotes(''); }}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => submitMutation.mutate(submitNotes || undefined)}
            isLoading={submitMutation.isPending}
            leftIcon={<Send className="w-4 h-4" />}
          >
            Submit for Approval
          </Button>
        </ModalFooter>
      </Modal>

      {/* Withdraw Modal */}
      <Modal isOpen={withdrawModalOpen} onClose={() => setWithdrawModalOpen(false)} title="Withdraw Quote" size="md">
        <div className="space-y-4">
          <div className="p-3 bg-status-warning-bg border-l-4 border-status-warning rounded-r-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-status-warning mt-0.5 flex-shrink-0" />
              <p className="text-xs text-content-secondary">
                Withdrawing this quote will change its status back to DRAFT. You can edit and resubmit it later.
              </p>
            </div>
          </div>
          <p className="text-sm text-content-secondary">
            Are you sure you want to withdraw this quote from approval?
          </p>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setWithdrawModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() => withdrawMutation.mutate()}
            isLoading={withdrawMutation.isPending}
            leftIcon={<X className="w-4 h-4" />}
          >
            Withdraw Quote
          </Button>
        </ModalFooter>
      </Modal>

      {/* Outcome Modal */}
      <Modal isOpen={outcomeModalOpen} onClose={() => setOutcomeModalOpen(false)} title={`Mark Quote as ${outcomeType}`} size="md">
        <div className="space-y-4">
          <div className="p-3 bg-status-info-bg border-l-4 border-status-info rounded-r-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-status-info mt-0.5 flex-shrink-0" />
              <p className="text-xs text-content-secondary">
                Marking this quote as {outcomeType} will update the sales KPIs and close this opportunity.
              </p>
            </div>
          </div>
          <Input
            label="Reason Category *"
            value={outcomeCategory}
            onChange={(e) => setOutcomeCategory(e.target.value)}
            placeholder="e.g., Price, Timing, Competition, etc."
            required
          />
          <Input
            label="Notes (optional)"
            value={outcomeNotes}
            onChange={(e) => setOutcomeNotes(e.target.value)}
            placeholder="Add any additional notes..."
          />
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => { setOutcomeModalOpen(false); setOutcomeCategory(''); setOutcomeNotes(''); }}>
            Cancel
          </Button>
          <Button
            variant={outcomeType === 'WON' ? 'primary' : 'danger'}
            onClick={() => {
              if (!outcomeCategory.trim()) {
                showError('Reason category is required');
                return;
              }
              outcomeMutation.mutate({ outcome: outcomeType, reasonCategory: outcomeCategory.trim(), reasonNotes: outcomeNotes || undefined });
            }}
            isLoading={outcomeMutation.isPending}
            leftIcon={outcomeType === 'WON' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          >
            Mark {outcomeType}
          </Button>
        </ModalFooter>
      </Modal>
    </PageContainer>
  );
}
