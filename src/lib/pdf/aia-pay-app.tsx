import "server-only";

import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { BrandedPage, CoverPage, KeyValue, PdfDocument, PdfTable, SectionHeading, styles } from "./layout";
import type { PdfBrand } from "./branding";
import { formatDateParts } from "@/lib/i18n/format";

/**
 * AIA G702 (Application + Certificate for Payment) + G703 (Continuation Sheet)
 * PDF generator. Closes G-003 in the construction-PM parity roadmap.
 *
 * This is a faithful re-creation of the AIA forms in our brand language —
 * pixel-accuracy to the official AIA PDF templates is intentionally NOT a
 * goal here. Sureties accept reasonable equivalents as long as the line-item
 * math is correct and the certification block is present. If a particular
 * surety insists on the AIA letterhead, the GC can re-key onto the official
 * AIA form using our values as the source.
 *
 * Two pages:
 *   1. G702 cover — application number, contract sum, change-orders,
 *      completed work, retainage, prior period, this-period due,
 *      architect certification block.
 *   2. G703 continuation — schedule-of-values lines with completed%,
 *      stored materials, retainage, and per-line balance to finish.
 */

/** Request-scoped translator: `t(key, vars?, fallback?)`. */
export type Translator = (key: string, vars?: Record<string, string | number>, fallback?: string) => string;

/** Identity fallback used when no translator is threaded in (existing callers). */
const identityT: Translator = (_k, _v, fb) => fb ?? "";

export type AiaPayAppInput = {
  brand: PdfBrand;
  /** Optional request-scoped translator; defaults to English fallbacks. */
  t?: Translator;
  payApp: {
    application_number: number;
    aia_form_version: "1992" | "2017" | null;
    period_start: string; // ISO date
    period_end: string;
    status: string;
    submitted_at: string | null;
    approved_at: string | null;
    paid_at: string | null;
    architect_certification_at: string | null;
    notes: string | null;
    // Money in cents.
    contract_sum_cents: number;
    change_orders_cents: number;
    revised_contract_sum_cents: number;
    total_completed_cents: number;
    stored_materials_cents: number;
    retention_pct: number;
    total_retention_cents: number;
    total_previously_paid_cents: number;
    total_due_cents: number;
  };
  project: { name: string; address?: string | null };
  vendor: { name: string; address?: string | null } | null;
  purchaseOrder: { number: string | null; title: string | null } | null;
  architectCertifiedBy: { name: string | null; title: string | null } | null;
  lines: Array<{
    item_no: number;
    description: string;
    scheduled_value_cents: number;
    pct_complete_to_date: number;
    pct_complete_this_period: number;
    completed_to_date_cents: number;
    this_period_cents: number;
    stored_materials_cents: number;
    retention_cents: number;
    balance_to_finish_cents: number;
  }>;
};

function money(cents: number, currency: string = "USD"): string {
  const amt = cents / 100;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amt);
  } catch {
    return `${currency} ${amt.toFixed(2)}`;
  }
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  const formatted = formatDateParts(d, { year: "numeric", month: "short", day: "numeric" });
  return formatted === "—" ? d : formatted;
}

function pct(n: number): string {
  return `${Number(n).toFixed(1)}%`;
}

