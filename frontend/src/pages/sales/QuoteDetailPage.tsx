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
  Trash2,
  Archive,
  RotateCw
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

  const { data: quoteData, isLoading, refetch: refetchQuote } = useQuery({
    queryKey: ['quote', id],
    queryFn: async () => {
      const res = await quotesApi.findOne(id!);
      return res.data.data;
    },
    enabled: !!id,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const handleRefresh = () => {
    refetchQuote();
  };

  const submitMutation = useMutation({
    mutationFn: (notes?: string) => quotesApi.submit(id!, notes),
    onSuccess: () => {
      // Invalidate and refetch immediately
      queryClient.invalidateQueries({ queryKey: ['quote', id] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.refetchQueries({ queryKey: ['quote', id] });
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
      queryClient.invalidateQueries({ queryKey: ['quotes-kpis'] }); // Invalidate all KPI queries
      queryClient.refetchQueries({ queryKey: ['quote', id] });
      success('Quote approved successfully');
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
      queryClient.invalidateQueries({ queryKey: ['quotes-kpis'] }); // Invalidate all KPI queries
      queryClient.refetchQueries({ queryKey: ['quote', id] });
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
      queryClient.refetchQueries({ queryKey: ['quote', id] });
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
      // Invalidate only the specific queries that need updating
      queryClient.invalidateQueries({ queryKey: ['quote', id] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quotes-kpis'] }); // Invalidate all KPI queries
      queryClient.refetchQueries({ queryKey: ['quote', id] });
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

  const archiveMutation = useMutation({
    mutationFn: () => quotesApi.archive(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote', id] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quotes-kpis'] }); // Invalidate all KPI queries
      queryClient.refetchQueries({ queryKey: ['quote', id] });
      success('Quote archived successfully');
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to archive quote';
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
      showError(errorMessage);
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

    // Calculate totals
    const subtotal = Number(quote.subtotal);
    const discountAmount = subtotal * (Number(quote.discountPercentage) / 100);
    const subtotalAfterDiscount = subtotal - discountAmount;
    const vatRate = 0.16; // 16% VAT
    const vatAmount = subtotalAfterDiscount * vatRate;
    const transportTotal = Number(quote.transportTotal) || 0;
    
    // Calculate total quantity in tons for transport cost per ton
    const totalTons = quote.items?.reduce((sum, item) => {
      const qty = Number(item.qty);
      // If UOM is not tons, assume it's already in tons or convert if needed
      return sum + qty;
    }, 0) || 0;
    const transportCostPerTon = totalTons > 0 ? transportTotal / totalTons : 0;
    
    const grandTotal = subtotalAfterDiscount + vatAmount + transportTotal;
    
    const customerName = quote.customer?.companyName || 
      `${quote.customer?.firstName || ''} ${quote.customer?.lastName || ''}`.trim() || 'N/A';

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Quote ${quote.quoteNumber}</title>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              padding: 30px 40px; 
              color: #333;
              line-height: 1.6;
            }
            .header { 
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 3px solid #2563eb;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .logo-section {
              flex: 0 0 200px;
            }
            .logo {
              max-width: 180px;
              max-height: 100px;
              object-fit: contain;
            }
            .header-info {
              flex: 1;
              text-align: right;
            }
            .quote-number { 
              font-size: 32px; 
              font-weight: bold; 
              color: #2563eb;
              margin-bottom: 8px;
            }
            .quote-date {
              font-size: 14px;
              color: #666;
              margin-bottom: 5px;
            }
            .quote-status {
              display: inline-block;
              padding: 4px 12px;
              background: #dbeafe;
              color: #1e40af;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
            }
            .two-column {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin-bottom: 30px;
            }
            .section { 
              margin-bottom: 25px;
              background: #f9fafb;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #2563eb;
            }
            .section-title { 
              font-size: 16px; 
              font-weight: bold; 
              color: #1e40af;
              margin-bottom: 15px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .section-title::before {
              content: "📋";
              font-size: 18px;
            }
            .info-row { 
              margin-bottom: 10px;
              display: flex;
            }
            .label { 
              font-weight: 600; 
              color: #555;
              min-width: 140px;
              display: inline-block;
            }
            .value {
              color: #333;
            }
            .company-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-top: 10px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 15px;
              background: white;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            th, td { 
              border: 1px solid #e5e7eb; 
              padding: 12px; 
              text-align: left;
            }
            th { 
              background: linear-gradient(to bottom, #2563eb, #1e40af);
              color: white;
              font-weight: 600;
              text-transform: uppercase;
              font-size: 12px;
            }
            tbody tr:nth-child(even) {
              background: #f9fafb;
            }
            tbody tr:hover {
              background: #f3f4f6;
            }
            .total-row { 
              font-weight: bold;
              background: #eff6ff !important;
            }
            .text-right { 
              text-align: right; 
            }
            .totals-section {
              margin-top: 20px;
              margin-left: auto;
              width: 400px;
            }
            .totals-table {
              width: 100%;
            }
            .totals-table td {
              padding: 8px 12px;
              border: 1px solid #e5e7eb;
            }
            .totals-table .total-row td {
              background: #2563eb;
              color: white;
              font-size: 18px;
              font-weight: bold;
            }
            .signature-section {
              margin-top: 60px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              padding-top: 30px;
              border-top: 2px solid #e5e7eb;
            }
            .signature-box {
              text-align: center;
            }
            .signature-line {
              border-top: 2px solid #333;
              margin-top: 60px;
              margin-bottom: 10px;
              width: 100%;
            }
            .signature-label {
              font-weight: 600;
              color: #555;
              font-size: 14px;
            }
            .icon {
              display: inline-block;
              margin-right: 6px;
              font-size: 16px;
            }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
              .section {
                page-break-inside: avoid;
              }
              table {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-section">
              ${quote.company?.logoUrl ? `<img src="${quote.company.logoUrl}" alt="${quote.company.name}" class="logo" />` : ''}
            </div>
            <div class="header-info">
              <div class="quote-number">QUOTE #${quote.quoteNumber}</div>
              <div class="quote-date">Date: ${new Date(quote.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              <div style="margin-top: 8px;">
                <span class="quote-status">${quote.status.replace('_', ' ')}</span>
              </div>
            </div>
          </div>

          <div class="two-column">
            <div class="section">
              <div class="section-title">Company Information</div>
              <div class="info-row">
                <span class="label"><span class="icon">🏢</span>Company:</span>
                <span class="value">${quote.company?.name || 'N/A'}</span>
              </div>
              ${quote.company?.legalName ? `
                <div class="info-row">
                  <span class="label">Legal Name:</span>
                  <span class="value">${quote.company.legalName}</span>
                </div>
              ` : ''}
              <div class="company-details">
                ${quote.company?.nif ? `
                  <div class="info-row">
                    <span class="label">NIF:</span>
                    <span class="value">${quote.company.nif}</span>
                  </div>
                ` : ''}
                ${quote.company?.rccm ? `
                  <div class="info-row">
                    <span class="label">RCCM:</span>
                    <span class="value">${quote.company.rccm}</span>
                  </div>
                ` : ''}
                ${quote.company?.idNational ? `
                  <div class="info-row">
                    <span class="label">ID National:</span>
                    <span class="value">${quote.company.idNational}</span>
                  </div>
                ` : ''}
                ${quote.company?.vat ? `
                  <div class="info-row">
                    <span class="label">VAT Number:</span>
                    <span class="value">${quote.company.vat}</span>
                  </div>
                ` : ''}
              </div>
              ${quote.company?.addressLine1 ? `
                <div class="info-row" style="margin-top: 10px;">
                  <span class="label"><span class="icon">📍</span>Address:</span>
                  <span class="value">${quote.company.addressLine1}${quote.company.city ? `, ${quote.company.city}` : ''}${quote.company.country ? `, ${quote.company.country}` : ''}</span>
                </div>
              ` : ''}
              ${quote.company?.phone ? `
                <div class="info-row">
                  <span class="label"><span class="icon">📞</span>Phone:</span>
                  <span class="value">${quote.company.phone}</span>
                </div>
              ` : ''}
              ${quote.company?.email ? `
                <div class="info-row">
                  <span class="label"><span class="icon">✉️</span>Email:</span>
                  <span class="value">${quote.company.email}</span>
                </div>
              ` : ''}
            </div>

            <div class="section">
              <div class="section-title">Customer Information</div>
              <div class="info-row">
                <span class="label"><span class="icon">👤</span>Customer:</span>
                <span class="value">${customerName}</span>
              </div>
              ${quote.contact ? `
                <div class="info-row">
                  <span class="label">Contact:</span>
                  <span class="value">${quote.contact.name}</span>
                </div>
              ` : ''}
              ${quote.project ? `
                <div class="info-row">
                  <span class="label"><span class="icon">📁</span>Project:</span>
                  <span class="value">${quote.project.name}</span>
                </div>
              ` : ''}
              ${quote.deliveryMethod === 'DELIVERED' && quote.deliveryAddressLine1 ? `
                <div class="info-row" style="margin-top: 10px;">
                  <span class="label"><span class="icon">🚚</span>Delivery Address:</span>
                  <span class="value">${quote.deliveryAddressLine1}${quote.deliveryCity ? `, ${quote.deliveryCity}` : ''}</span>
                </div>
              ` : ''}
            </div>
          </div>

          <div class="section">
            <div class="section-title">Products & Pricing</div>
            <table>
              <thead>
                <tr>
                  <th>Item Description</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Discount</th>
                  <th>Line Total</th>
                </tr>
              </thead>
              <tbody>
                ${quote.items?.map(item => `
                  <tr>
                    <td><strong>${item.nameSnapshot}</strong></td>
                    <td>${Number(item.qty).toFixed(2)} ${item.uomSnapshot}</td>
                    <td>$${Number(item.unitPrice).toFixed(2)}</td>
                    <td>${Number(item.discountPercentage) > 0 ? `${Number(item.discountPercentage).toFixed(1)}%` : '-'}</td>
                    <td><strong>$${Number(item.lineTotal).toFixed(2)}</strong></td>
                  </tr>
                `).join('') || '<tr><td colspan="5" style="text-align: center; padding: 20px;">No items</td></tr>'}
              </tbody>
            </table>

            <div class="totals-section">
              <table class="totals-table">
                <tr>
                  <td class="text-right">Subtotal:</td>
                  <td class="text-right">$${subtotal.toFixed(2)}</td>
                </tr>
                ${discountAmount > 0 ? `
                  <tr>
                    <td class="text-right">Discount (${Number(quote.discountPercentage).toFixed(1)}%):</td>
                    <td class="text-right">-$${discountAmount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td class="text-right">Subtotal After Discount:</td>
                    <td class="text-right">$${subtotalAfterDiscount.toFixed(2)}</td>
                  </tr>
                ` : ''}
                <tr>
                  <td class="text-right">VAT (16%):</td>
                  <td class="text-right">$${vatAmount.toFixed(2)}</td>
                </tr>
                ${transportTotal > 0 ? `
                  <tr>
                    <td class="text-right">Transport (${totalTons.toFixed(2)} tons @ $${transportCostPerTon.toFixed(2)}/ton):</td>
                    <td class="text-right">$${transportTotal.toFixed(2)}</td>
                  </tr>
                ` : ''}
                <tr class="total-row">
                  <td class="text-right">Grand Total:</td>
                  <td class="text-right">$${grandTotal.toFixed(2)}</td>
                </tr>
              </table>
            </div>
          </div>

          ${quote.salesRep ? `
            <div class="section">
              <div class="section-title">Sales Representative</div>
              <div class="info-row">
                <span class="label">Name:</span>
                <span class="value">${quote.salesRep.firstName} ${quote.salesRep.lastName}</span>
              </div>
              ${quote.salesRep.email ? `
                <div class="info-row">
                  <span class="label">Email:</span>
                  <span class="value">${quote.salesRep.email}</span>
                </div>
              ` : ''}
            </div>
          ` : ''}

          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">Customer Signature</div>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">Authorized Representative</div>
            </div>
          </div>
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
            <Button
              variant="secondary"
              onClick={handleRefresh}
              leftIcon={<RotateCw className="w-4 h-4" />}
              disabled={isLoading}
            >
              Refresh
            </Button>
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
            {/* Show Archive for WON, LOST, REJECTED quotes that aren't archived */}
            {quote && !quote.archived && ['WON', 'LOST', 'REJECTED'].includes(quote.status) && (isAdmin || isCreator) && (
              <Button
                variant="secondary"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to archive quote ${quote.quoteNumber}?`)) {
                    archiveMutation.mutate();
                  }
                }}
                leftIcon={<Archive className="w-4 h-4" />}
                disabled={archiveMutation.isPending}
                title="Archive quote"
              >
                Archive Quote
              </Button>
            )}
            {/* Show Delete only for DRAFT quotes */}
            {quote && ((isAdmin) || (isCreator && quote.status === 'DRAFT')) && (
              <Button
                variant="danger"
                onClick={handleDelete}
                leftIcon={<Trash2 className="w-4 h-4" />}
                disabled={deleteMutation.isPending}
                title={isAdmin ? "Delete quote (Admin)" : "Delete draft quote"}
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
          {quote.costPerKmSnapshot && (
            <div className="mt-4 pt-4 border-t border-border-default">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-content-secondary mb-1">Rate Per Km</p>
                  <p className="font-medium text-content-primary">
                    ${Number(quote.costPerKmSnapshot).toFixed(2)}/km
                  </p>
                </div>
                {quote.tollTotalSnapshot && Number(quote.tollTotalSnapshot) > 0 && (
                  <div>
                    <p className="text-sm text-content-secondary mb-1">Tolls</p>
                    <p className="font-medium text-content-primary">
                      ${Number(quote.tollTotalSnapshot).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
              {quote.items && quote.items.length > 0 && (
                <div className="mt-4 p-3 bg-status-info-bg rounded-lg border-l-4 border-status-info">
                  <p className="text-xs text-content-secondary">
                    <Info className="w-4 h-4 inline mr-1" />
                    <strong>Transport Calculation:</strong>
                    <span className="block mt-1">
                      {(() => {
                        const totalTonnage = quote.items.reduce((sum, item) => {
                          const qty = Number(item.qty);
                          const uom = item.uomSnapshot.toUpperCase();
                          let tons = 0;
                          if (uom === 'TON' || uom === 'TONS' || uom === 'T' || uom === 'MT' || uom === 'METRIC TON' || uom === 'METRIC TONS') {
                            tons = qty;
                          } else if (uom === 'KG' || uom === 'KGS' || uom === 'KILOGRAM' || uom === 'KILOGRAMS') {
                            tons = qty / 1000;
                          } else {
                            tons = qty;
                          }
                          return sum + tons;
                        }, 0);
                        const tolls = Number(quote.tollTotalSnapshot || 0);
                        return `${totalTonnage.toFixed(2)} tons × $${Number(quote.costPerKmSnapshot).toFixed(2)}/km × ${Number(quote.distanceKmSnapshot || 0).toFixed(2)} km${tolls > 0 ? ` + $${tolls.toFixed(2)} tolls` : ''} = $${Number(quote.transportTotal).toFixed(2)}`;
                      })()}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}
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
