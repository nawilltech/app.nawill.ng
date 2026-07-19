import { Document, Font, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { NAWILL_COMPANY, NAWILL_PAYMENT_DETAILS, PDF_COLORS } from './nawill-brand';

// Self-hosted from /public/fonts (downloaded from the same Google Fonts families used
// on the web app — see docs/ARCHITECTURE.md §8.6) rather than fetched from Google at
// render time, so PDF generation doesn't depend on an external font CDN being up.
// IBM Plex Sans ships only as a variable font upstream; fontkit (react-pdf's font
// engine) resolves each registered `fontWeight` to the matching named instance from
// the same file.
Font.register({
  family: 'IBM Plex Sans',
  fonts: [
    { src: '/fonts/IBMPlexSans-Variable.ttf', fontWeight: 400 },
    { src: '/fonts/IBMPlexSans-Variable.ttf', fontWeight: 700 },
  ],
});
Font.register({
  family: 'IBM Plex Mono',
  fonts: [
    { src: '/fonts/IBMPlexMono-Regular.ttf', fontWeight: 400 },
    { src: '/fonts/IBMPlexMono-Medium.ttf', fontWeight: 500 },
    { src: '/fonts/IBMPlexMono-Bold.ttf', fontWeight: 700 },
  ],
});
Font.register({ family: 'Special Elite', src: '/fonts/SpecialElite-Regular.ttf' });

export interface InvoicePdfItem {
  id: string;
  itemName: string;
  period: string | null;
  quantity: number;
  unitAmountMinor: string;
  actualAmountMinor: string;
  isCancelled: boolean;
}

export interface InvoicePdfData {
  invoiceNo: string;
  currency: string;
  subtotalMinor: string;
  discountMinor: string;
  vatEnabled: boolean;
  vatRate: number | null;
  taxMinor: string;
  totalMinor: string;
  invoiceStatus: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  notes: string | null;
  organization: { name: string; headOffice: string } | null;
  items: InvoicePdfItem[];
}

function formatMinor(minor: string, currency: string): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(Number(minor) / 100);
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

const styles = StyleSheet.create({
  page: { fontSize: 10, fontFamily: 'IBM Plex Sans', color: '#1f2937' },
  header: { backgroundColor: PDF_COLORS.navy, color: '#ffffff', paddingHorizontal: 40, paddingVertical: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  companyName: { fontSize: 20, fontFamily: 'Special Elite' },
  invoiceLabel: { fontSize: 14, fontFamily: 'IBM Plex Mono', fontWeight: 700, letterSpacing: 2 },
  headerContact: { marginTop: 8, fontSize: 8.5, fontFamily: 'IBM Plex Mono', color: PDF_COLORS.lavender, lineHeight: 1.6 },
  body: { paddingHorizontal: 40, paddingTop: 24, paddingBottom: 40 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  label: { fontSize: 8, fontFamily: 'IBM Plex Mono', fontWeight: 700, color: PDF_COLORS.gold, letterSpacing: 1 },
  billToName: { fontSize: 12, fontFamily: 'IBM Plex Sans', fontWeight: 700, marginTop: 3, marginBottom: 2 },
  metaValueRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginBottom: 2 },
  metaValue: { fontSize: 10, fontFamily: 'IBM Plex Mono', textAlign: 'right' },
  table: { marginTop: 8, borderRadius: 2, overflow: 'hidden' },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: PDF_COLORS.accent,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableHeaderCell: { color: '#ffffff', fontSize: 8, fontFamily: 'IBM Plex Mono', fontWeight: 700, letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 10 },
  tableRowAlt: { backgroundColor: PDF_COLORS.rowAlt },
  colDescription: { flex: 3 },
  colPeriod: { flex: 2, textAlign: 'right', fontFamily: 'IBM Plex Mono', fontSize: 9, color: PDF_COLORS.textMuted },
  colAmount: { flex: 2, textAlign: 'right', fontFamily: 'IBM Plex Sans', fontWeight: 700 },
  strike: { textDecoration: 'line-through', color: PDF_COLORS.textMuted, fontFamily: 'IBM Plex Sans', fontWeight: 400 },
  totalsBlock: { marginTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  stamp: {
    borderWidth: 2,
    borderColor: PDF_COLORS.green,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    transform: 'rotate(-10deg)',
  },
  stampText: { color: PDF_COLORS.green, fontFamily: 'Special Elite', fontSize: 13 },
  totalsRows: { minWidth: 220 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  totalsLabel: { fontSize: 10, fontFamily: 'IBM Plex Mono', color: PDF_COLORS.textMuted },
  totalsValue: { fontSize: 10, fontFamily: 'IBM Plex Sans', fontWeight: 400 },
  balanceBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  balanceLabel: { color: '#ffffff', fontFamily: 'IBM Plex Mono', fontWeight: 700, fontSize: 11 },
  balanceValue: { color: '#ffffff', fontFamily: 'IBM Plex Sans', fontWeight: 700, fontSize: 11 },
  section: { marginTop: 20 },
  sectionText: { fontSize: 9, fontFamily: 'IBM Plex Mono', marginTop: 2, color: '#374151' },
  footer: {
    marginTop: 32,
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.border,
    paddingTop: 10,
    textAlign: 'center',
  },
  footerText: { fontSize: 9, fontFamily: 'IBM Plex Mono', color: PDF_COLORS.textMuted },
});

export function InvoiceDocument({ invoice }: { invoice: InvoicePdfData }) {
  const isPaid = invoice.invoiceStatus === 'paid';
  const amountPaidMinor = isPaid ? invoice.totalMinor : '0';
  const balanceDueMinor = String(BigInt(invoice.totalMinor) - BigInt(amountPaidMinor));
  const hasCancelledItems = invoice.items.some((i) => i.isCancelled);
  const originalSubtotalMinor = invoice.items.reduce(
    (sum, i) => sum + BigInt(i.quantity) * BigInt(i.unitAmountMinor),
    BigInt(0),
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.companyName}>{NAWILL_COMPANY.name}</Text>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
          </View>
          <Text style={styles.headerContact}>{NAWILL_COMPANY.address}</Text>
          <Text style={styles.headerContact}>
            {NAWILL_COMPANY.email} | {NAWILL_COMPANY.phone} | {NAWILL_COMPANY.website}
          </Text>
        </View>

        <View style={styles.body}>
          <View style={styles.metaRow}>
            <View>
              <Text style={styles.label}>BILL TO</Text>
              <Text style={styles.billToName}>{invoice.organization?.name ?? '—'}</Text>
              {invoice.organization?.headOffice ? (
                <Text style={styles.sectionText}>{invoice.organization.headOffice}</Text>
              ) : null}
            </View>
            <View>
              <View style={styles.metaValueRow}>
                <Text style={styles.label}>INVOICE NO.</Text>
                <Text style={styles.metaValue}>{invoice.invoiceNo}</Text>
              </View>
              <View style={styles.metaValueRow}>
                <Text style={styles.label}>INVOICE DATE</Text>
                <Text style={styles.metaValue}>{formatDate(invoice.createdAt)}</Text>
              </View>
              <View style={styles.metaValueRow}>
                <Text style={styles.label}>LAST UPDATED</Text>
                <Text style={styles.metaValue}>{formatDate(invoice.updatedAt)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, styles.colDescription]}>DESCRIPTION</Text>
              <Text style={[styles.tableHeaderCell, styles.colPeriod]}>PERIOD</Text>
              <Text style={[styles.tableHeaderCell, styles.colAmount]}>{`AMOUNT (${invoice.currency})`}</Text>
            </View>
            {invoice.items.map((item, index) => (
              <View key={item.id} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={styles.colDescription}>{item.itemName}</Text>
                <Text style={styles.colPeriod}>{item.isCancelled ? 'Cancelled' : item.period ?? '—'}</Text>
                <View style={[styles.colAmount, { flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }]}>
                  {item.isCancelled && (
                    <Text style={styles.strike}>
                      {formatMinor(String(BigInt(item.quantity) * BigInt(item.unitAmountMinor)), invoice.currency)}
                    </Text>
                  )}
                  <Text>{formatMinor(item.actualAmountMinor, invoice.currency)}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.totalsBlock}>
            {isPaid ? (
              <View style={styles.stamp}>
                <Text style={styles.stampText}>PAID IN FULL</Text>
              </View>
            ) : (
              <View />
            )}

            <View style={styles.totalsRows}>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Subtotal</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {hasCancelledItems && (
                    <Text style={[styles.totalsValue, styles.strike]}>
                      {formatMinor(String(originalSubtotalMinor), invoice.currency)}
                    </Text>
                  )}
                  <Text style={styles.totalsValue}>{formatMinor(invoice.subtotalMinor, invoice.currency)}</Text>
                </View>
              </View>
              {Number(invoice.discountMinor) > 0 && (
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>Discount</Text>
                  <Text style={styles.totalsValue}>−{formatMinor(invoice.discountMinor, invoice.currency)}</Text>
                </View>
              )}
              {invoice.vatEnabled && (
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>{`VAT (${invoice.vatRate ?? 0}%)`}</Text>
                  <Text style={styles.totalsValue}>{formatMinor(invoice.taxMinor, invoice.currency)}</Text>
                </View>
              )}
              <View style={styles.totalsRow}>
                <Text style={[styles.totalsLabel, { fontFamily: 'IBM Plex Sans', fontWeight: 700, color: '#1f2937' }]}>Total</Text>
                <Text style={[styles.totalsValue, { fontWeight: 700 }]}>{formatMinor(invoice.totalMinor, invoice.currency)}</Text>
              </View>
              {isPaid && (
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>Amount Paid</Text>
                  <Text style={styles.totalsValue}>({formatMinor(amountPaidMinor, invoice.currency)})</Text>
                </View>
              )}
              <View style={[styles.balanceBar, { backgroundColor: isPaid ? PDF_COLORS.green : PDF_COLORS.red }]}>
                <Text style={styles.balanceLabel}>BALANCE DUE</Text>
                <Text style={styles.balanceValue}>{formatMinor(balanceDueMinor, invoice.currency)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>PAYMENT DETAILS</Text>
            <Text style={styles.sectionText}>Bank: {NAWILL_PAYMENT_DETAILS.bank}</Text>
            <Text style={styles.sectionText}>Account Name: {NAWILL_PAYMENT_DETAILS.accountName}</Text>
            <Text style={styles.sectionText}>Account Number: {NAWILL_PAYMENT_DETAILS.accountNumber}</Text>
          </View>

          {invoice.notes && (
            <View style={styles.section}>
              <Text style={styles.label}>NOTES</Text>
              <Text style={styles.sectionText}>{invoice.notes}</Text>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Thank you for your business!</Text>
            <Text style={styles.footerText}>
              {NAWILL_COMPANY.name} | {NAWILL_COMPANY.email} | {NAWILL_COMPANY.phone} | {NAWILL_COMPANY.website}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
