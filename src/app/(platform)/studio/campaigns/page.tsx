import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { PagerNav } from "@/components/ui/PagerNav";
import { requireSession } from "@/lib/auth";
import { listOrgScopedPage } from "@/lib/db/resource";
import { parsePage } from "@/lib/db/pagination";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";
import type { Campaign } from "@/lib/supabase/types";
import { toTitle } from "@/lib/format";
import { toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
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
  const sp = await searchParams;
  const { page, offset, pageSize } = parsePage(sp);
  const result = await listOrgScopedPage("campaigns", session.orgId, {
    orderBy: "starts_on",
    ascending: false,
    pageSize,
    cursor: String(offset),
  });
  const rows = result.rows as Campaign[];
  const total = result.totalCount;

  const live = rows.filter((r) => r.campaign_state === "live").length;
  // HP-14: campaigns.spent_cents has no writer anywhere (no trigger, no app
  // code — the sync_campaign_spent() its column comment names does not
  // exist), so every row is frozen at 0. Rendering it as "spent" money was
  // dishonest; the header and column now show budget only.
  const totalBudget = rows.reduce((s, r) => s + (r.budget_cents ?? 0), 0);

  const campaignNoun = t(
    total === 1 ? "console.campaigns.nounSingular" : "console.campaigns.nounPlural",
    undefined,
    total === 1 ? "Campaign" : "Campaigns",
  );
  const liveLabel = t("console.campaigns.liveLabel", undefined, "Live");
  const budgetedLabel = t("console.campaigns.budgetedLabel", undefined, "Budgeted");

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.campaigns.eyebrow", undefined, "Workspace")}
        title={t("console.campaigns.title", undefined, "Campaigns")}
        subtitle={`${total} ${campaignNoun} · ${live} ${liveLabel} · ${formatMoney(totalBudget)} ${budgetedLabel}`}
        action={
          <Button href="/studio/campaigns/new" size="sm">
            {t("console.campaigns.newCampaign", undefined, "+ New Campaign")}
          </Button>
        }
      />
      <div className="page-content space-y-3">
        <DataTable<Campaign>
          rows={rows}
          totalCount={total}
          emptyLabel={t("console.campaigns.emptyLabel", undefined, "No campaigns")}
          emptyDescription={t(
            "console.campaigns.emptyDescription",
            undefined,
            "Marketing + comms campaigns live here. Author one per launch, ticket window, or stakeholder push. Channel + kind drive segmentation.",
          )}
          emptyAction={
            <Button href="/studio/campaigns/new" size="sm">
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
              render: (r) => formatMoney(r.budget_cents),
              className: "font-mono text-xs",
              accessor: (r) => Number(r.budget_cents ?? 0),
            },
            {
              key: "campaign_state",
              header: t("console.campaigns.columns.campaign_state", undefined, "Status"),
              render: (r) => <Badge variant={toneFor(r.campaign_state)}>{toTitle(r.campaign_state)}</Badge>,
              accessor: (r) => r.campaign_state ?? null,
              filterable: true,
              groupable: true,
            },
          ]}
        />
        <PagerNav
          page={page}
          total={total}
          pageSize={pageSize}
          basePath="/studio/campaigns"
          searchParams={sp}
        />
      </div>
    </>
  );
}
