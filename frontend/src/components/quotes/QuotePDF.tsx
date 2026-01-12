import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';
import {
  CheckCircle2Icon,
  ClockIcon,
} from '@lib/pdf-icons';
import type { Quote } from '@services/sales/quotes';

// Clean, simple PDF stylesheet
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
    fontSize: 11,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  logoContainer: {
    width: 150,
  },
  logo: {
    maxWidth: 120,
    maxHeight: 40,
    objectFit: 'contain',
  },
  headerCompanyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  quoteLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  quoteNumber: {
    fontSize: 24,
    fontWeight: 'normal',
    color: '#000000',
    marginBottom: 4,
  },
  quoteDate: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#E8F5E9',
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#2E7D32',
    textTransform: 'uppercase',
  },
  // Two Column Layout
  twoColumn: {
    flexDirection: 'row',
    marginBottom: 25,
    gap: 30,
  },
  column: {
    flex: 1,
  },
  // Section
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  sectionContent: {
    marginBottom: 20,
  },
  // Company/Customer Info
  companyName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  companyLegalName: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 10,
    color: '#666666',
    width: 80,
    flexShrink: 0,
  },
  infoValue: {
    fontSize: 10,
    color: '#000000',
    flex: 1,
  },
  // Project Section
  projectSection: {
    marginBottom: 25,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  projectRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  // Table
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    marginBottom: 8,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000000',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tableCell: {
    fontSize: 10,
    color: '#000000',
  },
  tableCellRight: {
    textAlign: 'right',
    fontFamily: 'Courier',
  },
  // Totals
  totalsContainer: {
    alignItems: 'flex-end',
    marginTop: 20,
    marginLeft: 'auto',
    width: 280,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    width: '100%',
  },
  totalsLabel: {
    fontSize: 10,
    color: '#666666',
    marginRight: 20,
  },
  totalsValue: {
    fontSize: 10,
    color: '#000000',
    fontFamily: 'Courier',
    minWidth: 100,
    textAlign: 'right',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 2,
    borderTopColor: '#000000',
    marginTop: 8,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'Courier',
    minWidth: 100,
    textAlign: 'right',
  },
  // Terms
  termsSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  termsTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  termsText: {
    fontSize: 9,
    color: '#666666',
    lineHeight: 1.5,
    marginBottom: 6,
  },
  // Signature
  signatureSection: {
    flexDirection: 'row',
    marginTop: 40,
    paddingTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 40,
  },
  signatureBox: {
    flex: 1,
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#000000',
    marginTop: 50,
    marginBottom: 8,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#666666',
  },
});

interface QuotePDFProps {
  quote: Quote;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatNumber = (num: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

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
  const subtotal = Number(quote.subtotal);
  const discountAmount = subtotal * (Number(quote.discountPercentage) / 100);
  const subtotalAfterDiscount = subtotal - discountAmount;
  const vatRate = 0.16;
  const vatAmount = subtotalAfterDiscount * vatRate;
  const transportTotal = Number(quote.transportTotal) || 0;
  
  const totalTons = quote.items?.reduce((sum, item) => {
    return sum + Number(item.qty);
  }, 0) || 0;
  const transportCostPerTon = totalTons > 0 ? transportTotal / totalTons : 0;
  
  const grandTotal = subtotalAfterDiscount + vatAmount + transportTotal;
  
  const customerName = quote.customer?.companyName || 
    `${quote.customer?.firstName || ''} ${quote.customer?.lastName || ''}`.trim() || 'N/A';

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
              <Text style={styles.headerCompanyName}>{quote.company.name}</Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.quoteLabel}>QUOTE</Text>
            <Text style={styles.quoteNumber}>#{quote.quoteNumber}</Text>
            <Text style={styles.quoteDate}>{quoteDate}</Text>
            <View style={styles.statusBadge}>
              {quote.status === 'APPROVED' && (
                <View style={{ marginRight: 4 }}>
                  <CheckCircle2Icon size={10} />
                </View>
              )}
              {quote.status === 'PENDING_APPROVAL' && (
                <View style={{ marginRight: 4 }}>
                  <ClockIcon size={10} />
                </View>
              )}
              <Text style={styles.statusText}>{statusDisplay}</Text>
            </View>
          </View>
        </View>

