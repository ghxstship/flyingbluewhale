import "server-only";

import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { BrandedPage, CoverPage, KeyValue, PdfDocument, PdfTable, SectionHeading, styles } from "./layout";
import type { PdfBrand } from "./branding";

/**
 * WH-347 Certified Payroll PDF generator (Davis-Bacon federal form).
 *
 * Faithful re-creation of the US DOL WH-347 layout in our brand language —
 * the federal form is public domain. State variants (CA DIR, NY PWA, WA L&I)
 * use different XMLs and are deferred to their own renderers.
 *
 * Two pages:
 *   1. WH-347 cover — project, agency, week-ending, contractor, payroll #.
 *   2. Continuation — per-employee rows with hours by day, classification,
 *      rate, gross, deductions, net. Statement of compliance on the back.
 */

export type WH347Input = {
  brand: PdfBrand;
  payroll: {
    week_ending: string;
    pay_period_start: string;
    pay_period_end: string;
    state_code: string | null;
    agency_report_type: "wh_347" | "ca_dir" | "ny_pwa" | "wa_lni" | "state_other" | "none";
    submitted_at: string | null;
    certified_at: string | null;
    total_hours: number;
    total_gross: number;
    total_fringes: number;
    notes: string | null;
  };
  project: { name: string; address: string | null };
  contractor: { name: string; address: string | null };
  certifiedBy: { name: string | null; title: string | null } | null;
  lines: Array<{
    worker_name: string;
    ssn_last_4: string | null;
    classification: string;
    hours_by_day: number[]; // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
    hours_st: number;
    hours_ot: number;
    hours_dt: number;
    rate_st: number;
    gross: number;
    fringes_cash: number;
    fringes_to_plans: number;
    deductions: Record<string, number>;
    net: number;
  }>;
};

function money(amount: number): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return d;
  }
}

