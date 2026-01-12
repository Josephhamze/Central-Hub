import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer';
import { pdfTheme } from '@lib/pdf-theme';
import {
  Building2Icon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  MailIcon,
  FileTextIcon,
  PackageIcon,
  TruckIcon,
  FolderOpenIcon,
  CheckCircle2Icon,
  ClockIcon,
  CreditCardIcon,
} from '@lib/pdf-icons';
import type { Quote } from '@services/sales/quotes';

// Register Inter font with proper weights
// Using Google Fonts CDN for reliable font loading
Font.register({
  family: 'Inter',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2',
      fontWeight: 300,
    },
    {
      src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2',
      fontWeight: 400,
    },
    {
      src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2',
      fontWeight: 500,
    },
    {
      src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2',
      fontWeight: 600,
    },
  ],
});

// Apple-inspired Stylesheet
const styles = StyleSheet.create({
  page: {
    padding: pdfTheme.spacing(6),
    fontFamily: pdfTheme.fonts.family,
    backgroundColor: pdfTheme.colors.white,
    fontSize: pdfTheme.typography.body.fontSize,
    lineHeight: pdfTheme.typography.body.lineHeight,
  },
  // Header Section
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: pdfTheme.spacing(8),
    paddingBottom: pdfTheme.spacing(5),
    borderBottomWidth: 1,
    borderBottomColor: pdfTheme.colors.border,
  },
  logoContainer: {
    width: 200,
  },
  logo: {
    maxWidth: 160,
    maxHeight: 40,
    objectFit: 'contain',
  },
  headerRight: {
    alignItems: 'flex-end',
    flex: 1,
  },
  quoteLabel: {
    fontSize: pdfTheme.typography.quoteLabel.fontSize,
    fontWeight: pdfTheme.fonts.weights.medium,
    color: pdfTheme.colors.secondary,
    textTransform: pdfTheme.typography.quoteLabel.textTransform,
    letterSpacing: pdfTheme.typography.quoteLabel.letterSpacing,
    marginBottom: pdfTheme.spacing(0.5),
  },
  quoteNumber: {
    fontSize: pdfTheme.typography.quoteNumber.fontSize,
    fontWeight: pdfTheme.fonts.weights.light,
    color: pdfTheme.colors.accent,
    letterSpacing: pdfTheme.typography.quoteNumber.letterSpacing,
    lineHeight: pdfTheme.typography.quoteNumber.lineHeight,
    marginBottom: pdfTheme.spacing(1),
  },
  quoteDate: {
    fontSize: 11,
    fontWeight: pdfTheme.fonts.weights.regular,
    color: pdfTheme.colors.secondary,
    marginBottom: pdfTheme.spacing(2),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: pdfTheme.colors.successBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: pdfTheme.borderRadius.badge,
  },
  statusIconSpacer: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: pdfTheme.fonts.weights.medium,
    color: pdfTheme.colors.success,
    textTransform: 'uppercase',
    letterSpacing: 0.05,
  },
  // Two Column Layout
  twoColumn: {
    flexDirection: 'row',
    gap: pdfTheme.spacing(4),
    marginBottom: pdfTheme.spacing(6),
  },
  column: {
    flex: 1,
  },
  // Section Styling
  section: {
    backgroundColor: pdfTheme.colors.backgroundAlt,
    padding: pdfTheme.spacing(4),
    borderRadius: pdfTheme.borderRadius.card,
    borderWidth: 1,
    borderColor: pdfTheme.colors.border,
  },
  sectionTitle: {
    fontSize: pdfTheme.typography.sectionHeader.fontSize,
    fontWeight: pdfTheme.fonts.weights.medium,
    color: pdfTheme.colors.secondary,
    textTransform: pdfTheme.typography.sectionHeader.textTransform,
    letterSpacing: pdfTheme.typography.sectionHeader.letterSpacing,
    marginBottom: pdfTheme.spacing(3),
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSpacer: {
    marginRight: 6,
  },
  // Info Rows
  infoRow: {
    flexDirection: 'row',
    marginBottom: pdfTheme.spacing(2),
    alignItems: 'flex-start',
  },
  iconSpacerSmall: {
    marginRight: 6,
  },
  infoRowVertical: {
    flexDirection: 'column',
    marginBottom: pdfTheme.spacing(2),
    gap: 2,
  },
  label: {
    fontSize: pdfTheme.typography.label.fontSize,
    fontWeight: pdfTheme.fonts.weights.medium,
    color: pdfTheme.colors.secondary,
    width: 100,
    flexShrink: 0,
  },
  value: {
    fontSize: pdfTheme.typography.value.fontSize,
    fontWeight: pdfTheme.fonts.weights.regular,
    color: pdfTheme.colors.primary,
    flex: 1,
    lineHeight: pdfTheme.typography.value.lineHeight,
  },
  companyName: {
    fontSize: pdfTheme.typography.value.fontSize,
    fontWeight: pdfTheme.fonts.weights.semibold,
    color: pdfTheme.colors.primary,
    marginBottom: 4,
  },
  companyLegalName: {
    fontSize: 10,
    fontWeight: pdfTheme.fonts.weights.regular,
    color: pdfTheme.colors.secondary,
    marginBottom: pdfTheme.spacing(2),
  },
  // Project Section
  projectSection: {
    marginBottom: pdfTheme.spacing(5),
    paddingBottom: pdfTheme.spacing(4),
    borderBottomWidth: 1,
    borderBottomColor: pdfTheme.colors.border,
  },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: pdfTheme.spacing(2),
  },
  // Table Styling
  table: {
    marginTop: pdfTheme.spacing(4),
    marginBottom: pdfTheme.spacing(4),
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: pdfTheme.spacing(2),
    borderBottomWidth: 1,
    borderBottomColor: pdfTheme.colors.border,
    marginBottom: pdfTheme.spacing(1),
  },
  tableHeaderCell: {
    fontSize: pdfTheme.typography.tableHeader.fontSize,
    fontWeight: pdfTheme.fonts.weights.medium,
    color: pdfTheme.colors.secondary,
    textTransform: pdfTheme.typography.tableHeader.textTransform,
    letterSpacing: pdfTheme.typography.tableHeader.letterSpacing,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: pdfTheme.spacing(2),
    borderBottomWidth: 1,
    borderBottomColor: pdfTheme.colors.border,
  },
  tableCell: {
    fontSize: pdfTheme.typography.tableCell.fontSize,
    fontWeight: pdfTheme.fonts.weights.regular,
    color: pdfTheme.colors.primary,
    lineHeight: pdfTheme.typography.tableCell.lineHeight,
  },
  tableCellRight: {
    textAlign: 'right',
    fontFamily: 'Courier', // Tabular figures for alignment
  },
  // Totals Section
  totalsContainer: {
    alignItems: 'flex-end',
    marginTop: pdfTheme.spacing(5),
    marginLeft: 'auto',
    width: 320,
    backgroundColor: pdfTheme.colors.backgroundAlt,
    padding: pdfTheme.spacing(4),
    borderRadius: pdfTheme.borderRadius.card,
    borderWidth: 1,
    borderColor: pdfTheme.colors.border,
  },
  totalsTable: {
    width: '100%',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: pdfTheme.spacing(1.5),
    borderBottomWidth: 1,
    borderBottomColor: pdfTheme.colors.border,
  },
  totalsLabel: {
    fontSize: pdfTheme.typography.total.fontSize,
    fontWeight: pdfTheme.fonts.weights.regular,
    color: pdfTheme.colors.secondary,
    marginRight: pdfTheme.spacing(4),
  },
  totalsValue: {
    fontSize: pdfTheme.typography.total.fontSize,
    fontWeight: pdfTheme.fonts.weights.regular,
    color: pdfTheme.colors.primary,
    fontFamily: 'Courier', // Tabular figures
    minWidth: 120,
    textAlign: 'right',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: pdfTheme.spacing(3),
    paddingBottom: pdfTheme.spacing(2),
    borderTopWidth: 1,
    borderTopColor: pdfTheme.colors.border,
    marginTop: pdfTheme.spacing(2),
  },
  grandTotalLabel: {
    fontSize: pdfTheme.typography.grandTotal.fontSize,
    fontWeight: pdfTheme.fonts.weights.semibold,
    color: pdfTheme.colors.primary,
    letterSpacing: pdfTheme.typography.grandTotal.letterSpacing,
  },
  grandTotalValue: {
    fontSize: pdfTheme.typography.grandTotal.fontSize,
    fontWeight: pdfTheme.fonts.weights.semibold,
    color: pdfTheme.colors.primary,
    fontFamily: 'Courier', // Tabular figures
    minWidth: 120,
    textAlign: 'right',
    letterSpacing: pdfTheme.typography.grandTotal.letterSpacing,
  },
  // Terms & Conditions
  termsSection: {
    marginTop: pdfTheme.spacing(6),
    paddingTop: pdfTheme.spacing(4),
    borderTopWidth: 1,
    borderTopColor: pdfTheme.colors.border,
  },
  termsTitle: {
    fontSize: pdfTheme.typography.sectionHeader.fontSize,
    fontWeight: pdfTheme.fonts.weights.medium,
    color: pdfTheme.colors.secondary,
    textTransform: pdfTheme.typography.sectionHeader.textTransform,
    letterSpacing: pdfTheme.typography.sectionHeader.letterSpacing,
    marginBottom: pdfTheme.spacing(2),
  },
  termsText: {
    fontSize: pdfTheme.typography.terms.fontSize,
    fontWeight: pdfTheme.fonts.weights.regular,
    color: pdfTheme.colors.secondary,
    lineHeight: pdfTheme.typography.terms.lineHeight,
    marginBottom: pdfTheme.spacing(1.5),
  },
  // Signature Section
  signatureSection: {
    flexDirection: 'row',
    marginTop: pdfTheme.spacing(6),
    paddingTop: pdfTheme.spacing(4),
    borderTopWidth: 1,
    borderTopColor: pdfTheme.colors.border,
  },
  signatureBoxSpacer: {
    marginRight: pdfTheme.spacing(6),
  },
  signatureBox: {
    flex: 1,
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: pdfTheme.colors.primary,
    marginTop: pdfTheme.spacing(8),
    marginBottom: pdfTheme.spacing(1),
  },
  signatureLabel: {
    fontSize: pdfTheme.typography.label.fontSize,
    fontWeight: pdfTheme.fonts.weights.medium,
    color: pdfTheme.colors.secondary,
  },
});