export function AiaPayAppPdf({
  brand,
  t = identityT,
  payApp,
  project,
  vendor,
  purchaseOrder,
  architectCertifiedBy,
  lines,
}: AiaPayAppInput) {
  const formLabel = payApp.aia_form_version === "1992" ? "AIA G702-1992 / G703-1992" : "AIA G702-2017 / G703-2017";
  const title = t(
    "pdf.aiaPayApp.title",
    { number: String(payApp.application_number).padStart(4, "0") },
    `Pay Application #${String(payApp.application_number).padStart(4, "0")}`,
  );

  return (
    <PdfDocument title={title} author={brand.producerName} subject={`${formLabel} — ${project.name}`}>
      {/* ── G702: Cover / Application + Certificate ──────────────────── */}
      <CoverPage
        brand={brand}
        eyebrow={t("pdf.aiaPayApp.eyebrow", undefined, "Application & Certificate for Payment")}
        title={title}
        subtitle={`${project.name} · ${fmtDate(payApp.period_start)} → ${fmtDate(payApp.period_end)}`}
      />

      <BrandedPage
        brand={brand}
        pageLabel={`G702 · ${project.name} · ${t("pdf.aiaPayApp.appAbbrev", { number: payApp.application_number }, `App #${payApp.application_number}`)}`}
      >
        <SectionHeading title={t("pdf.aiaPayApp.projectContract", undefined, "Project & Contract")} />
        <KeyValue label={t("pdf.aiaPayApp.project", undefined, "Project")} value={project.name} />
        {project.address ? (
          <KeyValue label={t("pdf.aiaPayApp.projectAddress", undefined, "Project address")} value={project.address} />
        ) : null}
        {vendor ? (
          <KeyValue label={t("pdf.aiaPayApp.contractorVendor", undefined, "Contractor / Vendor")} value={vendor.name} />
        ) : null}
        {vendor?.address ? (
          <KeyValue label={t("pdf.aiaPayApp.vendorAddress", undefined, "Vendor address")} value={vendor.address} />
        ) : null}
        {purchaseOrder ? (
          <KeyValue
            label={t("pdf.aiaPayApp.contractPo", undefined, "Contract / PO")}
            value={[purchaseOrder.number, purchaseOrder.title].filter(Boolean).join(" — ")}
          />
        ) : null}
        <KeyValue label={t("pdf.aiaPayApp.formVersion", undefined, "Form version")} value={formLabel} />
        <KeyValue
          label={t("pdf.aiaPayApp.applicationPeriod", undefined, "Application period")}
          value={t(
            "pdf.aiaPayApp.periodThrough",
            { start: fmtDate(payApp.period_start), end: fmtDate(payApp.period_end) },
            `${fmtDate(payApp.period_start)} through ${fmtDate(payApp.period_end)}`,
          )}
        />
        <KeyValue label={t("pdf.aiaPayApp.status", undefined, "Status")} value={payApp.status} />

        <SectionHeading title={t("pdf.aiaPayApp.applicationSummary", undefined, "Application Summary")} />
        <PdfTable
          columns={[
            { key: "line", label: t("pdf.aiaPayApp.colLine", undefined, "Line"), width: 0.6 },
            { key: "desc", label: t("pdf.aiaPayApp.colDescription", undefined, "Description"), width: 5 },
            { key: "amt", label: t("pdf.aiaPayApp.colAmount", undefined, "Amount"), width: 2 },
          ]}
          rows={[
            {
              line: "1.",
              desc: t("pdf.aiaPayApp.lineOriginalContractSum", undefined, "Original Contract Sum"),
              amt: money(payApp.contract_sum_cents),
            },
            {
              line: "2.",
              desc: t("pdf.aiaPayApp.lineNetChangeByChangeOrders", undefined, "Net change by Change Orders"),
              amt: money(payApp.change_orders_cents),
            },
            {
              line: "3.",
              desc: t("pdf.aiaPayApp.lineContractSumToDate", undefined, "Contract Sum to Date — Line 1 ± 2"),
              amt: money(payApp.revised_contract_sum_cents),
            },
            {
              line: "4.",
              desc: t("pdf.aiaPayApp.lineTotalCompletedStored", undefined, "Total Completed & Stored to Date"),
              amt: money(payApp.total_completed_cents + payApp.stored_materials_cents),
            },
            {
              line: "5.",
              desc: t(
                "pdf.aiaPayApp.lineRetainage",
                { pct: pct(payApp.retention_pct) },
                `Retainage — ${pct(payApp.retention_pct)}`,
              ),
              amt: money(payApp.total_retention_cents),
            },
            {
              line: "6.",
              desc: t(
                "pdf.aiaPayApp.lineTotalEarnedLessRetainage",
                undefined,
                "Total Earned Less Retainage — Line 4 − 5",
              ),
              amt: money(payApp.total_completed_cents + payApp.stored_materials_cents - payApp.total_retention_cents),
            },
            {
              line: "7.",
              desc: t(
                "pdf.aiaPayApp.lineLessPreviousCertificates",
                undefined,
                "Less Previous Certificates for Payment",
              ),
              amt: money(payApp.total_previously_paid_cents),
            },
            {
              line: "8.",
              desc: t("pdf.aiaPayApp.lineCurrentPaymentDue", undefined, "Current Payment Due — Line 6 − 7"),
              amt: money(payApp.total_due_cents),
            },
            {
              line: "9.",
              desc: t("pdf.aiaPayApp.lineBalanceToFinish", undefined, "Balance to Finish, Including Retainage"),
              amt: money(
                payApp.revised_contract_sum_cents - payApp.total_completed_cents - payApp.stored_materials_cents,
              ),
            },
          ]}
        />

        <SectionHeading title={t("pdf.aiaPayApp.contractorCertification", undefined, "Contractor's Certification")} />
        <Text style={styles.p}>
          {t(
            "pdf.aiaPayApp.contractorCertificationBody",
            undefined,
            "The undersigned Contractor certifies that to the best of the Contractor's knowledge, information, and belief the Work covered by this Application for Payment has been completed in accordance with the Contract Documents, that all amounts have been paid by the Contractor for Work for which previous Certificates for Payment were issued and payments received from the Owner, and that current payment shown herein is now due.",
          )}
        </Text>
        {payApp.submitted_at ? (
          <KeyValue label={t("pdf.aiaPayApp.submitted", undefined, "Submitted")} value={fmtDate(payApp.submitted_at)} />
        ) : null}

        <SectionHeading title={t("pdf.aiaPayApp.architectCertificate", undefined, "Architect's Certificate")} />
        <Text style={styles.p}>
          {t(
            "pdf.aiaPayApp.architectCertificateBody",
            undefined,
            "In accordance with the Contract Documents, based on on-site observations and the data comprising this Application, the Architect certifies to the Owner that to the best of the Architect's knowledge, information, and belief the Work has progressed as indicated, the quality of the Work is in accordance with the Contract Documents, and the Contractor is entitled to payment of the AMOUNT CERTIFIED.",
          )}
        </Text>
        <KeyValue
          label={t("pdf.aiaPayApp.amountCertified", undefined, "Amount Certified")}
          value={money(payApp.total_due_cents)}
        />
        {architectCertifiedBy?.name ? (
          <KeyValue
            label={t("pdf.aiaPayApp.architect", undefined, "Architect")}
            value={[architectCertifiedBy.name, architectCertifiedBy.title].filter(Boolean).join(", ")}
          />
        ) : null}
        {payApp.architect_certification_at ? (
          <KeyValue
            label={t("pdf.aiaPayApp.certified", undefined, "Certified")}
            value={fmtDate(payApp.architect_certification_at)}
          />
        ) : null}

        {payApp.notes ? (
          <>
            <SectionHeading title={t("pdf.aiaPayApp.notes", undefined, "Notes")} />
            <Text style={styles.p}>{payApp.notes}</Text>
          </>
        ) : null}
      </BrandedPage>

      {/* ── G703: Continuation Sheet (Schedule of Values) ─────────────── */}
      <BrandedPage
        brand={brand}
        pageLabel={`G703 · ${project.name} · ${t("pdf.aiaPayApp.appAbbrev", { number: payApp.application_number }, `App #${payApp.application_number}`)}`}
      >
        <SectionHeading
          title={t("pdf.aiaPayApp.scheduleOfValues", undefined, "Schedule of Values — Continuation Sheet")}
        />
        <View style={{ marginBottom: 6 }}>
          <Text style={{ fontSize: 9, color: "#666" }}>
            {t("pdf.aiaPayApp.columnsNote", undefined, "Columns A–I per AIA G703. Amounts in USD.")}
          </Text>
        </View>
        <PdfTable
          columns={[
            { key: "a", label: "A", width: 0.5 },
            { key: "b", label: t("pdf.aiaPayApp.colDescription", undefined, "Description"), width: 3.2 },
            { key: "c", label: `C\n${t("pdf.aiaPayApp.colScheduled", undefined, "Scheduled")}`, width: 1.1 },
            { key: "d", label: `D\n${t("pdf.aiaPayApp.colPrior", undefined, "Prior")}`, width: 1.0 },
            { key: "e", label: `E\n${t("pdf.aiaPayApp.colThisPeriod", undefined, "This Period")}`, width: 1.0 },
            { key: "f", label: `F\n${t("pdf.aiaPayApp.colStored", undefined, "Stored")}`, width: 1.0 },
            { key: "g", label: `G\n${t("pdf.aiaPayApp.colTotalAndPct", undefined, "Total & %")}`, width: 1.2 },
            { key: "h", label: `H\n${t("pdf.aiaPayApp.colBalance", undefined, "Balance")}`, width: 1.0 },
            { key: "i", label: `I\n${t("pdf.aiaPayApp.colRetainage", undefined, "Retainage")}`, width: 1.0 },
          ]}
          rows={lines.map((l) => ({
            a: String(l.item_no),
            b: l.description,
            c: money(l.scheduled_value_cents),
            d: money(l.completed_to_date_cents - l.this_period_cents),
            e: money(l.this_period_cents),
            f: money(l.stored_materials_cents),
            g: `${money(l.completed_to_date_cents + l.stored_materials_cents)}\n${pct(l.pct_complete_to_date)}`,
            h: money(l.balance_to_finish_cents),
            i: money(l.retention_cents),
          }))}
        />

        <View style={{ marginTop: 18, paddingTop: 6, borderTopWidth: 1, borderTopColor: "#0A0A0A" }}>
          <PdfTable
            columns={[
              { key: "label", label: t("pdf.aiaPayApp.totals", undefined, "Totals"), width: 3.7 },
              { key: "c", label: t("pdf.aiaPayApp.colScheduled", undefined, "Scheduled"), width: 1.1 },
              { key: "d", label: t("pdf.aiaPayApp.colPrior", undefined, "Prior"), width: 1.0 },
              { key: "e", label: t("pdf.aiaPayApp.colThisPeriod", undefined, "This Period"), width: 1.0 },
              { key: "f", label: t("pdf.aiaPayApp.colStored", undefined, "Stored"), width: 1.0 },
              { key: "g", label: t("pdf.aiaPayApp.colTotal", undefined, "Total"), width: 1.2 },
              { key: "h", label: t("pdf.aiaPayApp.colBalance", undefined, "Balance"), width: 1.0 },
              { key: "i", label: t("pdf.aiaPayApp.colRetainage", undefined, "Retainage"), width: 1.0 },
            ]}
            rows={[
              {
                label: t("pdf.aiaPayApp.totals", undefined, "Totals"),
                c: money(lines.reduce((s, l) => s + l.scheduled_value_cents, 0)),
                d: money(lines.reduce((s, l) => s + (l.completed_to_date_cents - l.this_period_cents), 0)),
                e: money(lines.reduce((s, l) => s + l.this_period_cents, 0)),
                f: money(lines.reduce((s, l) => s + l.stored_materials_cents, 0)),
                g: money(lines.reduce((s, l) => s + l.completed_to_date_cents + l.stored_materials_cents, 0)),
                h: money(lines.reduce((s, l) => s + l.balance_to_finish_cents, 0)),
                i: money(lines.reduce((s, l) => s + l.retention_cents, 0)),
              },
            ]}
          />
        </View>
      </BrandedPage>
    </PdfDocument>
  );
}