export function WH347Pdf({ brand, payroll, project, contractor, certifiedBy, lines }: WH347Input) {
  const formLabel =
    payroll.agency_report_type === "wh_347"
      ? "U.S. DOL Form WH-347 — Davis-Bacon Certified Payroll"
      : `Certified Payroll — ${payroll.agency_report_type.toUpperCase().replace(/_/g, " ")}`;

  const title = `Certified Payroll · WE ${fmtDate(payroll.week_ending)}`;

  return (
    <PdfDocument title={title} author={brand.producerName} subject={`${formLabel} — ${project.name}`}>
      <CoverPage
        brand={brand}
        eyebrow="Statement of Compliance"
        title="Certified Payroll"
        subtitle={`${project.name} · Week ending ${fmtDate(payroll.week_ending)}`}
      />

      <BrandedPage brand={brand} pageLabel={`WH-347 · ${project.name} · WE ${fmtDate(payroll.week_ending)}`}>
        <SectionHeading title="Project & Contractor" />
        <KeyValue label="Project" value={project.name} />
        {project.address ? <KeyValue label="Project address" value={project.address} /> : null}
        <KeyValue label="Contractor" value={contractor.name} />
        {contractor.address ? <KeyValue label="Contractor address" value={contractor.address} /> : null}
        <KeyValue label="Form" value={formLabel} />
        <KeyValue label="Week ending" value={fmtDate(payroll.week_ending)} />
        <KeyValue
          label="Pay period"
          value={`${fmtDate(payroll.pay_period_start)} → ${fmtDate(payroll.pay_period_end)}`}
        />
        {payroll.state_code ? <KeyValue label="State" value={payroll.state_code} /> : null}

        <SectionHeading title="Worker Detail" />
        <View style={{ marginBottom: 6 }}>
          <Text style={{ fontSize: 8, color: "#666" }}>
            Hours columns are Sun / Mon / Tue / Wed / Thu / Fri / Sat. Amounts in USD.
          </Text>
        </View>
        <PdfTable
          columns={[
            { key: "name", label: "Worker", width: 2.5 },
            { key: "ssn", label: "SSN", width: 0.6 },
            { key: "class", label: "Class", width: 1.4 },
            { key: "su", label: "S", width: 0.4 },
            { key: "mo", label: "M", width: 0.4 },
            { key: "tu", label: "T", width: 0.4 },
            { key: "we", label: "W", width: 0.4 },
            { key: "th", label: "T", width: 0.4 },
            { key: "fr", label: "F", width: 0.4 },
            { key: "sa", label: "S", width: 0.4 },
            { key: "st", label: "ST", width: 0.5 },
            { key: "ot", label: "OT", width: 0.5 },
            { key: "rate", label: "Rate", width: 0.7 },
            { key: "gross", label: "Gross", width: 1.0 },
            { key: "net", label: "Net", width: 1.0 },
          ]}
          rows={lines.map((l) => ({
            name: l.worker_name,
            ssn: l.ssn_last_4 ? `***-**-${l.ssn_last_4}` : "—",
            class: l.classification,
            su: l.hours_by_day[0]?.toFixed(1) ?? "0.0",
            mo: l.hours_by_day[1]?.toFixed(1) ?? "0.0",
            tu: l.hours_by_day[2]?.toFixed(1) ?? "0.0",
            we: l.hours_by_day[3]?.toFixed(1) ?? "0.0",
            th: l.hours_by_day[4]?.toFixed(1) ?? "0.0",
            fr: l.hours_by_day[5]?.toFixed(1) ?? "0.0",
            sa: l.hours_by_day[6]?.toFixed(1) ?? "0.0",
            st: l.hours_st.toFixed(1),
            ot: l.hours_ot.toFixed(1),
            rate: money(l.rate_st),
            gross: money(l.gross),
            net: money(l.net),
          }))}
        />
        <View style={{ marginTop: 14, paddingTop: 6, borderTopWidth: 1, borderTopColor: "#0A0A0A" }}>
          <PdfTable
            columns={[
              { key: "label", label: "Totals", width: 8 },
              { key: "hrs", label: "Hours", width: 1.0 },
              { key: "gross", label: "Gross", width: 1.0 },
              { key: "fringes", label: "Fringes", width: 1.0 },
            ]}
            rows={[
              {
                label: "Totals",
                hrs: payroll.total_hours.toFixed(1),
                gross: money(payroll.total_gross),
                fringes: money(payroll.total_fringes),
              },
            ]}
          />
        </View>
      </BrandedPage>

      <BrandedPage brand={brand} pageLabel={`Statement of Compliance · ${project.name}`}>
        <SectionHeading title="Statement of Compliance" />
        <Text style={styles.p}>
          I, <Text style={{ fontWeight: 700 }}>{certifiedBy?.name ?? "[Certifier Name]"}</Text>
          {certifiedBy?.title ? ` (${certifiedBy.title})` : ""}, do hereby state:
        </Text>
        <Text style={styles.p}>
          (1) That I pay or supervise the payment of the persons employed by {contractor.name} on the {project.name}{" "}
          project; that during the payroll period commencing on the {fmtDate(payroll.pay_period_start)} day and ending
          the {fmtDate(payroll.pay_period_end)} day, all persons employed on said project have been paid the full weekly
          wages earned, that no rebates have been or will be made either directly or indirectly to or on behalf of said
          contractor or subcontractor from the full weekly wages earned by any person and that no deductions have been
          made either directly or indirectly from the full wages earned by any person, other than permissible deductions
          as defined in Regulations, Part 3 (29 CFR Subtitle A).
        </Text>
        <Text style={styles.p}>
          (2) That any payrolls otherwise under this contract required to be submitted for the above period are correct
          and complete; that the wage rates for laborers or mechanics contained therein are not less than the applicable
          wage rates contained in any wage determination incorporated into the contract; that the classifications set
          forth therein for each laborer or mechanic conform with the work he performed.
        </Text>
        <Text style={styles.p}>
          (3) That any apprentices employed in the above period are duly registered in a bona fide apprenticeship
          program registered with a State apprenticeship agency recognized by the Bureau of Apprenticeship and Training,
          United States Department of Labor, or if no such recognized agency exists in a State, are registered with the
          Bureau of Apprenticeship and Training, United States Department of Labor.
        </Text>
        <Text style={styles.p}>
          (4) That fringe benefits required by the wage determination have been paid as applicable —
          {payroll.total_fringes > 0
            ? ` total fringe payments this period: ${money(payroll.total_fringes)}.`
            : " no fringes due this period."}
        </Text>

        {payroll.certified_at ? <KeyValue label="Certified" value={fmtDate(payroll.certified_at)} /> : null}
        {certifiedBy?.name ? (
          <KeyValue
            label="Signed by"
            value={`${certifiedBy.name}${certifiedBy.title ? `, ${certifiedBy.title}` : ""}`}
          />
        ) : null}
        {payroll.notes ? (
          <>
            <SectionHeading title="Notes" />
            <Text style={styles.p}>{payroll.notes}</Text>
          </>
        ) : null}
      </BrandedPage>
    </PdfDocument>
  );
}
