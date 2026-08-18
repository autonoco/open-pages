// @react-pdf/renderer implementation of the invoice.
// Idiomatic: StyleSheet + hand-rolled flexbox table, fixed footer with render prop.
import React from "react";
import { Document, Page, View, Text, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { LineItem, COMPANY, BILL_TO, money, totals } from "./invoice-data.js";

const styles = StyleSheet.create({
  page: { paddingTop: 40, paddingHorizontal: 40, paddingBottom: 64, fontSize: 10, fontFamily: "Helvetica", color: "#111" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  logoBox: { width: 64, height: 64, borderWidth: 1, borderColor: "#999", borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
  logoText: { fontSize: 8, color: "#999" },
  companyName: { fontSize: 20, fontFamily: "Helvetica-Bold" },
  companyAddr: { fontSize: 9, color: "#555", marginTop: 4 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  billTo: { maxWidth: "55%" },
  sectionLabel: { fontSize: 8, color: "#888", textTransform: "uppercase", marginBottom: 4, fontFamily: "Helvetica-Bold" },
  invoiceMeta: { textAlign: "right" },

  // --- table ---
  table: { borderTopWidth: 1, borderTopColor: "#111" },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#ccc", paddingVertical: 6, alignItems: "flex-start" },
  headRow: { borderBottomWidth: 1, borderBottomColor: "#111", backgroundColor: "#f2f2f2" },
  colDesc: { flex: 6, paddingRight: 8 },
  colQty: { flex: 1.2, textAlign: "right" },
  colUnit: { flex: 2, textAlign: "right" },
  colAmount: { flex: 2, textAlign: "right" },
  headCell: { fontFamily: "Helvetica-Bold", fontSize: 9 },
  itemDetail: { fontSize: 8, color: "#666", marginTop: 2 },

  totalsWrap: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
  totalsBox: { width: 220 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  grandTotal: { borderTopWidth: 1, borderTopColor: "#111", marginTop: 2, paddingTop: 5, fontFamily: "Helvetica-Bold", fontSize: 12 },
  terms: { marginTop: 24, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: "#ccc" },
  termsText: { fontSize: 8, color: "#555", lineHeight: 1.5 },

  footer: { position: "absolute", bottom: 24, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: "#888", borderTopWidth: 0.5, borderTopColor: "#ccc", paddingTop: 6 },
});

function Invoice({ items }: { items: LineItem[] }) {
  const t = totals(items);
  return (
    <Document title={`Invoice ${COMPANY.invoiceNo}`} author={COMPANY.name}>
      <Page size="A4" style={styles.page}>
        {/* Header: company name + logo placeholder */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{COMPANY.name}</Text>
            <Text style={styles.companyAddr}>{COMPANY.address}</Text>
          </View>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>LOGO</Text>
          </View>
        </View>

        {/* Bill-to + invoice meta */}
        <View style={styles.metaRow}>
          <View style={styles.billTo}>
            <Text style={styles.sectionLabel}>Bill To</Text>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>{BILL_TO.name}</Text>
            <Text>{BILL_TO.contact}</Text>
            <Text>{BILL_TO.address1}</Text>
            <Text>{BILL_TO.address2}</Text>
            <Text>{BILL_TO.email}</Text>
          </View>
          <View style={styles.invoiceMeta}>
            <Text style={styles.sectionLabel}>Invoice</Text>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>{COMPANY.invoiceNo}</Text>
            <Text>Date: {COMPANY.date}</Text>
            <Text>Due: {COMPANY.due}</Text>
          </View>
        </View>

        {/* Line-item table: hand-rolled flex rows */}
        <View style={styles.table}>
          <View style={[styles.row, styles.headRow]}>
            <Text style={[styles.colDesc, styles.headCell]}>Description</Text>
            <Text style={[styles.colQty, styles.headCell]}>Qty</Text>
            <Text style={[styles.colUnit, styles.headCell]}>Unit Price</Text>
            <Text style={[styles.colAmount, styles.headCell]}>Amount</Text>
          </View>
          {items.map((it) => (
            <View style={styles.row} key={it.sku} wrap={false}>
              <View style={styles.colDesc}>
                <Text>{it.description}</Text>
                <Text style={styles.itemDetail}>{it.sku} — {it.detail}</Text>
              </View>
              <Text style={styles.colQty}>{it.qty}</Text>
              <Text style={styles.colUnit}>{money(it.unitPrice)}</Text>
              <Text style={styles.colAmount}>{money(it.qty * it.unitPrice)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsWrap} wrap={false}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text>Subtotal</Text>
              <Text>{money(t.subtotal)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text>Tax (7%)</Text>
              <Text>{money(t.tax)}</Text>
            </View>
            <View style={[styles.totalsRow, styles.grandTotal]}>
              <Text>Total Due</Text>
              <Text>{money(t.total)}</Text>
            </View>
          </View>
        </View>

        {/* Terms */}
        <View style={styles.terms} wrap={false}>
          <Text style={styles.sectionLabel}>Terms &amp; Conditions</Text>
          <Text style={styles.termsText}>
            Payment is due within 30 days of the invoice date. Late payments accrue interest at 1.5% per month.
            Please reference the invoice number on all remittances. Wire details available on request.
            All services are provided under the Master Services Agreement dated January 12, 2026.
          </Text>
        </View>

        {/* Footer with page numbers on every page */}
        <View style={styles.footer} fixed>
          <Text>{COMPANY.name} — {COMPANY.invoiceNo}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export async function renderInvoice(items: LineItem[]): Promise<Buffer> {
  return renderToBuffer(<Invoice items={items} />);
}
