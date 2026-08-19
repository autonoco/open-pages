// @react-pdf/renderer implementation of the benchmark invoice.
// Idiomatic: hand-rolled flex table, fixed footer with render prop, wrap pagination.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Document, Font, Page, renderToBuffer, StyleSheet, Text, View } from '@react-pdf/renderer';
import { BILL_TO, COMPANY, META, money, totals } from './data.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const interDir = path.join(here, 'node_modules/@fontsource/inter/files');

Font.register({
  family: 'Inter',
  fonts: [
    { src: path.join(interDir, 'inter-latin-400-normal.woff'), fontWeight: 400 },
    { src: path.join(interDir, 'inter-latin-700-normal.woff'), fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingHorizontal: 40,
    paddingBottom: 56,
    fontSize: 9,
    fontFamily: 'Inter',
    color: '#1a202c',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  companyName: { fontSize: 16, fontWeight: 700 },
  muted: { color: '#64748b' },
  logoBox: {
    width: 54,
    height: 54,
    borderWidth: 1,
    borderColor: '#94a3b8',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  h2: { fontSize: 10, fontWeight: 700, marginBottom: 4, color: '#334155' },
  invoiceTitle: { fontSize: 20, fontWeight: 700, marginBottom: 6 },

  // ---- table ----
  table: { borderWidth: 1, borderColor: '#cbd5e1' },
  thead: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    fontWeight: 700,
  },
  tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' },
  colSku: { flex: 1.4, padding: 6 },
  colDesc: { flex: 5, padding: 6 },
  colQty: { flex: 1, padding: 6, textAlign: 'right' },
  colUnit: { flex: 1.8, padding: 6, textAlign: 'right' },
  colAmount: { flex: 1.8, padding: 6, textAlign: 'right' },
  detail: { color: '#64748b', fontSize: 8, marginTop: 2 },

  totalsWrap: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14 },
  totalsBox: { width: 220 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  grandTotal: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    marginTop: 3,
    paddingTop: 5,
    fontWeight: 700,
    fontSize: 11,
  },
  terms: { marginTop: 20, color: '#475569' },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
  },
});

function LineItemsTable({ items }) {
  return (
    <View style={styles.table}>
      <View style={styles.thead}>
        <Text style={styles.colSku}>SKU</Text>
        <Text style={styles.colDesc}>Description</Text>
        <Text style={styles.colQty}>Qty</Text>
        <Text style={styles.colUnit}>Unit Price</Text>
        <Text style={styles.colAmount}>Amount</Text>
      </View>
      {items.map((it, i) => (
        <View style={styles.tr} key={i} wrap={false}>
          <Text style={styles.colSku}>{it.sku}</Text>
          <View style={styles.colDesc}>
            <Text>{it.name}</Text>
            <Text style={styles.detail}>{it.detail}</Text>
          </View>
          <Text style={styles.colQty}>{it.qty}</Text>
          <Text style={styles.colUnit}>{money(it.unit)}</Text>
          <Text style={styles.colAmount}>{money(it.qty * it.unit)}</Text>
        </View>
      ))}
    </View>
  );
}

function Invoice({ items }) {
  const t = totals(items);
  return (
    <Document title={`Invoice ${META.number}`} author={COMPANY.name}>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.companyName}>{COMPANY.name}</Text>
            <Text style={styles.muted}>{COMPANY.addr1}</Text>
            <Text style={styles.muted}>{COMPANY.addr2}</Text>
            <Text style={styles.muted}>{COMPANY.email}</Text>
          </View>
          <View style={styles.logoBox}>
            <Text style={styles.muted}>LOGO</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View>
            <Text style={styles.h2}>BILL TO</Text>
            <Text>{BILL_TO.name}</Text>
            <Text>{BILL_TO.contact}</Text>
            <Text>{BILL_TO.addr1}</Text>
            <Text>{BILL_TO.addr2}</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text>Invoice #: {META.number}</Text>
            <Text>Date: {META.date}</Text>
            <Text>Due: {META.due}</Text>
            <Text>Terms: {META.terms}</Text>
          </View>
        </View>

        <LineItemsTable items={items} />

        <View style={styles.totalsWrap} wrap={false}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text>Subtotal</Text>
              <Text>{money(t.subtotal)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text>Sales Tax (7%)</Text>
              <Text>{money(t.tax)}</Text>
            </View>
            <View style={[styles.totalsRow, styles.grandTotal]}>
              <Text>Total Due</Text>
              <Text>{money(t.total)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.terms}>
          Payment is due within 30 days of the invoice date. Please reference the invoice number on
          all remittances. ACH details available on request. A 1.5% monthly finance charge applies
          to past-due balances.
        </Text>

        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
        />
      </Page>
    </Document>
  );
}

export async function renderInvoice(items) {
  const buf = await renderToBuffer(<Invoice items={items} />);
  return buf;
}
