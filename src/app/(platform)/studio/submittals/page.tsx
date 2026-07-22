import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataView } from "@/components/views/DataViewServer";
import { Badge } from "@/components/ui/Badge";
import { DueDateBadge } from "@/components/ui/DueDateBadge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { formatDate } from "@/lib/i18n/format";
import { toTitle } from "@/lib/format";
import { toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  code: string;
  title: string;
  spec_section: string | null;
  status: string;
  current_round: number;
  due_at: string | null;
  closed_at: string | null;
  project: { name: string | null } | null;
  vendor: { name: string | null } | null;
  ball: { name: string | null; email: string | null } | null;
};

function fmt(d: string | null): string {
  if (!d) return "—";
  return formatDate(new Date(d + "T00:00:00"));
}

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.submittals.eyebrow", undefined, "Procurement")}
          title={t("console.submittals.title", undefined, "Submittals")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.submittals.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmtIntl = await getRequestFormatters();
  const { data } = await supabase
    .from("submittals")
    .select(
      "id, code, title, spec_section, status:submittal_state, current_round, due_at, closed_at, project:project_id(name), vendor:vendor_id(name), ball:ball_in_court_id(name, email)",
    )
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as Row[];
  const inFlight = rows.filter((r) => ["submitted", "in_review", "revise_resubmit"].includes(r.status)).length;
  const approved = rows.filter((r) => ["approved", "approved_with_comments"].includes(r.status)).length;
  const rejected = rows.filter((r) => r.status === "rejected").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.submittals.eyebrow", undefined, "Procurement")}
        title={t("console.submittals.title", undefined, "Submittals")}
        subtitle={t("console.submittals.subtitle", undefined, "Vendor packages with stamps + revision rounds.")}
        action={
          <Button href="/studio/submittals/new" size="sm">
            {t("console.submittals.newCta", undefined, "+ New Submittal")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.submittals.metrics.inFlight", undefined, "In Flight")}
            value={fmtIntl.number(inFlight)}
            accent
          />
          <MetricCard
            label={t("console.submittals.metrics.approved", undefined, "Approved")}
            value={fmtIntl.number(approved)}
          />
          <MetricCard
            label={t("console.submittals.metrics.rejected", undefined, "Rejected")}
            value={fmtIntl.number(rejected)}
          />
        </div>
        <DataView<Row>
          rows={rows}
          rowHref={(r) => `/studio/submittals/${r.id}`}
          emptyLabel={t("console.submittals.emptyLabel", undefined, "No submittals yet")}
          emptyDescription={t(
            "console.submittals.emptyDescription",
            undefined,
            "Vendor packages, technical specs, brand approvals. Track them with stamps and revision rounds.",
          )}
          emptyAction={
            <Button href="/studio/submittals/new" size="sm">
              {t("console.submittals.newCta", undefined, "+ New Submittal")}
            </Button>
          }
          columns={[
            {
              key: "code",
              header: t("console.submittals.columns.code", undefined, "Code"),
              render: (r) => r.code,
              mono: true,
              accessor: (r) => r.code,
            },
            {
              key: "title",
              header: t("console.submittals.columns.title", undefined, "Title"),
              render: (r) => r.title,
              accessor: (r) => r.title,
            },
            {
              key: "spec",
              header: t("console.submittals.columns.spec", undefined, "Spec"),
              render: (r) => r.spec_section ?? "—",
              accessor: (r) => r.spec_section ?? null,
            },
            {
              key: "vendor",
              header: t("console.submittals.columns.vendor", undefined, "Vendor"),
              render: (r) => r.vendor?.name ?? "—",
              filterable: true,
              groupable: true,
              accessor: (r) => r.vendor?.name ?? null,
            },
            {
              key: "round",
              header: t("console.submittals.columns.round", undefined, "Round"),
              render: (r) => `#${r.current_round}`,
              mono: true,
              accessor: (r) => r.current_round ?? null,
            },
            {
              key: "due",
              header: t("console.submittals.columns.due", undefined, "Due"),
              render: (r) => fmt(r.due_at),
              mono: true,
              accessor: (r) => r.due_at ?? null,
            },
            {
              key: "status",
              header: t("console.submittals.columns.status", undefined, "Status"),
              render: (r) => (
                <span className="inline-flex items-center gap-2">
                  <Badge variant={toneFor(r.status)}>{toTitle(r.status)}</Badge>
                  <DueDateBadge dueAt={r.due_at} closedAt={r.closed_at} status={r.status} iconOnly size="sm" />
                </span>
              ),
              filterable: true,
              groupable: true,
              accessor: (r) => r.status ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
