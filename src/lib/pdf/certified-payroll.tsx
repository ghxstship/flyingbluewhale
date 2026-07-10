import "server-only";

import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { BrandedPage, CoverPage, KeyValue, PdfDocument, PdfTable, SectionHeading, styles } from "./layout";
import type { PdfBrand } from "./branding";
import { formatDateParts } from "@/lib/i18n/format";

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

/** Request-scoped translator: `t(key, vars?, fallback?)`. */
export type Translator = (key: string, vars?: Record<string, string | number>, fallback?: string) => string;

/** Identity fallback used when no translator is threaded in (existing callers). */
const identityT: Translator = (_k, _v, fb) => fb ?? "";

export type WH347Input = {
  brand: PdfBrand;
  /** Optional request-scoped translator; defaults to English fallbacks. */
  t?: Translator;
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
  const formatted = formatDateParts(d, { year: "numeric", month: "short", day: "numeric" });
  return formatted === "—" ? d : formatted;
}

export function WH347Pdf({ brand, t = identityT, payroll, project, contractor, certifiedBy, lines }: WH347Input) {
  const formLabel =
    payroll.agency_report_type === "wh_347"
      ? t("pdf.certifiedPayroll.formWh347", undefined, "U.S. DOL Form WH-347 — Davis-Bacon Certified Payroll")
      : t(
          "pdf.certifiedPayroll.formGeneric",
          { type: payroll.agency_report_type.toUpperCase().replace(/_/g, " ") },
          `Certified Payroll — ${payroll.agency_report_type.toUpperCase().replace(/_/g, " ")}`,
        );

  const certifiedPayrollWord = t("pdf.certifiedPayroll.title", undefined, "Certified Payroll");
  const weekEndingShort = t("pdf.certifiedPayroll.weekEndingShort", undefined, "WE");
  const title = `${certifiedPayrollWord} · ${weekEndingShort} ${fmtDate(payroll.week_ending)}`;

  return (
    <PdfDocument title={title} author={brand.producerName} subject={`${formLabel} — ${project.name}`}>
      <CoverPage
        brand={brand}
        eyebrow={t("pdf.certifiedPayroll.statementOfCompliance", undefined, "Statement of Compliance")}
        title={certifiedPayrollWord}
        subtitle={`${project.name} · ${t("pdf.certifiedPayroll.weekEnding", undefined, "Week ending")} ${fmtDate(payroll.week_ending)}`}
      />

      <BrandedPage
        brand={brand}
        pageLabel={`WH-347 · ${project.name} · ${weekEndingShort} ${fmtDate(payroll.week_ending)}`}
      >
        <SectionHeading title={t("pdf.certifiedPayroll.projectContractor", undefined, "Project & Contractor")} />
        <KeyValue label={t("pdf.certifiedPayroll.project", undefined, "Project")} value={project.name} />
        {project.address ? (
          <KeyValue
            label={t("pdf.certifiedPayroll.projectAddress", undefined, "Project address")}
            value={project.address}
          />
        ) : null}
        <KeyValue label={t("pdf.certifiedPayroll.contractor", undefined, "Contractor")} value={contractor.name} />
        {contractor.address ? (
          <KeyValue
            label={t("pdf.certifiedPayroll.contractorAddress", undefined, "Contractor address")}
            value={contractor.address}
          />
        ) : null}
        <KeyValue label={t("pdf.certifiedPayroll.form", undefined, "Form")} value={formLabel} />
        <KeyValue
          label={t("pdf.certifiedPayroll.weekEnding", undefined, "Week ending")}
          value={fmtDate(payroll.week_ending)}
        />
        <KeyValue
          label={t("pdf.certifiedPayroll.payPeriod", undefined, "Pay period")}
          value={`${fmtDate(payroll.pay_period_start)} → ${fmtDate(payroll.pay_period_end)}`}
        />
        {payroll.state_code ? (
          <KeyValue label={t("pdf.certifiedPayroll.state", undefined, "State")} value={payroll.state_code} />
        ) : null}

        <SectionHeading title={t("pdf.certifiedPayroll.workerDetail", undefined, "Worker Detail")} />
        <View style={{ marginBottom: 6 }}>
          <Text style={{ fontSize: 8, color: "#666" }}>
            {t(
              "pdf.certifiedPayroll.hoursColumnsNote",
              undefined,
              "Hours columns are Sun / Mon / Tue / Wed / Thu / Fri / Sat. Amounts in USD.",
            )}
          </Text>
        </View>
        <PdfTable
          columns={[
            { key: "name", label: t("pdf.certifiedPayroll.colWorker", undefined, "Worker"), width: 2.5 },
            { key: "ssn", label: t("pdf.certifiedPayroll.colSsn", undefined, "SSN"), width: 0.6 },
            { key: "class", label: t("pdf.certifiedPayroll.colClass", undefined, "Class"), width: 1.4 },
            { key: "su", label: t("pdf.certifiedPayroll.colSun", undefined, "S"), width: 0.4 },
            { key: "mo", label: t("pdf.certifiedPayroll.colMon", undefined, "M"), width: 0.4 },
            { key: "tu", label: t("pdf.certifiedPayroll.colTue", undefined, "T"), width: 0.4 },
            { key: "we", label: t("pdf.certifiedPayroll.colWed", undefined, "W"), width: 0.4 },
            { key: "th", label: t("pdf.certifiedPayroll.colThu", undefined, "T"), width: 0.4 },
            { key: "fr", label: t("pdf.certifiedPayroll.colFri", undefined, "F"), width: 0.4 },
            { key: "sa", label: t("pdf.certifiedPayroll.colSat", undefined, "S"), width: 0.4 },
            { key: "st", label: t("pdf.certifiedPayroll.colSt", undefined, "ST"), width: 0.5 },
            { key: "ot", label: t("pdf.certifiedPayroll.colOt", undefined, "OT"), width: 0.5 },
            { key: "rate", label: t("pdf.certifiedPayroll.colRate", undefined, "Rate"), width: 0.7 },
            { key: "gross", label: t("pdf.certifiedPayroll.colGross", undefined, "Gross"), width: 1.0 },
            { key: "net", label: t("pdf.certifiedPayroll.colNet", undefined, "Net"), width: 1.0 },
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
              { key: "label", label: t("pdf.certifiedPayroll.totals", undefined, "Totals"), width: 8 },
              { key: "hrs", label: t("pdf.certifiedPayroll.colHours", undefined, "Hours"), width: 1.0 },
              { key: "gross", label: t("pdf.certifiedPayroll.colGross", undefined, "Gross"), width: 1.0 },
              { key: "fringes", label: t("pdf.certifiedPayroll.colFringes", undefined, "Fringes"), width: 1.0 },
            ]}
            rows={[
              {
                label: t("pdf.certifiedPayroll.totals", undefined, "Totals"),
                hrs: payroll.total_hours.toFixed(1),
                gross: money(payroll.total_gross),
                fringes: money(payroll.total_fringes),
              },
            ]}
          />
        </View>
      </BrandedPage>

      <BrandedPage
        brand={brand}
        pageLabel={`${t("pdf.certifiedPayroll.statementOfCompliance", undefined, "Statement of Compliance")} · ${project.name}`}
      >
        <SectionHeading title={t("pdf.certifiedPayroll.statementOfCompliance", undefined, "Statement of Compliance")} />
        <Text style={styles.p}>
          {t("pdf.certifiedPayroll.attestIntroLead", undefined, "I,")}{" "}
          <Text style={{ fontWeight: 700 }}>
            {certifiedBy?.name ?? t("pdf.certifiedPayroll.certifierNamePlaceholder", undefined, "[Certifier Name]")}
          </Text>
          {certifiedBy?.title ? ` — ${certifiedBy.title}` : ""}
          {t("pdf.certifiedPayroll.attestIntroTrail", undefined, ", do hereby state:")}
        </Text>
        <Text style={styles.p}>
          {t(
            "pdf.certifiedPayroll.clause1",
            {
              contractor: contractor.name,
              project: project.name,
              start: fmtDate(payroll.pay_period_start),
              end: fmtDate(payroll.pay_period_end),
            },
            `(1) That I pay or supervise the payment of the persons employed by ${contractor.name} on the ${project.name} project; that during the payroll period commencing on the ${fmtDate(payroll.pay_period_start)} day and ending the ${fmtDate(payroll.pay_period_end)} day, all persons employed on said project have been paid the full weekly wages earned, that no rebates have been or will be made either directly or indirectly to or on behalf of said contractor or subcontractor from the full weekly wages earned by any person and that no deductions have been made either directly or indirectly from the full wages earned by any person, other than permissible deductions as defined in Regulations, Part 3 (29 CFR Subtitle A).`,
          )}
        </Text>
        <Text style={styles.p}>
          {t(
            "pdf.certifiedPayroll.clause2",
            undefined,
            "(2) That any payrolls otherwise under this contract required to be submitted for the above period are correct and complete; that the wage rates for laborers or mechanics contained therein are not less than the applicable wage rates contained in any wage determination incorporated into the contract; that the classifications set forth therein for each laborer or mechanic conform with the work he performed.",
          )}
        </Text>
        <Text style={styles.p}>
          {t(
            "pdf.certifiedPayroll.clause3",
            undefined,
            "(3) That any apprentices employed in the above period are duly registered in a bona fide apprenticeship program registered with a State apprenticeship agency recognized by the Bureau of Apprenticeship and Training, United States Department of Labor, or if no such recognized agency exists in a State, are registered with the Bureau of Apprenticeship and Training, United States Department of Labor.",
          )}
        </Text>
        <Text style={styles.p}>
          {payroll.total_fringes > 0
            ? t(
                "pdf.certifiedPayroll.clause4WithFringes",
                { amount: money(payroll.total_fringes) },
                `(4) That fringe benefits required by the wage determination have been paid as applicable — total fringe payments this period: ${money(payroll.total_fringes)}.`,
              )
            : t(
                "pdf.certifiedPayroll.clause4NoFringes",
                undefined,
                "(4) That fringe benefits required by the wage determination have been paid as applicable — no fringes due this period.",
              )}
        </Text>

        {payroll.certified_at ? (
          <KeyValue
            label={t("pdf.certifiedPayroll.certified", undefined, "Certified")}
            value={fmtDate(payroll.certified_at)}
          />
        ) : null}
        {certifiedBy?.name ? (
          <KeyValue
            label={t("pdf.certifiedPayroll.signedBy", undefined, "Signed by")}
            value={`${certifiedBy.name}${certifiedBy.title ? `, ${certifiedBy.title}` : ""}`}
          />
        ) : null}
        {payroll.notes ? (
          <>
            <SectionHeading title={t("pdf.certifiedPayroll.notes", undefined, "Notes")} />
            <Text style={styles.p}>{payroll.notes}</Text>
          </>
        ) : null}
      </BrandedPage>
    </PdfDocument>
  );
}
