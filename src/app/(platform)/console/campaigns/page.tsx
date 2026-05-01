import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import type { Campaign } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<Campaign["status"], "muted" | "info" | "success" | "warning" | "error"> = {
  draft: "muted",
  scheduled: "info",
  live: "success",
  paused: "warning",
  complete: "success",
  cancelled: "error",
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Console" title="Campaigns" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const rows = (await listOrgScoped("campaigns", session.orgId, {
    orderBy: "starts_on",
    ascending: false,
    limit: 500,
  })) as Campaign[];

  const live = rows.filter((r) => r.status === "live").length;
  const totalBudget = rows.reduce((s, r) => s + (r.budget_cents ?? 0), 0);
  const totalSpent = rows.reduce((s, r) => s + (r.spent_cents ?? 0), 0);

  return (
    <>
      <ModuleHeader
        eyebrow="Console"
        title="Campaigns"
        subtitle={`${rows.length} campaign${rows.length === 1 ? "" : "s"} · ${live} live · ${formatMoney(totalSpent)} of ${formatMoney(totalBudget)} spent`}
        action={
          <Button href="/console/campaigns/new" size="sm">
            + New Campaign
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<Campaign>
          rows={rows}
          emptyLabel="No campaigns"
          emptyDescription="Marketing + comms campaigns live here. Author one per launch, ticket window, or stakeholder push — channel + kind drive segmentation."
          emptyAction={
            <Button href="/console/campaigns/new" size="sm">
              + New Campaign
            </Button>
          }
          columns={[
            { key: "name", header: "Name", render: (r) => r.name, accessor: (r) => r.name },
            {
              key: "channel",
              header: "Channel",
              render: (r) => <Badge variant="muted">{r.channel}</Badge>,
              accessor: (r) => r.channel ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "kind",
              header: "Kind",
              render: (r) => r.kind,
              accessor: (r) => r.kind,
              filterable: true,
              groupable: true,
            },
            {
              key: "window",
              header: "Window",
              render: (r) => `${r.starts_on ?? "?"} → ${r.ends_on ?? "?"}`,
              className: "font-mono text-xs",
              accessor: (r) => r.starts_on ?? null,
            },
            {
              key: "budget",
              header: "Budget",
              render: (r) => `${formatMoney(r.spent_cents)} / ${formatMoney(r.budget_cents)}`,
              className: "font-mono text-xs",
              accessor: (r) => Number(r.spent_cents ?? 0),
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge variant={STATUS_TONE[r.status]}>{r.status}</Badge>,
              accessor: (r) => r.status ?? null,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
