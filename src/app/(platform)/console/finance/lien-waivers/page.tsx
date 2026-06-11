import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { countOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

type WaiverState = "drafted" | "sent" | "signed" | "returned" | "released" | "voided";
type WaiverType = "conditional" | "unconditional";
type WaiverScope = "partial" | "final";

type Row = {
  id: string;
  waiver_type: WaiverType;
  waiver_scope: WaiverScope;
  waiver_state: WaiverState;
  amount: number;
  through_date: string | null;
  state_jurisdiction: string | null;
  signed_at: string | null;
  created_at: string;
  project: { name: string | null } | null;
  vendor: { name: string | null } | null;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.finance.lienWaivers.eyebrow", undefined, "Finance")}
          title={t("console.finance.lienWaivers.title", undefined, "Lien Waivers")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.finance.lienWaivers.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();

  // Table rows stay capped at 300; the header/metric counts come from an
  // exact count + a narrow uncapped state query so they don't truncate
  // once an org passes the cap.
  const [{ data }, totalCount, { data: stateData }] = await Promise.all([
    supabase
      .from("lien_waivers")
      .select(
        "id, waiver_type, waiver_scope, waiver_state, amount, through_date, state_jurisdiction, signed_at, created_at, project:project_id(name), vendor:vendor_id(name)",
      )
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(300),
    countOrgScoped("lien_waivers", session.orgId),
    supabase.from("lien_waivers").select("waiver_state").eq("org_id", session.orgId).is("deleted_at", null),
  ]);

  const rows = (data ?? []) as unknown as Row[];
  const states = (stateData ?? []) as unknown as Array<{ waiver_state: WaiverState }>;

  const outstandingCount = states.filter((r) => ["drafted", "sent"].includes(r.waiver_state)).length;
  const signedCount = states.filter((r) => r.waiver_state === "signed" || r.waiver_state === "returned").length;
  const releasedCount = states.filter((r) => r.waiver_state === "released").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.lienWaivers.eyebrow", undefined, "Finance")}
        title={t("console.finance.lienWaivers.title", undefined, "Lien Waivers")}
        subtitle={t(
          "console.finance.lienWaivers.subtitle",
          {
            total: totalCount,
            waiverLabel:
              totalCount === 1
                ? t("console.finance.lienWaivers.waiverSingular", undefined, "Waiver")
                : t("console.finance.lienWaivers.waiverPlural", undefined, "Waivers"),
            outstanding: outstandingCount,
            signed: signedCount,
            released: releasedCount,
          },
          `${totalCount} ${totalCount === 1 ? "Waiver" : "Waivers"} · ${outstandingCount} Outstanding · ${signedCount} Signed · ${releasedCount} Released`,
        )}
        action={
          <Button href="/console/finance/lien-waivers/new" size="sm">
            {t("console.finance.lienWaivers.newWaiver", undefined, "+ New Waiver")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-4">
          <MetricCard
            label={t("console.finance.lienWaivers.metric.total", undefined, "Total")}
            value={fmt.number(totalCount)}
            accent
          />
          <MetricCard
            label={t("console.finance.lienWaivers.metric.outstanding", undefined, "Outstanding")}
            value={fmt.number(outstandingCount)}
          />
          <MetricCard
            label={t("console.finance.lienWaivers.metric.signed", undefined, "Signed")}
            value={fmt.number(signedCount)}
          />
          <MetricCard
            label={t("console.finance.lienWaivers.metric.released", undefined, "Released")}
            value={fmt.number(releasedCount)}
          />
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/finance/lien-waivers/${r.id}`}
          emptyLabel={t("console.finance.lienWaivers.empty.label", undefined, "No lien waivers yet")}
          emptyDescription={t(
            "console.finance.lienWaivers.empty.description",
            undefined,
            "Statutory waivers — conditional/unconditional × partial/final. Collected from subs against pay-apps; release blocked until signed.",
          )}
          emptyAction={
            <Button href="/console/finance/lien-waivers/new" size="sm">
              {t("console.finance.lienWaivers.newWaiver", undefined, "+ New Waiver")}
            </Button>
          }
          columns={[
            {
              key: "type",
              header: t("console.finance.lienWaivers.column.type", undefined, "Type"),
              render: (r) => (
                <span className="text-xs">
                  {toTitle(r.waiver_type)} · {toTitle(r.waiver_scope)}
                </span>
              ),
              accessor: (r) => `${r.waiver_type}/${r.waiver_scope}`,
              filterable: true,
              groupable: true,
            },
            {
              key: "vendor",
              header: t("console.finance.lienWaivers.column.vendor", undefined, "Sub / Vendor"),
              render: (r) => r.vendor?.name ?? "—",
              accessor: (r) => r.vendor?.name ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "project",
              header: t("console.finance.lienWaivers.column.project", undefined, "Project"),
              render: (r) => r.project?.name ?? "—",
              accessor: (r) => r.project?.name ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "amount",
              header: t("console.finance.lienWaivers.column.amount", undefined, "Amount"),
              render: (r) => fmt.money(Math.round(Number(r.amount) * 100)),
              accessor: (r) => Number(r.amount),
              className: "font-mono text-xs text-right",
            },
            {
              key: "through",
              header: t("console.finance.lienWaivers.column.through", undefined, "Through"),
              render: (r) =>
                r.through_date ? fmt.dateParts(r.through_date + "T00:00:00", { month: "short", day: "numeric" }) : "—",
              accessor: (r) => r.through_date,
              className: "font-mono text-xs",
            },
            {
              key: "state",
              header: t("console.finance.lienWaivers.column.state", undefined, "State"),
              render: (r) => <Badge variant={toneFor(r.waiver_state)}>{toTitle(r.waiver_state)}</Badge>,
              accessor: (r) => r.waiver_state,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
