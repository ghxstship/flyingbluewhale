import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { listSubscriptions, type Subscription } from "@/lib/subscriptions";
import { timeAgo, toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SubscriptionsPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title="Subscriptions" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const rows = await listSubscriptions(session.orgId);
  const active = rows.filter((r) => r.state === "ACTIVE" || r.state === "RENEWED").length;
  const trial = rows.filter((r) => r.state === "TRIAL").length;
  const lapsed = rows.filter((r) => r.state === "LAPSED").length;

  return (
    <>
      <ModuleHeader
        eyebrow="Membership"
        title="Subscriptions"
        subtitle={`${rows.length} Total · ${active} Active  · ${trial} trial · ${lapsed} lapsed`}
        action={<Button href="/console/subscriptions/new">+ New Subscription</Button>}
      />
      <div className="page-content">
        <DataTable<Subscription>
          rows={rows}
          rowHref={(r) => `/console/subscriptions/${r.id}`}
          columns={[
            { key: "label", header: "Label", render: (r) => r.label, accessor: (r) => r.label },
            {
              key: "kind",
              header: "Kind",
              render: (r) => <Badge variant="default">{toTitle(r.kind)}</Badge>,
              accessor: (r) => r.kind,
            },
            {
              key: "state",
              header: "State",
              render: (r) => <Badge variant={badgeVariantForState(r.state)}>{toTitle(r.state)}</Badge>,
              accessor: (r) => r.state,
            },
            {
              key: "cadence",
              header: "Cadence",
              render: (r) => (r.renewal_cadence_months ? `${r.renewal_cadence_months}mo` : "—"),
              className: "font-mono text-xs",
              accessor: (r) => r.renewal_cadence_months ?? null,
            },
            {
              key: "started",
              header: "Started",
              render: (r) => (r.started_at ? timeAgo(r.started_at) : "—"),
              className: "text-xs text-[var(--text-secondary)]",
              accessor: (r) => r.started_at,
            },
          ]}
          emptyLabel="No subscriptions yet"
          emptyDescription="Track recurring relationships — members, retainers, recurring sponsors. Stripe webhook events advance state automatically."
        />
      </div>
    </>
  );
}

function badgeVariantForState(state: Subscription["state"]): "default" | "success" | "warning" | "error" | "muted" {
  switch (state) {
    case "ACTIVE":
    case "RENEWED":
    case "REACTIVATED":
      return "success";
    case "TRIAL":
    case "PROSPECT":
      return "default";
    case "LAPSED":
      return "warning";
    case "CHURNED":
      return "error";
    case "ARCHIVED":
      return "muted";
    default:
      return "default";
  }
}
