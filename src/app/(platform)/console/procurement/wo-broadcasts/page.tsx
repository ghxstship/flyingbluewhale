import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  code: string;
  title: string;
  status: string;
  budget_cents: number | null;
  needed_by: string | null;
  awarded_to: { name: string | null } | null;
  project: { name: string | null } | null;
};

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  draft: "muted",
  open: "info",
  closed: "muted",
  awarded: "success",
  cancelled: "error",
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
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("work_order_broadcasts")
    .select(
      "id, code, title, status, budget_cents, needed_by, awarded_to:awarded_to_vendor_id(name), project:project_id(name)",
    )
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as unknown as Row[];
  const open = rows.filter((r) => r.status === "open").length;
  const awarded = rows.filter((r) => r.status === "awarded").length;

  return (
    <>
      <ModuleHeader
        eyebrow="Procurement"
        title="Work Order Broadcasts"
        subtitle="Open vendor-pool requests for last-minute needs. First qualified responder accepts."
        action={
          <Button href="/console/procurement/wo-broadcasts/new" size="sm">
            + New broadcast
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Open" value={open.toLocaleString()} accent />
          <MetricCard label="Awarded" value={awarded.toLocaleString()} />
          <MetricCard label="Total" value={rows.length.toLocaleString()} />
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/procurement/wo-broadcasts/${r.id}`}
          emptyLabel="No broadcasts yet"
          emptyDescription="Use this for emergency / last-minute needs (extra security, replacement gear). Posted to vendor pool, accepted by first qualified responder."
          emptyAction={
            <Button href="/console/procurement/wo-broadcasts/new" size="sm">
              + New broadcast
            </Button>
          }
          columns={[
            { key: "code", header: "Code", render: (r) => r.code, className: "font-mono text-xs" },
            { key: "title", header: "Title", render: (r) => r.title },
            { key: "project", header: "Project", render: (r) => r.project?.name ?? "—" },
            {
              key: "budget",
              header: "Budget",
              render: (r) => (r.budget_cents ? formatMoney(r.budget_cents) : "—"),
              className: "font-mono text-xs",
            },
            { key: "needed", header: "Needed by", render: (r) => fmt(r.needed_by), className: "font-mono text-xs" },
            { key: "awarded", header: "Awarded to", render: (r) => r.awarded_to?.name ?? "—" },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{r.status}</Badge>,
            },
          ]}
        />
      </div>
    </>
  );
}
