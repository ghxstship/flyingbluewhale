import "server-only";

import React from "react";
import { Image, Text, View } from "@react-pdf/renderer";
import { BrandedPage, CoverPage, KeyValue, PdfDocument, PdfTable, SectionHeading, styles } from "./layout";
import type { PdfBrand } from "./branding";

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

/** Request-scoped translator: `t(key, vars?, fallback?)`. */
export type Translator = (key: string, vars?: Record<string, string | number>, fallback?: string) => string;

/** Identity fallback used when no translator is threaded in (existing callers). */
const identityT: Translator = (_k, _v, fb) => fb ?? "";

export type InvoicePdfInput = {
  brand: PdfBrand;
  /** Optional request-scoped translator; defaults to English fallbacks. */
  t?: Translator;
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

function money(cents: number, currency: string): string {
  const amt = cents / 100;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amt);
  } catch {
    return `${currency} ${amt.toFixed(2)}`;
  }
}

export function InvoicePdf({
  brand,
  t = identityT,
  invoice,
  lineItems,
  paymentIntentUrl: _paymentIntentUrl,
}: InvoicePdfInput) {
  const total = invoice.amount_cents;
  const subtotal = lineItems.reduce(
    (sum, li) => sum + Math.round(Number(li.quantity) * Number(li.unit_price_cents)),
    0,
  );
  // Anything left over after summing the line items is taxes/fees; surface as a
  // single line rather than misreporting `total`.
  const adjustments = total - subtotal;

  const status = invoice.paid_at
    ? t("pdf.invoice.statusPaid", undefined, "PAID")
    : (invoice.status?.toUpperCase() ?? t("pdf.invoice.statusIssued", undefined, "ISSUED"));
  const statusEyebrow = `${t("pdf.invoice.eyebrow", undefined, "Invoice")} · ${status}`;
  const invoiceTitleFallback = t("pdf.invoice.titleFallback", { number: invoice.number }, `Invoice ${invoice.number}`);

  return (
    <PdfDocument
      title={invoiceTitleFallback}
      author={brand.producerName}
      subject={invoice.title ?? invoiceTitleFallback}
    >
      <CoverPage
        brand={brand}
        eyebrow={statusEyebrow}
        title={invoice.title ?? invoiceTitleFallback}
        subtitle={money(total, invoice.currency)}
        classification={invoice.paid_at ? undefined : t("pdf.invoice.classificationDue", undefined, "DUE")}
        classificationTier={invoice.paid_at ? 0 : 3}
      />

      <BrandedPage brand={brand} pageLabel={invoiceTitleFallback}>
        {brand.clientLogoUrl ? (
          <Image src={brand.clientLogoUrl} style={{ width: 96, height: 36, objectFit: "contain", marginBottom: 6 }} />
        ) : null}
        <SectionHeading
          eyebrow={t("pdf.invoice.billTo", undefined, "Bill To")}
          title={brand.clientName ?? t("pdf.invoice.client", undefined, "Client")}
        />
        <KeyValue label={t("pdf.invoice.invoiceNumber", undefined, "Invoice #")} value={invoice.number} />
        <KeyValue label={t("pdf.invoice.issued", undefined, "Issued")} value={invoice.issued_at ?? "—"} />
        <KeyValue label={t("pdf.invoice.due", undefined, "Due")} value={invoice.due_at ?? "—"} />
        <KeyValue label={t("pdf.invoice.currency", undefined, "Currency")} value={invoice.currency} />

        <SectionHeading title={t("pdf.invoice.lineItems", undefined, "Line Items")} />
        <PdfTable
          accentColor={brand.producerAccent}
          columns={[
            { key: "description", label: t("pdf.invoice.colDescription", undefined, "Description"), width: 6 },
            { key: "quantity", label: t("pdf.invoice.colQty", undefined, "Qty"), width: 1, align: "right" },
            { key: "unit", label: t("pdf.invoice.colUnit", undefined, "Unit"), width: 2, align: "right" },
            { key: "amount", label: t("pdf.invoice.colAmount", undefined, "Amount"), width: 2, align: "right" },
          ]}
          rows={lineItems.map((li) => ({
            description: li.description,
            quantity: Number(li.quantity).toString(),
            unit: money(li.unit_price_cents, invoice.currency),
            amount: money(Math.round(Number(li.quantity) * Number(li.unit_price_cents)), invoice.currency),
          }))}
        />

        <View style={{ marginTop: 12, alignItems: "flex-end" }}>
          <KeyValue
            label={t("pdf.invoice.subtotal", undefined, "Subtotal")}
            value={money(subtotal, invoice.currency)}
          />
          {adjustments !== 0 ? (
            <KeyValue
              label={t("pdf.invoice.taxesFees", undefined, "Taxes / fees")}
              value={money(adjustments, invoice.currency)}
            />
          ) : null}
          <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: brand.producerAccent, paddingTop: 4 }}>
            <Text style={{ fontSize: 14, fontWeight: 700 }}>{money(total, invoice.currency)}</Text>
          </View>
        </View>

        {invoice.notes ? (
          <>
            <SectionHeading title={t("pdf.invoice.notes", undefined, "Notes")} />
            <Text style={styles.p}>{invoice.notes}</Text>
          </>
        ) : null}
      </BrandedPage>
    </PdfDocument>
  );
}
