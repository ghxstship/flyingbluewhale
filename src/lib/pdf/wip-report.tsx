import "server-only";

import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { BrandedPage, CoverPage, KeyValue, PdfDocument, PdfTable, SectionHeading, styles } from "./layout";
import type { PdfBrand } from "./branding";
import { formatDateParts } from "@/lib/i18n/format";

/**
 * WIP (Work-In-Progress) Report PDF — surety / bonding format.
 *
 * One row per project per snapshot_date. Standard surety formatting:
 * Project | Contract | Approved COs | Revised | Cost-to-Date | % Comp |
 * Earned | Billed | Over/Under | EAC | ETC.
 */

/** Request-scoped translator: `t(key, vars?, fallback?)`. */
export type Translator = (key: string, vars?: Record<string, string | number>, fallback?: string) => string;

/** Identity fallback used when no translator is threaded in (existing callers). */
const identityT: Translator = (_k, _v, fb) => fb ?? "";

export type WipReportInput = {
  brand: PdfBrand;
  /** Optional request-scoped translator; defaults to English fallbacks. */
  t?: Translator;
  snapshot_date: string;
  org_name: string;
  rows: Array<{
    project_name: string;
    contract_amount: number;
    approved_change_orders: number;
    revised_contract_amount: number;
    costs_to_date: number;
    percent_complete: number;
    earned_revenue: number;
    billed_to_date: number;
    over_under_billed: number;
    estimated_at_completion: number;
    estimated_cost_to_complete: number;
    bonded: boolean;
    surety_carrier: string | null;
  }>;
};

function money(n: number): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
  } catch {
    return `$${n.toFixed(0)}`;
  }
}

function fmtDate(d: string): string {
  // Date-only strings parse as UTC midnight and format in the UTC default
  // timezone, so the rendered day never shifts.
  const formatted = formatDateParts(d, { year: "numeric", month: "short", day: "numeric" });
  return formatted === "—" ? d : formatted;
}

