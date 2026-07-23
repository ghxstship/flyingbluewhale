export const dynamic = "force-dynamic";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { DetailShell, fmtDate, fmtDateTime } from "@/components/detail/DetailShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DownloadLink } from "@/components/DownloadLink";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

/**
 * `/studio/finance/payroll/[runId]` — the certified-payroll run record.
 *
 * `createPayrollRun` has always redirected here (`../new/actions.ts`), but
 * the route didn't exist, so every run creation landed on a 404.
 *
 * Lines are read honestly: nothing populates `payroll_run_lines` yet (the
 * compile/post spine is Phase 3 of docs/compvss/TIME_MANAGEMENT_LIFECYCLE_PLAN.md),
 * so the empty state says the run has no lines rather than implying the
 * exporters have something to export.
 */

type AgencyReport = "wh_347" | "ca_dir" | "ny_pwa" | "wa_lni" | "state_other" | "none";

const AGENCY_LABEL: Record<AgencyReport, string> = {
  wh_347: "WH-347 (Federal)",
  ca_dir: "CA DIR",
  ny_pwa: "NY PWA",
  wa_lni: "WA L&I",
  state_other: "State (other)",
  none: "—",
};

/** Only these agency types render a state XML; WH-347 is the PDF path. */
const XML_AGENCIES: readonly AgencyReport[] = ["ca_dir", "ny_pwa", "wa_lni"];

type Run = {
  id: string;
  week_ending: string;
  pay_period_start: string;
  pay_period_end: string;
  state_code: string | null;
  agency_report_type: AgencyReport;
  run_state: string;
  certified_at: string | null;
  submitted_at: string | null;
  agency_reference: string | null;
  total_hours: number;
  total_gross: number;
  total_fringes: number;
  notes: string | null;
  created_at: string;
  project: { name: string | null } | null;
};

type Line = {
  id: string;
  worker_name: string | null;
  classification: string;
  hours_st: number;
  hours_ot: number;
  hours_dt: number;
  gross: number;
  net: number;
};

