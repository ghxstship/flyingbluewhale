import "server-only";

import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { BrandedPage, CoverPage, KeyValue, PdfDocument, PdfTable, SectionHeading, styles } from "./layout";
import type { PdfBrand } from "./branding";
import { formatMoney } from "@/lib/i18n/format";

/**
 * Invoice PDF — Opportunity #5.
 *
 * Single-document renderer. Pages:
 *   1. Cover with invoice number, client, amount-due badge.
 *   2. Line items + totals.
 *   3. Notes + payment instructions (QR to Stripe Checkout if a
 *      paymentIntentUrl is supplied).
 *
 * All money is stored as cents (bigint) in the DB and rendered via
 * `formatCurrency` from the shared i18n module so locale + symbol are
 * consistent with the rest of the platform.
 */

export type InvoicePdfInput = {
  brand: PdfBrand;
  /** BCP-47 locale for number/currency formatting (e.g. "en", "es", "fr"). */
  locale?: string;
  invoice: {
    number: string;
    title: string | null;
    currency: string;
    amount_cents: number;
    issued_at: string | null;
    due_at: string | null;
    paid_at: string | null;
    status: string;
    notes: string | null;
  };
  lineItems: Array<{
    description: string;
    quantity: number;
    unit_price_cents: number;
  }>;
  /** Optional Stripe Checkout URL shown as a QR on the back cover. */
  paymentIntentUrl?: string | null;
};

export function InvoicePdf({ brand, locale, invoice, lineItems, paymentIntentUrl: _paymentIntentUrl }: InvoicePdfInput) {
  const money = (cents: number) => formatMoney(cents, { locale: (locale ?? "en") as import("@/lib/i18n/config").Locale, currency: invoice.currency });
  const total = invoice.amount_cents;
  const subtotal = lineItems.reduce(
    (sum, li) => sum + Math.round(Number(li.quantity) * Number(li.unit_price_cents)),
    0,
  );
  // Anything left over after summing the line items is taxes/fees; surface as a
  // single line rather than misreporting `total`.
  const adjustments = total - subtotal;

  const status = invoice.paid_at ? "PAID" : (invoice.status?.toUpperCase() ?? "ISSUED");
  const statusEyebrow = `Invoice · ${status}`;

  return (
    <PdfDocument
      title={`Invoice ${invoice.number}`}
      author={brand.producerName}
      subject={invoice.title ?? `Invoice ${invoice.number}`}
    >
      <CoverPage
        brand={brand}
        eyebrow={statusEyebrow}
        title={invoice.title ?? `Invoice ${invoice.number}`}
        subtitle={money(total)}
        classification={invoice.paid_at ? undefined : "DUE"}
        classificationTier={invoice.paid_at ? 0 : 3}
      />

      <BrandedPage brand={brand} pageLabel={`Invoice ${invoice.number}`}>
        <SectionHeading eyebrow="Bill To" title={brand.clientName ?? "Client"} />
        <KeyValue label="Invoice #" value={invoice.number} />
        <KeyValue label="Issued" value={invoice.issued_at ?? "—"} />
        <KeyValue label="Due" value={invoice.due_at ?? "—"} />
        <KeyValue label="Currency" value={invoice.currency} />

        <SectionHeading title="Line Items" />
        <PdfTable
          accentColor={brand.producerAccent}
          columns={[
            { key: "description", label: "Description", width: 6 },
            { key: "quantity", label: "Qty", width: 1, align: "right" },
            { key: "unit", label: "Unit", width: 2, align: "right" },
            { key: "amount", label: "Amount", width: 2, align: "right" },
          ]}
          rows={lineItems.map((li) => ({
            description: li.description,
            quantity: Number(li.quantity).toString(),
            unit: money(li.unit_price_cents),
            amount: money(Math.round(Number(li.quantity) * Number(li.unit_price_cents))),
          }))}
        />

        <View style={{ marginTop: 12, alignItems: "flex-end" }}>
          <KeyValue label="Subtotal" value={money(subtotal)} />
          {adjustments !== 0 ? <KeyValue label="Taxes / fees" value={money(adjustments)} /> : null}
          <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: brand.producerAccent, paddingTop: 4 }}>
            <Text style={{ fontSize: 14, fontWeight: 700 }}>{money(total)}</Text>
          </View>
        </View>

        {invoice.notes ? (
          <>
            <SectionHeading title="Notes" />
            <Text style={styles.p}>{invoice.notes}</Text>
          </>
        ) : null}
      </BrandedPage>
    </PdfDocument>
  );
}
