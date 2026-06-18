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

type Row = {
  id: string;
  prequalification_state: string;
  score: number | null;
  expires_at: string | null;
  vendor: { name: string | null } | null;
  questionnaire: { name: string | null } | null;
};

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  invited: "muted",
  in_progress: "info",
  submitted: "info",
  approved: "success",
  approved_conditional: "warning",
  rejected: "error",
  expired: "muted",
};

function fmt(d: string | null): string {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString();
}

export default async function Page() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const fmtIntl = await getRequestFormatters();
  const { t } = await getRequestT();
  const { data } = await supabase
    .from("vendor_prequalifications")
    .select(
      "id, prequalification_state, score, expires_at, vendor:vendor_id(name), questionnaire:questionnaire_id(name)",
    )
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as Row[];
  const approved = rows.filter(
    (r) => r.prequalification_state === "approved" || r.prequalification_state === "approved_conditional",
  ).length;
  const open = rows.filter((r) => ["invited", "in_progress", "submitted"].includes(r.prequalification_state)).length;
  const expiringSoon = rows.filter(
    (r) => r.expires_at && new Date(r.expires_at) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  ).length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.prequalification.eyebrow", undefined, "Procurement")}
        title={t("console.procurement.prequalification.title", undefined, "Prequalification")}
        subtitle={t(
          "console.procurement.prequalification.subtitle",
          undefined,
          "Vendor vetting — insurance, safety, financials, references.",
        )}
        action={
          <div className="flex items-center gap-2">
            <Button href="/console/procurement/prequalification/questionnaires" size="sm" variant="ghost">
              {t("console.procurement.prequalification.questionnaires", undefined, "Questionnaires")}
            </Button>
            <Button href="/console/procurement/prequalification/new" size="sm">
              {t("console.procurement.prequalification.inviteVendor", undefined, "+ Invite vendor")}
            </Button>
          </div>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.procurement.prequalification.metric.approved", undefined, "Approved")}
            value={fmtIntl.number(approved)}
            accent
          />
          <MetricCard
            label={t("console.procurement.prequalification.metric.inFlight", undefined, "In Flight")}
            value={fmtIntl.number(open)}
          />
          <MetricCard
            label={t("console.procurement.prequalification.metric.expiringSoon", undefined, "Expiring < 30d")}
            value={fmtIntl.number(expiringSoon)}
          />
        </div>
        <DataTable<Row>
          rows={rows}
          /* No per-row detail route exists yet (only list/new). Rows were
             linking to /prequalification/[id], which 404s. Keep rows static
             until the detail page is built. */
          emptyLabel={t("console.procurement.prequalification.empty.label", undefined, "No prequalifications yet")}
          emptyDescription={t(
            "console.procurement.prequalification.empty.description",
            undefined,
            "Build a questionnaire, invite vendors, score answers, then gate RFQs to approved vendors.",
          )}
          emptyAction={
            <Button href="/console/procurement/prequalification/questionnaires/new" size="sm">
              {t("console.procurement.prequalification.empty.action", undefined, "+ Build questionnaire")}
            </Button>
          }
          columns={[
            {
              key: "vendor",
              header: t("console.procurement.prequalification.col.vendor", undefined, "Vendor"),
              render: (r) => r.vendor?.name ?? "—",
              filterable: true,
              groupable: true,
              accessor: (r) => r.vendor?.name ?? null,
            },
            {
              key: "q",
              header: t("console.procurement.prequalification.col.questionnaire", undefined, "Questionnaire"),
              render: (r) => r.questionnaire?.name ?? "—",
              accessor: (r) => r.questionnaire?.name ?? null,
            },
            {
              key: "score",
              header: t("console.procurement.prequalification.col.score", undefined, "Score"),
              render: (r) => (r.score != null ? Number(r.score).toFixed(1) : "—"),
              className: "font-mono text-xs",
              accessor: (r) => r.score ?? null,
            },
            {
              key: "exp",
              header: t("console.procurement.prequalification.col.expires", undefined, "Expires"),
              render: (r) => fmt(r.expires_at),
              className: "font-mono text-xs",
              accessor: (r) => r.expires_at ?? null,
            },
            {
              key: "status",
              header: t("console.procurement.prequalification.col.status", undefined, "Status"),
              render: (r) => (
                <Badge variant={STATUS_TONE[r.prequalification_state] ?? "muted"}>
                  {toTitle(r.prequalification_state)}
                </Badge>
              ),
              filterable: true,
              groupable: true,
              accessor: (r) => r.prequalification_state ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