export function WipReportPdf({ brand, t = identityT, snapshot_date, org_name, rows }: WipReportInput) {
  const sum = rows.reduce(
    (s, r) => ({
      contract: s.contract + r.contract_amount,
      approved: s.approved + r.approved_change_orders,
      revised: s.revised + r.revised_contract_amount,
      ctd: s.ctd + r.costs_to_date,
      earned: s.earned + r.earned_revenue,
      billed: s.billed + r.billed_to_date,
      over_under: s.over_under + r.over_under_billed,
      eac: s.eac + r.estimated_at_completion,
      etc: s.etc + r.estimated_cost_to_complete,
    }),
    { contract: 0, approved: 0, revised: 0, ctd: 0, earned: 0, billed: 0, over_under: 0, eac: 0, etc: 0 },
  );

  const overBilled = rows.filter((r) => r.over_under_billed > 0).length;
  const underBilled = rows.filter((r) => r.over_under_billed < 0).length;
  const bondedCount = rows.filter((r) => r.bonded).length;

  const projectsCount = rows.length;
  const overWord = t("pdf.wipReport.over", undefined, "Over");
  const underWord = t("pdf.wipReport.under", undefined, "Under");
  return (
    <PdfDocument
      title={`${t("pdf.wipReport.titleShort", undefined, "WIP Report")} · ${fmtDate(snapshot_date)}`}
      author={brand.producerName}
      subject={`${t("pdf.wipReport.subjectPrefix", undefined, "Work-In-Progress")} · ${org_name}`}
    >
      <CoverPage
        brand={brand}
        eyebrow={t("pdf.wipReport.eyebrow", undefined, "Work-In-Progress Report")}
        title={t("pdf.wipReport.asOf", { date: fmtDate(snapshot_date) }, `As of ${fmtDate(snapshot_date)}`)}
        subtitle={t(
          "pdf.wipReport.coverSubtitle",
          { count: projectsCount, bonded: bondedCount, over: overBilled, under: underBilled },
          `${projectsCount} active project${projectsCount === 1 ? "" : "s"} · ${bondedCount} bonded · ${overBilled} over-billed · ${underBilled} under-billed`,
        )}
      />

      <BrandedPage brand={brand} pageLabel={`WIP · ${org_name} · ${fmtDate(snapshot_date)}`}>
        <SectionHeading title={t("pdf.wipReport.portfolioSummary", undefined, "Portfolio Summary")} />
        <KeyValue label={t("pdf.wipReport.snapshotDate", undefined, "Snapshot date")} value={fmtDate(snapshot_date)} />
        <KeyValue label={t("pdf.wipReport.activeProjects", undefined, "Active projects")} value={String(rows.length)} />
        <KeyValue
          label={t("pdf.wipReport.aggregateRevisedContract", undefined, "Aggregate revised contract")}
          value={money(sum.revised)}
        />
        <KeyValue
          label={t("pdf.wipReport.aggregateCostsToDate", undefined, "Aggregate costs-to-date")}
          value={money(sum.ctd)}
        />
        <KeyValue label={t("pdf.wipReport.aggregateEarned", undefined, "Aggregate earned")} value={money(sum.earned)} />
        <KeyValue label={t("pdf.wipReport.aggregateBilled", undefined, "Aggregate billed")} value={money(sum.billed)} />
        <KeyValue
          label={t("pdf.wipReport.netOverUnderBilled", undefined, "Net over/under-billed")}
          value={`${sum.over_under > 0 ? `${overWord} ` : `${underWord} `}${money(Math.abs(sum.over_under))}`}
        />
        <KeyValue label={t("pdf.wipReport.aggregateEac", undefined, "Aggregate EAC")} value={money(sum.eac)} />

        <SectionHeading title={t("pdf.wipReport.projects", undefined, "Projects")} />
        <View style={{ marginBottom: 6 }}>
          <Text style={{ fontSize: 8, color: "#666" }}>
            {t(
              "pdf.wipReport.tableNote",
              undefined,
              "All amounts in USD. % Comp is by cost. Over/Under = Earned − Billed (positive = over-billed).",
            )}
          </Text>
        </View>
        <PdfTable
          columns={[
            { key: "project", label: t("pdf.wipReport.colProject", undefined, "Project"), width: 2.5 },
            { key: "rev", label: t("pdf.wipReport.colRevised", undefined, "Revised"), width: 1.1 },
            { key: "ctd", label: t("pdf.wipReport.colCostToDate", undefined, "Cost-to-Date"), width: 1.1 },
            { key: "pct", label: "%", width: 0.6 },
            { key: "earned", label: t("pdf.wipReport.colEarned", undefined, "Earned"), width: 1.1 },
            { key: "billed", label: t("pdf.wipReport.colBilled", undefined, "Billed"), width: 1.1 },
            { key: "ou", label: t("pdf.wipReport.colOverUnder", undefined, "O/U"), width: 1.1 },
            { key: "eac", label: t("pdf.wipReport.colEac", undefined, "EAC"), width: 1.1 },
          ]}
          rows={rows.map((r) => ({
            project: r.project_name,
            rev: money(r.revised_contract_amount),
            ctd: money(r.costs_to_date),
            pct: `${Number(r.percent_complete).toFixed(0)}%`,
            earned: money(r.earned_revenue),
            billed: money(r.billed_to_date),
            ou: `${r.over_under_billed > 0 ? "O " : r.over_under_billed < 0 ? "U " : ""}${money(Math.abs(r.over_under_billed))}`,
            eac: money(r.estimated_at_completion),
          }))}
        />
        <View style={{ marginTop: 14, paddingTop: 6, borderTopWidth: 1, borderTopColor: "#0A0A0A" }}>
          <PdfTable
            columns={[
              { key: "label", label: t("pdf.wipReport.totals", undefined, "Totals"), width: 2.5 },
              { key: "rev", label: t("pdf.wipReport.colRevised", undefined, "Revised"), width: 1.1 },
              { key: "ctd", label: t("pdf.wipReport.colCostToDate", undefined, "Cost-to-Date"), width: 1.1 },
              { key: "pct", label: "%", width: 0.6 },
              { key: "earned", label: t("pdf.wipReport.colEarned", undefined, "Earned"), width: 1.1 },
              { key: "billed", label: t("pdf.wipReport.colBilled", undefined, "Billed"), width: 1.1 },
              { key: "ou", label: t("pdf.wipReport.colOverUnder", undefined, "O/U"), width: 1.1 },
              { key: "eac", label: t("pdf.wipReport.colEac", undefined, "EAC"), width: 1.1 },
            ]}
            rows={[
              {
                label: t(
                  "pdf.wipReport.projectsCount",
                  { count: rows.length },
                  `${rows.length} project${rows.length === 1 ? "" : "s"}`,
                ),
                rev: money(sum.revised),
                ctd: money(sum.ctd),
                pct: sum.revised > 0 ? `${Math.round((sum.ctd / sum.eac) * 100)}%` : "—",
                earned: money(sum.earned),
                billed: money(sum.billed),
                ou: `${sum.over_under > 0 ? "O " : sum.over_under < 0 ? "U " : ""}${money(Math.abs(sum.over_under))}`,
                eac: money(sum.eac),
              },
            ]}
          />
        </View>

        <SectionHeading title={t("pdf.wipReport.methodology", undefined, "Methodology")} />
        <Text style={styles.p}>
          {t(
            "pdf.wipReport.methodologyBody",
            undefined,
            "Percent-complete = costs_to_date / estimated_at_completion. Earned revenue = revised_contract × % comp. Over/under-billed = earned − billed (positive = over-billed, negative = under-billed). Estimated cost-to-complete = EAC − costs_to_date.",
          )}
        </Text>
      </BrandedPage>
    </PdfDocument>
  );
}