        {/* FROM / TO */}
        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>FROM</Text>
            <View style={styles.sectionContent}>
              <Text style={styles.companyName}>{quote.company?.name || 'N/A'}</Text>
              {quote.company?.legalName && (
                <Text style={styles.companyLegalName}>{quote.company.legalName}</Text>
              )}
              {quote.company?.nif && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>NIF:</Text>
                  <Text style={styles.infoValue}>{quote.company.nif}</Text>
                </View>
              )}
              {quote.company?.rccm && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>RCCM:</Text>
                  <Text style={styles.infoValue}>{quote.company.rccm}</Text>
                </View>
              )}
              {quote.company?.idNational && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>ID National:</Text>
                  <Text style={styles.infoValue}>{quote.company.idNational}</Text>
                </View>
              )}
              {quote.company?.vat && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>VAT:</Text>
                  <Text style={styles.infoValue}>{quote.company.vat}</Text>
                </View>
              )}
              {quote.company?.addressLine1 && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Address:</Text>
                  <Text style={styles.infoValue}>
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
                  <Text style={styles.infoLabel}>Phone:</Text>
                  <Text style={styles.infoValue}>{quote.company.phone}</Text>
                </View>
              )}
              {quote.company?.email && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Email:</Text>
                  <Text style={styles.infoValue}>{quote.company.email}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.column}>
            <Text style={styles.sectionTitle}>TO</Text>
            <View style={styles.sectionContent}>
              <Text style={styles.companyName}>{customerName}</Text>
              {quote.contact && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Contact:</Text>
                  <Text style={styles.infoValue}>{quote.contact.name}</Text>
                </View>
              )}
              {quote.deliveryMethod === 'DELIVERED' && quote.deliveryAddressLine1 && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Delivery:</Text>
                  <Text style={styles.infoValue}>
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

        {/* Project */}
        {quote.project && (
          <View style={styles.projectSection}>
            <View style={styles.projectRow}>
              <Text style={styles.infoLabel}>Project:</Text>
              <Text style={styles.infoValue}>{quote.project.name}</Text>
            </View>
            {quote.deliveryMethod === 'DELIVERED' && quote.deliveryAddressLine1 && (
              <View style={styles.projectRow}>
                <Text style={styles.infoLabel}>Delivery:</Text>
                <Text style={styles.infoValue}>
                  {quote.deliveryAddressLine1}
                  {quote.deliveryCity && `, ${quote.deliveryCity}`}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Line Items */}
        <Text style={styles.sectionTitle}>LINE ITEMS</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: '45%' }]}>Description</Text>
            <Text style={[styles.tableHeaderCell, { width: '15%', textAlign: 'right' }]}>Quantity</Text>
            <Text style={[styles.tableHeaderCell, { width: '20%', textAlign: 'right' }]}>Unit Price</Text>
            <Text style={[styles.tableHeaderCell, { width: '20%', textAlign: 'right' }]}>Amount</Text>
          </View>
          {quote.items?.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '45%' }]}>{item.nameSnapshot}</Text>
              <Text style={[styles.tableCell, styles.tableCellRight, { width: '15%' }]}>
                {formatNumber(Number(item.qty), 2)} {item.uomSnapshot}
              </Text>
              <Text style={[styles.tableCell, styles.tableCellRight, { width: '20%' }]}>
                {formatCurrency(Number(item.unitPrice))}
              </Text>
              <Text style={[styles.tableCell, styles.tableCellRight, { width: '20%', fontWeight: 'bold' }]}>
                {formatCurrency(Number(item.lineTotal))}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsContainer}>
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

        {/* Terms */}
        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>TERMS & CONDITIONS</Text>
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

        {/* Signature */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
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
