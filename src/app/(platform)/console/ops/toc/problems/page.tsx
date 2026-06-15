import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type ProblemRow = {
  id: string;
  code: string;
  title: string;
  priority: string;
  status: string;
  detected_at: string;
  resolved_at: string | null;
  reporter: { name: string | null; email: string | null } | null;
  assigned: { name: string | null; email: string | null } | null;
};

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  new: "warning",
  investigating: "info",
  known_error: "warning",
  resolved: "success",
  closed: "muted",
};

const PRIORITY_TONE: Record<string, "muted" | "info" | "warning" | "error"> = {
  P1: "error",
  P2: "warning",
  P3: "info",
  P4: "muted",
};

function fmt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.ops.toc.problems.eyebrow", undefined, "Operations")}
          title={t("console.ops.toc.problems.title", undefined, "Problems")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.ops.toc.problems.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmtIntl = await getRequestFormatters();
  const { data } = await supabase
    .from("itil_problems")
    .select(
      "id, code, title, priority, status:problem_state, detected_at, resolved_at, reporter:reporter_id(name, email), assigned:assigned_to(name, email)",
    )
    .eq("org_id", session.orgId)
    .order("detected_at", { ascending: false })
    .limit(500);

  const rows = (data ?? []) as unknown as ProblemRow[];
  const open = rows.filter((r) => !["resolved", "closed"].includes(r.status)).length;
  const knownErrors = rows.filter((r) => r.status === "known_error").length;
  const p1 = rows.filter((r) => r.priority === "P1").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.ops.toc.problems.eyebrow", undefined, "Operations")}
        title={t("console.ops.toc.problems.title", undefined, "Problems")}
        subtitle={`${rows.length} ${rows.length === 1 ? t("console.ops.toc.problems.recordSingular", undefined, "problem record") : t("console.ops.toc.problems.recordPlural", undefined, "problem records")} · ${open} ${t("console.ops.toc.problems.openLabel", undefined, "Open")}  · ${knownErrors} ${t("console.ops.toc.problems.knownErrorsLabel", undefined, "known errors")}${p1 ? ` · ${p1} ${t("console.ops.toc.problems.p1Label", undefined, "P1")}` : ""}`}
        action={
          <Button href="/console/ops/toc/problems/new" size="sm">
            {t("console.ops.toc.problems.newProblem", undefined, "+ New Problem")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.ops.toc.problems.metric.open", undefined, "Open")}
            value={fmtIntl.number(open)}
            accent
          />
          <MetricCard
            label={t("console.ops.toc.problems.metric.knownErrors", undefined, "Known Errors")}
            value={fmtIntl.number(knownErrors)}
          />
          <MetricCard label={t("console.ops.toc.problems.metric.p1", undefined, "P1")} value={fmtIntl.number(p1)} />
        </div>

        <DataTable<ProblemRow>
          rows={rows}
          rowHref={(r) => `/console/ops/toc/problems/${r.id}`}
          emptyLabel={t("console.ops.toc.problems.emptyLabel", undefined, "No problems registered")}
          emptyDescription={t(
            "console.ops.toc.problems.emptyDescription",
            undefined,
            "ITIL problem management — record root-cause investigations triggered by incidents. Link incidents and the change(s) that resolve them.",
          )}
          emptyAction={
            <Link href="/console/ops/toc/problems/new" className="ps-btn ps-btn--sm">
              {t("console.ops.toc.problems.newProblem", undefined, "+ New Problem")}
            </Link>
          }
          columns={[
            {
              key: "code",
              header: t("console.ops.toc.problems.col.code", undefined, "Code"),
              render: (r) => <span className="font-mono text-xs">{r.code}</span>,
              accessor: (r) => r.code ?? null,
            },
            {
              key: "title",
              header: t("console.ops.toc.problems.col.title", undefined, "Title"),
              render: (r) => r.title,
              accessor: (r) => r.title,
            },
            {
              key: "priority",
              header: t("console.ops.toc.problems.col.priority", undefined, "Priority"),
              render: (r) => <Badge variant={PRIORITY_TONE[r.priority] ?? "muted"}>{toTitle(r.priority)}</Badge>,
              accessor: (r) => r.priority ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "detected",
              header: t("console.ops.toc.problems.col.detected", undefined, "Detected"),
              render: (r) => fmt(r.detected_at),
              className: "font-mono text-xs",
              accessor: (r) => r.detected_at ?? null,
            },
            {
              key: "owner",
              header: t("console.ops.toc.problems.col.owner", undefined, "Owner"),
              render: (r) => r.assigned?.name ?? r.assigned?.email ?? "—",
              filterable: true,
              groupable: true,
              accessor: (r) => r.assigned?.name ?? r.assigned?.email ?? null,
            },
            {
              key: "status",
              header: t("console.ops.toc.problems.col.status", undefined, "Status"),
              render: (r) => <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{toTitle(r.status)}</Badge>,
              filterable: true,
              groupable: true,
              accessor: (r) => r.status ?? null,
            },
          ]}
        />

        <p className="text-xs text-[var(--p-text-2)]">
          {t(
            "console.ops.toc.problems.footnote",
            undefined,
            "Problem records are the SSOT for known errors and root-cause investigations. Link incidents (cause) and changes (fix) to close the loop.",
          )}
        </p>
      </div>
    </>
  );
}