export default async function Page({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const session = await requireSession();
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { data } = await supabase
    .from("payroll_runs")
    .select(
      "id, week_ending, pay_period_start, pay_period_end, state_code, agency_report_type, run_state, certified_at, submitted_at, agency_reference, total_hours, total_gross, total_fringes, notes, created_at, project:project_id(name)",
    )
    .eq("org_id", session.orgId)
    .eq("id", runId)
    .is("deleted_at", null)
    .maybeSingle();

  const row = data as unknown as Run | null;

  const { data: lineRows } = row
    ? await supabase
        .from("payroll_run_lines")
        .select("id, worker_name, classification, hours_st, hours_ot, hours_dt, gross, net")
        .eq("org_id", session.orgId)
        .eq("payroll_run_id", runId)
        .order("worker_name", { ascending: true })
    : { data: [] };
  const lines = (lineRows ?? []) as unknown as Line[];

  const money = (n: number) => fmt.money(Math.round(Number(n) * 100));
  const title = row
    ? `${row.project?.name ?? t("console.finance.payroll.detail.untitledProject", undefined, "Untitled project")} · ${fmtDate(row.week_ending)}`
    : "";

  return (
    <DetailShell
      row={row}
      eyebrow={t("console.finance.payroll.eyebrow", undefined, "Finance")}
      title={() => title}
      subtitle={(r) =>
        `${fmtDate(r.pay_period_start)} – ${fmtDate(r.pay_period_end)} · ${AGENCY_LABEL[r.agency_report_type]}`
      }
      breadcrumbs={[
        { label: t("console.finance.breadcrumb", undefined, "Finance"), href: "/studio/finance" },
        {
          label: t("console.finance.payroll.breadcrumb", undefined, "Certified Payroll"),
          href: "/studio/finance/payroll",
        },
        { label: title },
      ]}
      action={row ? <StatusBadge status={row.run_state} /> : undefined}
      fields={
        row
          ? [
              {
                label: t("console.finance.payroll.detail.fields.project", undefined, "Project"),
                value: row.project?.name ?? "—",
              },
              {
                label: t("console.finance.payroll.detail.fields.runState", undefined, "Status"),
                value: <StatusBadge status={row.run_state} />,
              },
              {
                label: t("console.finance.payroll.detail.fields.weekEnding", undefined, "Week ending"),
                value: fmtDate(row.week_ending),
              },
              {
                label: t("console.finance.payroll.detail.fields.payPeriod", undefined, "Pay period"),
                value: `${fmtDate(row.pay_period_start)} – ${fmtDate(row.pay_period_end)}`,
              },
              {
                label: t("console.finance.payroll.detail.fields.agency", undefined, "Agency report"),
                value: AGENCY_LABEL[row.agency_report_type],
              },
              {
                label: t("console.finance.payroll.detail.fields.stateCode", undefined, "State"),
                value: row.state_code ?? "—",
              },
              {
                label: t("console.finance.payroll.detail.fields.totalHours", undefined, "Total hours"),
                value: Number(row.total_hours).toFixed(1),
              },
              {
                label: t("console.finance.payroll.detail.fields.totalGross", undefined, "Gross"),
                value: money(row.total_gross),
              },
              {
                label: t("console.finance.payroll.detail.fields.totalFringes", undefined, "Fringes"),
                value: money(row.total_fringes),
              },
              {
                label: t("console.finance.payroll.detail.fields.certified", undefined, "Certified"),
                value: row.certified_at ? fmtDateTime(row.certified_at) : "—",
              },
              {
                label: t("console.finance.payroll.detail.fields.submitted", undefined, "Submitted"),
                value: row.submitted_at ? fmtDateTime(row.submitted_at) : "—",
              },
              {
                label: t("console.finance.payroll.detail.fields.agencyReference", undefined, "Agency reference"),
                value: row.agency_reference ?? "—",
              },
            ]
          : undefined
      }
    >
      {row && (
        <section className="surface space-y-3 p-5">
          <h2 className="text-sm font-semibold text-[var(--p-text-1)]">
            {t("console.finance.payroll.detail.export.heading", undefined, "Export")}
          </h2>
          <div className="flex items-center gap-2">
            <DownloadLink href={`/api/v1/payroll-runs/${row.id}/pdf`}>
              {t("console.finance.payroll.detail.export.pdf", undefined, "Certified payroll PDF")}
            </DownloadLink>
            {XML_AGENCIES.includes(row.agency_report_type) && (
              <DownloadLink href={`/api/v1/payroll-runs/${row.id}/state-xml`}>
                {t("console.finance.payroll.detail.export.xml", undefined, "State filing XML")}
              </DownloadLink>
            )}
          </div>
        </section>
      )}

      <section className="surface space-y-3 p-5">
        <h2 className="text-sm font-semibold text-[var(--p-text-1)]">
          {t("console.finance.payroll.detail.lines.heading", undefined, "Lines")}
        </h2>
        {lines.length === 0 ? (
          <p className="text-sm text-[var(--p-text-2)]">
            {t(
              "console.finance.payroll.detail.lines.empty",
              undefined,
              "This run has no lines. Lines are generated when an approved timesheet is posted to the run.",
            )}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="ps-table w-full">
              <thead>
                <tr>
                  <th>{t("console.finance.payroll.detail.lines.worker", undefined, "Worker")}</th>
                  <th>{t("console.finance.payroll.detail.lines.classification", undefined, "Classification")}</th>
                  <th className="text-right">{t("console.finance.payroll.detail.lines.st", undefined, "ST")}</th>
                  <th className="text-right">{t("console.finance.payroll.detail.lines.ot", undefined, "OT")}</th>
                  <th className="text-right">{t("console.finance.payroll.detail.lines.dt", undefined, "DT")}</th>
                  <th className="text-right">{t("console.finance.payroll.detail.lines.gross", undefined, "Gross")}</th>
                  <th className="text-right">{t("console.finance.payroll.detail.lines.net", undefined, "Net")}</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.id}>
                    <td>{l.worker_name ?? "—"}</td>
                    <td className="text-xs">{l.classification}</td>
                    <td className="text-right font-mono text-xs">{Number(l.hours_st).toFixed(1)}</td>
                    <td className="text-right font-mono text-xs">{Number(l.hours_ot).toFixed(1)}</td>
                    <td className="text-right font-mono text-xs">{Number(l.hours_dt).toFixed(1)}</td>
                    <td className="text-right font-mono text-xs">{money(l.gross)}</td>
                    <td className="text-right font-mono text-xs">{money(l.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {row?.notes && (
        <section className="surface space-y-2 p-5">
          <h2 className="text-sm font-semibold text-[var(--p-text-1)]">
            {t("console.finance.payroll.detail.notes.heading", undefined, "Notes")}
          </h2>
          <p className="text-sm text-[var(--p-text-2)]">{row.notes}</p>
        </section>
      )}
    </DetailShell>
  );
}