interface QuotePDFProps {
  quote: Quote;
}

// Helper function to format currency with proper thousand separators
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Helper function to format number with thousand separators
const formatNumber = (num: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

// Helper to format payment terms
const formatPaymentTerms = (terms?: string): string => {
  if (!terms) return 'Net 30 days';
  switch (terms) {
    case 'CASH_ON_DELIVERY':
      return 'Cash on Delivery';
    case 'DAYS_15':
      return 'Net 15 days';
    case 'DAYS_30':
      return 'Net 30 days';
    default:
      return 'Net 30 days';
  }
};

export const QuotePDF: React.FC<QuotePDFProps> = ({ quote }) => {
  // Calculate totals
  const subtotal = Number(quote.subtotal);
  const discountAmount = subtotal * (Number(quote.discountPercentage) / 100);
  const subtotalAfterDiscount = subtotal - discountAmount;
  const vatRate = 0.16; // 16% VAT
  const vatAmount = subtotalAfterDiscount * vatRate;
  const transportTotal = Number(quote.transportTotal) || 0;
  
  // Calculate total quantity in tons for transport cost per ton
  const totalTons = quote.items?.reduce((sum, item) => {
    return sum + Number(item.qty);
  }, 0) || 0;
  const transportCostPerTon = totalTons > 0 ? transportTotal / totalTons : 0;
  
  const grandTotal = subtotalAfterDiscount + vatAmount + transportTotal;
  
  const customerName = quote.customer?.companyName || 
    `${quote.customer?.firstName || ''} ${quote.customer?.lastName || ''}`.trim() || 'N/A';

  // Get logo URL
  const getLogoUrl = (logoUrl?: string): string => {
    if (!logoUrl) return '';
    if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
      return logoUrl;
    }
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`;
  };

  const quoteDate = new Date(quote.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const statusDisplay = quote.status.replace(/_/g, ' ');

  // Calculate validity date
  const validityDate = quote.validityDays
    ? new Date(new Date(quote.createdAt).getTime() + quote.validityDays * 24 * 60 * 60 * 1000)
        .toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            {quote.company?.logoUrl && (
              <Image
                src={getLogoUrl(quote.company.logoUrl)}
                style={styles.logo}
              />
            )}
            {quote.company?.name && !quote.company?.logoUrl && (
              <Text style={styles.companyName}>{quote.company.name}</Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.quoteLabel}>QUOTE</Text>
            <Text style={styles.quoteNumber}>#{quote.quoteNumber}</Text>
            <Text style={styles.quoteDate}>{quoteDate}</Text>
            <View style={styles.statusBadge}>
              {quote.status === 'APPROVED' && (
                <View style={styles.statusIconSpacer}>
                  <CheckCircle2Icon size={12} />
                </View>
              )}
              {quote.status === 'PENDING_APPROVAL' && (
                <View style={styles.statusIconSpacer}>
                  <ClockIcon size={12} />
                </View>
              )}
              <Text style={styles.statusText}>{statusDisplay}</Text>
            </View>
          </View>
        </View>

        {/* FROM / TO Sections */}
        <View style={styles.twoColumn}>
          {/* FROM - Company */}
          <View style={styles.column}>
            <View style={styles.section}>
              <View style={styles.sectionTitle}>
                <View style={styles.iconSpacer}>
                  <Building2Icon size={12} />
                </View>
                <Text>FROM</Text>
              </View>
              <Text style={styles.companyName}>{quote.company?.name || 'N/A'}</Text>
              {quote.company?.legalName && (
                <Text style={styles.companyLegalName}>{quote.company.legalName}</Text>
              )}
              
              {/* Company Details */}
              {quote.company?.nif && (
                <View style={styles.infoRow}>
                  <View style={styles.iconSpacerSmall}>
                    <FileTextIcon size={12} />
                  </View>
                  <View style={styles.infoRowVertical}>
                    <Text style={styles.label}>NIF</Text>
                    <Text style={styles.value}>{quote.company.nif}</Text>
                  </View>
                </View>
              )}
              {quote.company?.rccm && (
                <View style={styles.infoRow}>
                  <View style={styles.iconSpacerSmall}>
                    <FileTextIcon size={12} />
                  </View>
                  <View style={styles.infoRowVertical}>
                    <Text style={styles.label}>RCCM</Text>
                    <Text style={styles.value}>{quote.company.rccm}</Text>
                  </View>
                </View>
              )}
              {quote.company?.idNational && (
                <View style={styles.infoRow}>
                  <View style={styles.iconSpacerSmall}>
                    <FileTextIcon size={12} />
                  </View>
                  <View style={styles.infoRowVertical}>
                    <Text style={styles.label}>ID National</Text>
                    <Text style={styles.value}>{quote.company.idNational}</Text>
                  </View>
                </View>
              )}
              {quote.company?.vat && (
                <View style={styles.infoRow}>
                  <View style={styles.iconSpacerSmall}>
                    <FileTextIcon size={12} />
                  </View>
                  <View style={styles.infoRowVertical}>
                    <Text style={styles.label}>VAT</Text>
                    <Text style={styles.value}>{quote.company.vat}</Text>
                  </View>
                </View>
              )}

              {/* Address */}
              {quote.company?.addressLine1 && (
                <View style={[styles.infoRow, { marginTop: pdfTheme.spacing(2) }]}>
                  <View style={styles.iconSpacerSmall}>
                    <MapPinIcon size={12} />
                  </View>
                  <Text style={styles.value}>
                    {quote.company.addressLine1}
                    {quote.company.addressLine2 && `, ${quote.company.addressLine2}`}
                    {quote.company.city && `, ${quote.company.city}`}
                    {quote.company.state && `, ${quote.company.state}`}
                    {quote.company.country && `, ${quote.company.country}`}
                  </Text>
                </View>
              )}
              {quote.company?.phone && (
                <View style={styles.infoRow}>
                  <View style={styles.iconSpacerSmall}>
                    <PhoneIcon size={12} />
                  </View>
                  <Text style={styles.value}>{quote.company.phone}</Text>
                </View>
              )}
              {quote.company?.email && (
                <View style={styles.infoRow}>
                  <View style={styles.iconSpacerSmall}>
                    <MailIcon size={12} />
                  </View>
                  <Text style={styles.value}>{quote.company.email}</Text>
                </View>
              )}
            </View>
          </View>

          {/* TO - Customer */}
          <View style={styles.column}>
            <View style={styles.section}>
              <View style={styles.sectionTitle}>
                <View style={styles.iconSpacer}>
                  <UserIcon size={12} />
                </View>
                <Text>TO</Text>
              </View>
              <Text style={styles.companyName}>{customerName}</Text>
              {quote.contact && (
                <View style={[styles.infoRow, { marginTop: pdfTheme.spacing(2) }]}>
                  <View style={styles.iconSpacerSmall}>
                    <UserIcon size={12} />
                  </View>
                  <View style={styles.infoRowVertical}>
                    <Text style={styles.label}>Contact</Text>
                    <Text style={styles.value}>{quote.contact.name}</Text>
                  </View>
                </View>
              )}
              {quote.deliveryMethod === 'DELIVERED' && quote.deliveryAddressLine1 && (
                <View style={[styles.infoRow, { marginTop: pdfTheme.spacing(2) }]}>
                  <View style={styles.iconSpacerSmall}>
                    <TruckIcon size={12} />
                  </View>
                  <Text style={styles.value}>
                    {quote.deliveryAddressLine1}
                    {quote.deliveryAddressLine2 && `, ${quote.deliveryAddressLine2}`}
                    {quote.deliveryCity && `, ${quote.deliveryCity}`}
                    {quote.deliveryState && `, ${quote.deliveryState}`}
                    {quote.deliveryCountry && `, ${quote.deliveryCountry}`}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Project Details */}
        {quote.project && (
          <View style={styles.projectSection}>
            <View style={styles.projectRow}>
              <View style={styles.iconSpacerSmall}>
                <FolderOpenIcon size={12} />
              </View>
              <Text style={styles.label}>Project</Text>
              <Text style={styles.value}>{quote.project.name}</Text>
            </View>
            {quote.deliveryMethod === 'DELIVERED' && quote.deliveryAddressLine1 && (
              <View style={styles.projectRow}>
                <View style={styles.iconSpacerSmall}>
                  <TruckIcon size={12} />
                </View>
                <Text style={styles.label}>Delivery</Text>
                <Text style={styles.value}>
                  {quote.deliveryAddressLine1}
                  {quote.deliveryCity && `, ${quote.deliveryCity}`}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Line Items */}
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <View style={styles.iconSpacer}>
              <PackageIcon size={12} />
            </View>
            <Text>LINE ITEMS</Text>
          </View>
          
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: '40%' }]}>Description</Text>
              <Text style={[styles.tableHeaderCell, { width: '15%', textAlign: 'right' }]}>Quantity</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%', textAlign: 'right' }]}>Unit Price</Text>
              <Text style={[styles.tableHeaderCell, { width: '25%', textAlign: 'right' }]}>Amount</Text>
            </View>

            {/* Table Rows */}
            {quote.items?.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '40%' }]}>{item.nameSnapshot}</Text>
                <Text style={[styles.tableCell, styles.tableCellRight, { width: '15%' }]}>
                  {formatNumber(Number(item.qty), 2)} {item.uomSnapshot}
                </Text>
                <Text style={[styles.tableCell, styles.tableCellRight, { width: '20%' }]}>
                  {formatCurrency(Number(item.unitPrice))}
                </Text>
                <Text style={[styles.tableCell, styles.tableCellRight, { width: '25%', fontWeight: pdfTheme.fonts.weights.medium }]}>
                  {formatCurrency(Number(item.lineTotal))}
                </Text>
              </View>
            ))}
          </View>

          {/* Totals */}
          <View style={styles.totalsContainer}>
            <View style={styles.totalsTable}>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Subtotal</Text>
                <Text style={styles.totalsValue}>{formatCurrency(subtotal)}</Text>
              </View>
              {discountAmount > 0 && (
                <>
                  <View style={styles.totalsRow}>
                    <Text style={styles.totalsLabel}>Discount ({formatNumber(Number(quote.discountPercentage), 1)}%)</Text>
                    <Text style={styles.totalsValue}>-{formatCurrency(discountAmount)}</Text>
                  </View>
                  <View style={styles.totalsRow}>
                    <Text style={styles.totalsLabel}>Subtotal After Discount</Text>
                    <Text style={styles.totalsValue}>{formatCurrency(subtotalAfterDiscount)}</Text>
                  </View>
                </>
              )}
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>VAT (16%)</Text>
                <Text style={styles.totalsValue}>{formatCurrency(vatAmount)}</Text>
              </View>
              {transportTotal > 0 && (
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>
                    Transport ({formatNumber(totalTons, 2)} tons @ {formatCurrency(transportCostPerTon)}/ton)
                  </Text>
                  <Text style={styles.totalsValue}>{formatCurrency(transportTotal)}</Text>
                </View>
              )}
              <View style={styles.grandTotalRow}>
                <Text style={styles.grandTotalLabel}>GRAND TOTAL</Text>
                <Text style={styles.grandTotalValue}>{formatCurrency(grandTotal)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Terms & Conditions */}
        <View style={styles.termsSection}>
          <View style={styles.sectionTitle}>
            <View style={styles.iconSpacer}>
              <CreditCardIcon size={12} />
            </View>
            <Text>TERMS & CONDITIONS</Text>
          </View>
          <Text style={styles.termsText}>
            Payment Terms: {formatPaymentTerms(quote.paymentTerms)}
          </Text>
          {validityDate && (
            <Text style={styles.termsText}>
              This quote is valid until {validityDate}.
            </Text>
          )}
          {quote.deliveryStartDate && (
            <Text style={styles.termsText}>
              Delivery Start Date: {new Date(quote.deliveryStartDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          )}
          {quote.serviceEndDate && (
            <Text style={styles.termsText}>
              Service End Date: {new Date(quote.serviceEndDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          )}
          {quote.loadsPerDay && (
            <Text style={styles.termsText}>
              Expected Loads Per Day: {quote.loadsPerDay}
            </Text>
          )}
          {quote.truckType && (
            <Text style={styles.termsText}>
              Truck Type: {quote.truckType.replace(/_/g, ' ')}
            </Text>
          )}
        </View>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={[styles.signatureBox, styles.signatureBoxSpacer]}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Customer Signature</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Authorized Representative</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
