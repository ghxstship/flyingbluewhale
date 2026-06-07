import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type AgencyReport = "wh_347" | "ca_dir" | "ny_pwa" | "wa_lni" | "state_other" | "none";
type RunState = "draft" | "in_review" | "submitted" | "accepted" | "rejected" | "voided";

type Row = {
  id: string;
  week_ending: string;
  agency_report_type: AgencyReport;
  run_state: RunState;
  state_code: string | null;
  total_hours: number;
  total_gross: number;
  total_fringes: number;
  certified_at: string | null;
  submitted_at: string | null;
  project: { name: string | null } | null;
};

const STATE_TONE: Record<RunState, "muted" | "info" | "warning" | "success" | "error"> = {
  draft: "muted",
  in_review: "warning",
  submitted: "info",
  accepted: "success",
  rejected: "error",
  voided: "muted",
};

const AGENCY_LABEL: Record<AgencyReport, string> = {
  wh_347: "WH-347 (Federal)",
  ca_dir: "CA DIR",
  ny_pwa: "NY PWA",
  wa_lni: "WA L&I",
  state_other: "State (other)",
  none: "—",
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.finance.payroll.eyebrow", undefined, "Finance")}
          title={t("console.finance.payroll.title", undefined, "Certified Payroll")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.finance.payroll.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("payroll_runs")
    .select(
      "id, week_ending, agency_report_type, run_state, state_code, total_hours, total_gross, total_fringes, certified_at, submitted_at, project:project_id(name)",
    )
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("week_ending", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as Row[];

  const outstandingCount = rows.filter((r) => ["draft", "in_review"].includes(r.run_state)).length;
  const submittedCount = rows.filter((r) => r.run_state === "submitted").length;
  const totalGross = rows.reduce((s, r) => s + Number(r.total_gross), 0);

  function fmtMoney(n: number): string {
    return fmt.money(Math.round(n * 100));
  }

  const subtitle = t(
    "console.finance.payroll.subtitle",
    {
      runs: rows.length,
      runLabel:
        rows.length === 1
          ? t("console.finance.payroll.runSingular", undefined, "run")
          : t("console.finance.payroll.runPlural", undefined, "runs"),
      outstanding: outstandingCount,
      submitted: submittedCount,
      gross: fmtMoney(totalGross),
    },
    `${rows.length} run${rows.length === 1 ? "" : "s"} · ${outstandingCount} outstanding · ${submittedCount} submitted · ${fmtMoney(totalGross)} gross YTD`,
  );

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.payroll.eyebrow", undefined, "Finance")}
        title={t("console.finance.payroll.title", undefined, "Certified Payroll")}
        subtitle={subtitle}
        action={
          <Button href="/console/finance/payroll/new" size="sm">
            {t("console.finance.payroll.newRun", undefined, "+ New Payroll Run")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.finance.payroll.metrics.outstanding", undefined, "Outstanding")}
            value={fmt.number(outstandingCount)}
            accent
          />
          <MetricCard
            label={t("console.finance.payroll.metrics.submitted", undefined, "Submitted")}
            value={fmt.number(submittedCount)}
          />
          <MetricCard
            label={t("console.finance.payroll.metrics.grossYTD", undefined, "Gross YTD")}
            value={fmtMoney(totalGross)}
          />
        </div>
        <div className="text-[10px] text-[var(--p-text-2)]">
          {t(
            "console.finance.payroll.compliance",
            undefined,
            "Davis-Bacon (WH-347), CA DIR, NY PWA, WA L&I supported via agency_report_type. PDF generator + state XML exporters are separate tickets; schema, RLS, and admin view are live.",
          )}
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/api/v1/payroll-runs/${r.id}/pdf`}
          emptyLabel={t("console.finance.payroll.emptyLabel", undefined, "No payroll runs yet")}
          emptyDescription={t(
            "console.finance.payroll.emptyDescription",
            undefined,
            "A payroll run is one week-ending per project. Lines hold per-employee hours by classification + wage determination.",
          )}
          emptyAction={
            <Button href="/console/finance/payroll/new" size="sm">
              {t("console.finance.payroll.newRun", undefined, "+ New Payroll Run")}
            </Button>
          }
          columns={[
            {
              key: "week",
              header: t("console.finance.payroll.columns.weekEnding", undefined, "Week Ending"),
              render: (r) =>
                fmt.dateParts(r.week_ending + "T00:00:00", { month: "short", day: "numeric", year: "2-digit" }),
              accessor: (r) => r.week_ending,
              className: "font-mono text-xs",
            },
            {
              key: "project",
              header: t("console.finance.payroll.columns.project", undefined, "Project"),
              render: (r) => r.project?.name ?? "—",
              accessor: (r) => r.project?.name ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "agency",
              header: t("console.finance.payroll.columns.agency", undefined, "Agency"),
              render: (r) => AGENCY_LABEL[r.agency_report_type],
              accessor: (r) => r.agency_report_type,
              filterable: true,
              groupable: true,
              className: "text-xs",
            },
            {
              key: "state",
              header: t("console.finance.payroll.columns.state", undefined, "State"),
              render: (r) => r.state_code ?? "—",
              accessor: (r) => r.state_code,
              filterable: true,
              groupable: true,
              className: "font-mono text-xs",
            },
            {
              key: "hours",
              header: t("console.finance.payroll.columns.hours", undefined, "Hours"),
              render: (r) => Number(r.total_hours).toFixed(1),
              accessor: (r) => Number(r.total_hours),
              className: "font-mono text-xs text-right",
            },
            {
              key: "gross",
              header: t("console.finance.payroll.columns.gross", undefined, "Gross"),
              render: (r) => fmtMoney(Number(r.total_gross)),
              accessor: (r) => Number(r.total_gross),
              className: "font-mono text-xs text-right",
            },
            {
              key: "run_state",
              header: t("console.finance.payroll.columns.runState", undefined, "State"),
              render: (r) => <Badge variant={STATE_TONE[r.run_state]}>{toTitle(r.run_state)}</Badge>,
              accessor: (r) => r.run_state,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
