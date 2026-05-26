import "server-only";

import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { BrandedPage, CoverPage, KeyValue, PdfDocument, PdfTable, SectionHeading, styles } from "./layout";
import type { PdfBrand } from "./branding";

/**
 * WIP (Work-In-Progress) Report PDF — surety / bonding format.
 *
 * One row per project per snapshot_date. Standard surety formatting:
 * Project | Contract | Approved COs | Revised | Cost-to-Date | % Comp |
 * Earned | Billed | Over/Under | EAC | ETC.
 */

export type WipReportInput = {
  brand: PdfBrand;
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
  try {
    return new Date(d + (d.length === 10 ? "T00:00:00" : "")).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return d;
  }
}

export function WipReportPdf({ brand, snapshot_date, org_name, rows }: WipReportInput) {
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

  return (
    <PdfDocument
      title={`WIP Report · ${fmtDate(snapshot_date)}`}
      author={brand.producerName}
      subject={`Work-In-Progress · ${org_name}`}
    >
      <CoverPage
        brand={brand}
        eyebrow="Work-In-Progress Report"
        title={`As of ${fmtDate(snapshot_date)}`}
        subtitle={`${rows.length} active project${rows.length === 1 ? "" : "s"} · ${bondedCount} bonded · ${overBilled} over-billed · ${underBilled} under-billed`}
      />

      <BrandedPage brand={brand} pageLabel={`WIP · ${org_name} · ${fmtDate(snapshot_date)}`}>
        <SectionHeading title="Portfolio Summary" />
        <KeyValue label="Snapshot date" value={fmtDate(snapshot_date)} />
        <KeyValue label="Active projects" value={String(rows.length)} />
        <KeyValue label="Aggregate revised contract" value={money(sum.revised)} />
        <KeyValue label="Aggregate costs-to-date" value={money(sum.ctd)} />
        <KeyValue label="Aggregate earned" value={money(sum.earned)} />
        <KeyValue label="Aggregate billed" value={money(sum.billed)} />
        <KeyValue
          label="Net over/under-billed"
          value={`${sum.over_under > 0 ? "Over " : "Under "}${money(Math.abs(sum.over_under))}`}
        />
        <KeyValue label="Aggregate EAC" value={money(sum.eac)} />

        <SectionHeading title="Projects" />
        <View style={{ marginBottom: 6 }}>
          <Text style={{ fontSize: 8, color: "#666" }}>
            All amounts in USD. % Comp is by cost. Over/Under = Earned − Billed (positive = over-billed).
          </Text>
        </View>
        <PdfTable
          columns={[
            { key: "project", label: "Project", width: 2.5 },
            { key: "rev", label: "Revised", width: 1.1 },
            { key: "ctd", label: "Cost-to-Date", width: 1.1 },
            { key: "pct", label: "%", width: 0.6 },
            { key: "earned", label: "Earned", width: 1.1 },
            { key: "billed", label: "Billed", width: 1.1 },
            { key: "ou", label: "O/U", width: 1.1 },
            { key: "eac", label: "EAC", width: 1.1 },
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
              { key: "label", label: "Totals", width: 2.5 },
              { key: "rev", label: "Revised", width: 1.1 },
              { key: "ctd", label: "Cost-to-Date", width: 1.1 },
              { key: "pct", label: "%", width: 0.6 },
              { key: "earned", label: "Earned", width: 1.1 },
              { key: "billed", label: "Billed", width: 1.1 },
              { key: "ou", label: "O/U", width: 1.1 },
              { key: "eac", label: "EAC", width: 1.1 },
            ]}
            rows={[
              {
                label: `${rows.length} project${rows.length === 1 ? "" : "s"}`,
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

        <SectionHeading title="Methodology" />
        <Text style={styles.p}>
          Percent-complete = costs_to_date / estimated_at_completion. Earned revenue = revised_contract × % comp.
          Over/under-billed = earned − billed (positive = over-billed, negative = under-billed). Estimated cost-to-
          complete = EAC − costs_to_date.
        </Text>
      </BrandedPage>
    </PdfDocument>
  );
}
