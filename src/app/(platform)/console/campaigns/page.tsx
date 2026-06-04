import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";
import type { Campaign } from "@/lib/supabase/types";
import { toTitle } from "@/lib/format";

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
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.campaigns.eyebrow", undefined, "Workspace")}
          title={t("console.campaigns.title", undefined, "Campaigns")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.campaigns.configureSupabase", undefined, "Configure Supabase.")}
          </div>
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

  const campaignNoun = t(
    rows.length === 1 ? "console.campaigns.nounSingular" : "console.campaigns.nounPlural",
    undefined,
    rows.length === 1 ? "Campaign" : "Campaigns",
  );
  const liveLabel = t("console.campaigns.liveLabel", undefined, "Live");
  const ofLabel = t("console.campaigns.ofLabel", undefined, "of");
  const spentLabel = t("console.campaigns.spentLabel", undefined, "Spent");

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.campaigns.eyebrow", undefined, "Workspace")}
        title={t("console.campaigns.title", undefined, "Campaigns")}
        subtitle={`${rows.length} ${campaignNoun} · ${live} ${liveLabel} · ${formatMoney(totalSpent)} ${ofLabel} ${formatMoney(totalBudget)} ${spentLabel}`}
        action={
          <Button href="/console/campaigns/new" size="sm">
            {t("console.campaigns.newCampaign", undefined, "+ New Campaign")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<Campaign>
          rows={rows}
          emptyLabel={t("console.campaigns.emptyLabel", undefined, "No campaigns")}
          emptyDescription={t(
            "console.campaigns.emptyDescription",
            undefined,
            "Marketing + comms campaigns live here. Author one per launch, ticket window, or stakeholder push — channel + kind drive segmentation.",
          )}
          emptyAction={
            <Button href="/console/campaigns/new" size="sm">
              {t("console.campaigns.newCampaign", undefined, "+ New Campaign")}
            </Button>
          }
          columns={[
            {
              key: "name",
              header: t("console.campaigns.columns.name", undefined, "Name"),
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "channel",
              header: t("console.campaigns.columns.channel", undefined, "Channel"),
              render: (r) => <Badge variant="muted">{r.channel}</Badge>,
              accessor: (r) => r.channel ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "kind",
              header: t("console.campaigns.columns.kind", undefined, "Kind"),
              render: (r) => r.kind,
              accessor: (r) => r.kind,
              filterable: true,
              groupable: true,
            },
            {
              key: "window",
              header: t("console.campaigns.columns.window", undefined, "Window"),
              render: (r) => `${r.starts_on ?? "?"} → ${r.ends_on ?? "?"}`,
              className: "font-mono text-xs",
              accessor: (r) => r.starts_on ?? null,
            },
            {
              key: "budget",
              header: t("console.campaigns.columns.budget", undefined, "Budget"),
              render: (r) => `${formatMoney(r.spent_cents)} / ${formatMoney(r.budget_cents)}`,
              className: "font-mono text-xs",
              accessor: (r) => Number(r.spent_cents ?? 0),
            },
            {
              key: "status",
              header: t("console.campaigns.columns.status", undefined, "Status"),
              render: (r) => <Badge variant={STATUS_TONE[r.status]}>{toTitle(r.status)}</Badge>,
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
