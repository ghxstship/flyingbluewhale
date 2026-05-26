import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

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

const STATE_TONE: Record<WaiverState, "muted" | "info" | "warning" | "success" | "error"> = {
  drafted: "muted",
  sent: "info",
  signed: "info",
  returned: "warning",
  released: "success",
  voided: "error",
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Finance" title="Lien Waivers" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("lien_waivers")
    .select(
      "id, waiver_type, waiver_scope, waiver_state, amount, through_date, state_jurisdiction, signed_at, created_at, project:project_id(name), vendor:vendor_id(name)",
    )
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(300);

  const rows = (data ?? []) as unknown as Row[];

  const outstandingCount = rows.filter((r) => ["drafted", "sent"].includes(r.waiver_state)).length;
  const signedCount = rows.filter((r) => r.waiver_state === "signed" || r.waiver_state === "returned").length;
  const releasedCount = rows.filter((r) => r.waiver_state === "released").length;

  return (
    <>
      <ModuleHeader
        eyebrow="Finance"
        title="Lien Waivers"
        subtitle={`${rows.length} Waiver${rows.length === 1 ? "" : "s"} · ${outstandingCount} Outstanding · ${signedCount} Signed · ${releasedCount} Released`}
        action={
          <Button href="/console/finance/lien-waivers/new" size="sm">
            + New Waiver
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-4">
          <MetricCard label="Total" value={fmt.number(rows.length)} accent />
          <MetricCard label="Outstanding" value={fmt.number(outstandingCount)} />
          <MetricCard label="Signed" value={fmt.number(signedCount)} />
          <MetricCard label="Released" value={fmt.number(releasedCount)} />
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/finance/lien-waivers/${r.id}`}
          emptyLabel="No lien waivers yet"
          emptyDescription="Statutory waivers — conditional/unconditional × partial/final. Collected from subs against pay-apps; release blocked until signed."
          emptyAction={
            <Button href="/console/finance/lien-waivers/new" size="sm">
              + New Waiver
            </Button>
          }
          columns={[
            {
              key: "type",
              header: "Type",
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
              header: "Sub / Vendor",
              render: (r) => r.vendor?.name ?? "—",
              accessor: (r) => r.vendor?.name ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "project",
              header: "Project",
              render: (r) => r.project?.name ?? "—",
              accessor: (r) => r.project?.name ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "amount",
              header: "Amount",
              render: (r) => fmt.money(Math.round(Number(r.amount) * 100)),
              accessor: (r) => Number(r.amount),
              className: "font-mono text-xs text-right",
            },
            {
              key: "through",
              header: "Through",
              render: (r) =>
                r.through_date ? fmt.dateParts(r.through_date + "T00:00:00", { month: "short", day: "numeric" }) : "—",
              accessor: (r) => r.through_date,
              className: "font-mono text-xs",
            },
            {
              key: "state",
              header: "State",
              render: (r) => <Badge variant={STATE_TONE[r.waiver_state]}>{toTitle(r.waiver_state)}</Badge>,
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
