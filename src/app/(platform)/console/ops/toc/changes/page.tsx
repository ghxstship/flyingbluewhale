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

type ChangeRow = {
  id: string;
  code: string;
  title: string;
  type: string;
  risk: string;
  impact: string;
  status: string;
  planned_start: string | null;
  planned_end: string | null;
  requested: { name: string | null; email: string | null } | null;
  assigned: { name: string | null; email: string | null } | null;
};

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  proposed: "muted",
  in_review: "info",
  approved: "info",
  rejected: "error",
  scheduled: "info",
  implementing: "warning",
  implemented: "success",
  closed: "muted",
  failed: "error",
};

const RISK_TONE: Record<string, "muted" | "warning" | "error"> = {
  low: "muted",
  medium: "warning",
  high: "error",
};

function fmt(iso: string | null): string {
  if (!iso) return "—";
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
          eyebrow={t("console.ops.toc.changes.eyebrow", undefined, "Operations")}
          title={t("console.ops.toc.changes.title", undefined, "Changes")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.ops.toc.changes.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmtIntl = await getRequestFormatters();
  const { data } = await supabase
    .from("itil_changes")
    .select(
      "id, code, title, type, risk, impact, status, planned_start, planned_end, requested:requested_by(name, email), assigned:assigned_to(name, email)",
    )
    .eq("org_id", session.orgId)
    .order("planned_start", { ascending: false, nullsFirst: false })
    .limit(500);

  const rows = (data ?? []) as unknown as ChangeRow[];
  const open = rows.filter((r) => !["closed", "rejected", "implemented", "failed"].includes(r.status)).length;
  const failed = rows.filter((r) => r.status === "failed").length;
  const emergency = rows.filter((r) => r.type === "emergency").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.ops.toc.changes.eyebrow", undefined, "Operations")}
        title={t("console.ops.toc.changes.title", undefined, "Changes")}
        subtitle={`${rows.length} ${rows.length === 1 ? t("console.ops.toc.changes.subtitle.recordOne", undefined, "Change Record") : t("console.ops.toc.changes.subtitle.recordMany", undefined, "Change Records")} · ${open} ${t("console.ops.toc.changes.subtitle.open", undefined, "Open")}${emergency ? ` · ${emergency} ${t("console.ops.toc.changes.subtitle.emergency", undefined, "Emergency")}` : ""}${failed ? ` · ${failed} ${t("console.ops.toc.changes.subtitle.failed", undefined, "Failed")}` : ""}`}
        action={
          <Button href="/console/ops/toc/changes/new" size="sm">
            {t("console.ops.toc.changes.newChange", undefined, "+ New Change")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.ops.toc.changes.metric.open", undefined, "Open")}
            value={fmtIntl.number(open)}
            accent
          />
          <MetricCard
            label={t("console.ops.toc.changes.metric.emergency", undefined, "Emergency")}
            value={fmtIntl.number(emergency)}
          />
          <MetricCard
            label={t("console.ops.toc.changes.metric.failed", undefined, "Failed")}
            value={fmtIntl.number(failed)}
          />
        </div>

        <DataTable<ChangeRow>
          rows={rows}
          rowHref={(r) => `/console/ops/toc/changes/${r.id}`}
          emptyLabel={t("console.ops.toc.changes.empty.label", undefined, "No change records")}
          emptyDescription={t(
            "console.ops.toc.changes.empty.description",
            undefined,
            "ITIL change management — author records for non-trivial changes during live ops (rigging swap, generator hot-swap, software patch on the timing box). Each record carries risk, impact, planned window, and a backout plan.",
          )}
          emptyAction={
            <Link href="/console/ops/toc/changes/new" className="ps-btn ps-btn--sm">
              {t("console.ops.toc.changes.newChange", undefined, "+ New Change")}
            </Link>
          }
          columns={[
            {
              key: "code",
              header: t("console.ops.toc.changes.col.code", undefined, "Code"),
              render: (r) => <span className="font-mono text-xs">{r.code}</span>,
              accessor: (r) => r.code ?? null,
            },
            {
              key: "title",
              header: t("console.ops.toc.changes.col.title", undefined, "Title"),
              render: (r) => r.title,
              accessor: (r) => r.title,
            },
            {
              key: "type",
              header: t("console.ops.toc.changes.col.type", undefined, "Type"),
              render: (r) => <Badge variant="muted">{toTitle(r.type)}</Badge>,
              accessor: (r) => r.type ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "risk",
              header: t("console.ops.toc.changes.col.risk", undefined, "Risk"),
              render: (r) => <Badge variant={RISK_TONE[r.risk] ?? "muted"}>{r.risk}</Badge>,
              accessor: (r) => r.risk ?? null,
            },
            {
              key: "window",
              header: t("console.ops.toc.changes.col.window", undefined, "Window"),
              render: (r) => `${fmt(r.planned_start)} → ${fmt(r.planned_end)}`,
              className: "font-mono text-xs",
              accessor: (r) => r.planned_start ?? null,
            },
            {
              key: "owner",
              header: t("console.ops.toc.changes.col.owner", undefined, "Owner"),
              render: (r) => r.assigned?.name ?? r.assigned?.email ?? "—",
              filterable: true,
              groupable: true,
              accessor: (r) => r.assigned?.name ?? r.assigned?.email ?? null,
            },
            {
              key: "status",
              header: t("console.ops.toc.changes.col.status", undefined, "Status"),
              render: (r) => <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{toTitle(r.status)}</Badge>,
              filterable: true,
              groupable: true,
              accessor: (r) => r.status ?? null,
            },
          ]}
        />

        <p className="text-xs text-[var(--p-text-2)]">
          {t(
            "console.ops.toc.changes.footer",
            undefined,
            "Operational telemetry (which rows changed, who edited what) lives in the audit log; the change register here is the human-curated ITIL record of intentional changes.",
          )}
        </p>
      </div>
    </>
  );
}
