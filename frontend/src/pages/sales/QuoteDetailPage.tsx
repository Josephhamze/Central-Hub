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
  Printer,
  Building2,
  User,
  Package,
  Truck,
  MapPin,
  FolderKanban,
  Info,
  FileText,
, Trash2} from 'lucide-react';
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
  const { user, hasPermission, hasRole } = useAuth();
  const isAdmin = hasRole('Administrator') || hasRole('Admin') || hasRole('ADMIN') || hasRole('admin');
  const queryClient = useQueryClient();

  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [approveNotes, setApproveNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [outcomeModalOpen, setOutcomeModalOpen] = useState(false);
  const [outcomeType, setOutcomeType] = useState<'WON' | 'LOST'>('WON');
  const [submitNotes, setSubmitNotes] = useState('');
  const [lossReasonCategory, setLossReasonCategory] = useState<'PRICE_TOO_HIGH' | 'FOUND_BETTER_DEAL' | 'PROJECT_CANCELLED' | 'DELIVERY_TIMING' | 'QUALITY_CONCERNS' | 'OTHER' | ''>('');
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

  const approveMutation = useMutation({
    mutationFn: (notes?: string) => quotesApi.approve(id!, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote', id] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      success('Quote approved');
      setApproveModalOpen(false);
      setApproveNotes('');
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Failed to approve quote';
      showError(errorMessage);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => quotesApi.reject(id!, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote', id] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      success('Quote rejected');
      setRejectModalOpen(false);
      setRejectReason('');
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Failed to reject quote';
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
    mutationFn: ({ outcome, lossReasonCategory, reasonNotes }: { outcome: 'WON' | 'LOST'; lossReasonCategory?: 'PRICE_TOO_HIGH' | 'FOUND_BETTER_DEAL' | 'PROJECT_CANCELLED' | 'DELIVERY_TIMING' | 'QUALITY_CONCERNS' | 'OTHER'; reasonNotes?: string }) =>
      quotesApi.markOutcome(id!, outcome, lossReasonCategory, reasonNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote', id] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      success(`Quote marked as ${outcomeType}`);
      setOutcomeModalOpen(false);
      setLossReasonCategory('');
      setOutcomeNotes('');
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Failed to update outcome';
      showError(errorMessage);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => quotesApi.remove(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      success('Quote deleted successfully');
      navigate('/sales/quotes');
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to delete quote';
      if (errorMessage.includes('draft')) {
        showError('Only draft quotes can be deleted');
      } else {
        showError(errorMessage);
      }
    },
  });

  const handleDelete = () => {
    if (!quote) return;
    if (window.confirm(`Are you sure you want to delete quote ${quote.quoteNumber}? This action cannot be undone.`)) {
      deleteMutation.mutate();
    }
  };

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
  // Check if user can approve (has permission OR is sales manager OR is admin)
  // Admins can approve their own quotes
  const canApproveQuote = () => {
    if (quote.status !== 'PENDING_APPROVAL') return false;
    
    // Check various role name formats
    const isAdmin = hasRole('Administrator') || hasRole('Admin') || hasRole('ADMIN') || hasRole('admin');
    const isSalesManager = hasRole('Sales Manager') || hasRole('SALES_MANAGER') || hasRole('sales_manager');
    const hasApprovePermission = hasPermission('quotes:approve');
    
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

  const canPrint = quote.status === 'APPROVED' || quote.status === 'WON' || quote.status === 'LOST';

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Quote ${quote.quoteNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .quote-number { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            .info-row { margin-bottom: 8px; }
            .label { font-weight: bold; display: inline-block; width: 150px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f0f0f0; font-weight: bold; }
            .total-row { font-weight: bold; }
            .text-right { text-align: right; }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="quote-number">Quote ${quote.quoteNumber}</div>
            <div>Status: ${quote.status.replace('_', ' ')}</div>
            <div>Date: ${new Date(quote.createdAt).toLocaleDateString()}</div>
          </div>

          <div class="section">
            <div class="section-title">Company Information</div>
            <div class="info-row"><span class="label">Company:</span> ${quote.company?.name || 'N/A'}</div>
            <div class="info-row"><span class="label">Project:</span> ${quote.project?.name || 'N/A'}</div>
          </div>

          <div class="section">
            <div class="section-title">Customer Information</div>
            <div class="info-row"><span class="label">Customer:</span> ${quote.customer?.companyName || `${quote.customer?.firstName || ''} ${quote.customer?.lastName || ''}`.trim() || 'N/A'}</div>
            ${quote.contact ? `<div class="info-row"><span class="label">Contact:</span> ${quote.contact.name}</div>` : ''}
          </div>

          <div class="section">
            <div class="section-title">Delivery Information</div>
            <div class="info-row"><span class="label">Method:</span> ${quote.deliveryMethod || 'N/A'}</div>
            ${quote.deliveryMethod === 'DELIVERED' ? `
              <div class="info-row"><span class="label">Address:</span> ${quote.deliveryAddressLine1 || ''} ${quote.deliveryCity || ''}</div>
              ${quote.route ? `<div class="info-row"><span class="label">Route:</span> ${quote.route.fromCity} to ${quote.route.toCity}</div>` : ''}
            ` : ''}
          </div>

          <div class="section">
            <div class="section-title">Products & Pricing</div>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Discount</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${quote.items?.map(item => `
                  <tr>
                    <td>${item.nameSnapshot}</td>
                    <td>${Number(item.qty).toFixed(2)} ${item.uomSnapshot}</td>
                    <td>$${Number(item.unitPrice).toFixed(2)}</td>
                    <td>${Number(item.discountPercentage) > 0 ? `${Number(item.discountPercentage).toFixed(1)}%` : '-'}</td>
                    <td>$${Number(item.lineTotal).toFixed(2)}</td>
                  </tr>
                `).join('') || '<tr><td colspan="5">No items</td></tr>'}
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="4" class="text-right">Subtotal:</td>
                  <td>$${Number(quote.subtotal).toFixed(2)}</td>
                </tr>
                ${Number(quote.discountPercentage) > 0 ? `
                  <tr class="total-row">
                    <td colspan="4" class="text-right">Discount (${Number(quote.discountPercentage).toFixed(1)}%):</td>
                    <td>-$${(Number(quote.subtotal) * Number(quote.discountPercentage) / 100).toFixed(2)}</td>
                  </tr>
                ` : ''}
                ${Number(quote.transportTotal) > 0 ? `
                  <tr class="total-row">
                    <td colspan="4" class="text-right">Transport:</td>
                    <td>$${Number(quote.transportTotal).toFixed(2)}</td>
                  </tr>
                ` : ''}
                <tr class="total-row">
                  <td colspan="4" class="text-right">Grand Total:</td>
                  <td>$${Number(quote.grandTotal).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          ${quote.salesRep ? `
            <div class="section">
              <div class="section-title">Sales Representative</div>
              <div class="info-row"><span class="label">Name:</span> ${quote.salesRep.firstName} ${quote.salesRep.lastName}</div>
              ${quote.salesRep.email ? `<div class="info-row"><span class="label">Email:</span> ${quote.salesRep.email}</div>` : ''}
            </div>
          ` : ''}
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

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
            {canApproveQuote() && (
              <>
                <Button
                  variant="primary"
                  onClick={() => setApproveModalOpen(true)}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Approve
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setRejectModalOpen(true)}
                  leftIcon={<XCircle className="w-4 h-4" />}
                >
                  Reject
                </Button>
              </>
            )}
            {canPrint && (
              <Button
                variant="secondary"
                onClick={handlePrint}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Print Quote
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
            {isAdmin && quote && quote.status === 'DRAFT' && (
              <Button
                variant="danger"
                onClick={handleDelete}
                leftIcon={<Trash2 className="w-4 h-4" />}
                disabled={deleteMutation.isPending}
                title="Delete quote (Admin only)"
              >
                Delete Quote
              </Button>
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

        {/* Quote Terms */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-accent-primary/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-accent-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-content-primary">Quote Terms</h3>
              <p className="text-sm text-content-secondary">
                Validity: {quote.validityDays || 7} days
                {quote.paymentTerms && ` • Payment: ${quote.paymentTerms.replace('_', ' ').replace('CASH ON DELIVERY', 'Cash on Delivery').replace('DAYS', '')}`}
              </p>
              {quote.deliveryMethod === 'DELIVERED' && (quote.deliveryStartDate || quote.loadsPerDay || quote.truckType) && (
                <p className="text-xs text-content-tertiary mt-1">
                  {quote.deliveryStartDate && `Start: ${new Date(quote.deliveryStartDate).toLocaleDateString()}`}
                  {quote.loadsPerDay && ` • ${quote.loadsPerDay} load${quote.loadsPerDay !== 1 ? 's' : ''}/day`}
                  {quote.truckType && ` • ${quote.truckType.replace('_', ' ').replace('TIPPER 42T', 'Tipper 42t')}`}
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
                    {item.discountPercentage > 0 && (
                      <span className="text-status-warning ml-2">- {Number(item.discountPercentage).toFixed(1)}% discount</span>
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
          {Number(quote.discountPercentage) > 0 && (
            <div className="flex justify-between text-status-warning">
              <span>Discount ({Number(quote.discountPercentage).toFixed(1)}%):</span>
              <span className="font-semibold">-${(Number(quote.subtotal) * Number(quote.discountPercentage) / 100).toFixed(2)}</span>
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
      <Modal isOpen={outcomeModalOpen} onClose={() => { setOutcomeModalOpen(false); setLossReasonCategory(''); setOutcomeNotes(''); }} title={`Mark Quote as ${outcomeType}`} size="md">
        <div className="space-y-4">
          <div className="p-3 bg-status-info-bg border-l-4 border-status-info rounded-r-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-status-info mt-0.5 flex-shrink-0" />
              <p className="text-xs text-content-secondary">
                Marking this quote as {outcomeType} will update the sales KPIs and close this opportunity.
              </p>
            </div>
          </div>
          {outcomeType === 'LOST' && (
            <div>
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
          <Input
            label="Notes (optional)"
            value={outcomeNotes}
            onChange={(e) => setOutcomeNotes(e.target.value)}
            placeholder="Add any additional notes..."
          />
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => { setOutcomeModalOpen(false); setLossReasonCategory(''); setOutcomeNotes(''); }}>
            Cancel
          </Button>
          <Button
            variant={outcomeType === 'WON' ? 'primary' : 'danger'}
            onClick={() => {
              if (outcomeType === 'LOST' && !lossReasonCategory) {
                showError('Loss reason is required');
                return;
              }
              outcomeMutation.mutate({ 
                outcome: outcomeType, 
                lossReasonCategory: outcomeType === 'LOST' ? (lossReasonCategory as any) : undefined, 
                reasonNotes: outcomeNotes || undefined 
              });
            }}
            isLoading={outcomeMutation.isPending}
            leftIcon={outcomeType === 'WON' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          >
            Mark {outcomeType}
          </Button>
        </ModalFooter>
      </Modal>
      {/* Approve Modal */}
      <Modal isOpen={approveModalOpen} onClose={() => { setApproveModalOpen(false); setApproveNotes(''); }} title="Approve Quote" size="md">
        <Input label="Notes (optional)" value={approveNotes} onChange={(e) => setApproveNotes(e.target.value)} placeholder="Add any notes..." />
        <ModalFooter>
          <Button variant="secondary" onClick={() => { setApproveModalOpen(false); setApproveNotes(''); }}>Cancel</Button>
          <Button variant="primary" onClick={() => approveMutation.mutate(approveNotes || undefined)} isLoading={approveMutation.isPending}>
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
            rejectMutation.mutate(rejectReason);
          }} isLoading={rejectMutation.isPending}>
            Reject
          </Button>
        </ModalFooter>
      </Modal>
    </PageContainer>
  );
}
