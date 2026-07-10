import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { projectIdFromSlug } from "@/lib/db/advancing";

export const dynamic = "force-dynamic";

type Campaign = {
  id: string;
  name: string;
  channel: string | null;
  campaign_state: string;
  starts_on: string | null;
  ends_on: string | null;
};

export default async function PromoterMarketing({ params }: { params: Promise<{ slug: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="page-content">
        {t("p.promoter.marketing.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  const { slug } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const project = await projectIdFromSlug(slug);

  // campaigns are org-scoped — no project_id column. The promoter
  // typically only has visibility into a single project's org via
  // their share-link, so all active campaigns are relevant.
  // HP-14: campaigns.spent_cents is a dead denorm — nothing in the app or DB
  // ever writes it (the sync_campaign_spent() its column comment names does
  // not exist), so it is frozen at 0. Rendering it as money showed promoters
  // a fake $0.00 spend; the column is no longer read and the Spend cell says
  // "Not tracked" until a real spend source lands.
  const { data } = await supabase
    .from("campaigns")
    .select("id, name, channel, campaign_state, starts_on, ends_on")
    .eq("org_id", session.orgId)
    .order("starts_on", { ascending: true, nullsFirst: false });
  const rows = (data ?? []) as Campaign[];

  return (
    <div className="flex min-h-screen">
      <PortalRail group={portalNav(slug, "promoter")} />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-semibold">{t("p.promoter.marketing.title", undefined, "Marketing Milestones")}</h1>
        <p className="mt-1 text-xs text-[var(--p-text-2)]">
          {t(
            "p.promoter.marketing.subtitle",
            { projectName: project?.name ?? t("p.promoter.marketing.thisProject", undefined, "this project") },
            `Onsale, presale, and ad-drop campaigns for ${project?.name ?? "this project"}.`,
          )}
        </p>

        {rows.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              size="compact"
              title={t("p.promoter.marketing.empty.title", undefined, "No Campaigns")}
              description={t(
                "p.promoter.marketing.empty.description",
                undefined,
                "Promotional campaigns the marketing team launches on this project show up here.",
              )}
            />
          </div>
        ) : (
          <table className="ps-table mt-5 w-full text-sm">
            <thead>
              <tr>
                <th>{t("p.promoter.marketing.table.campaign", undefined, "Campaign")}</th>
                <th>{t("p.promoter.marketing.table.channel", undefined, "Channel")}</th>
                <th>{t("p.promoter.marketing.table.dates", undefined, "Dates")}</th>
                <th>{t("p.promoter.marketing.table.spend", undefined, "Spend")}</th>
                <th>{t("p.promoter.marketing.table.campaign_state", undefined, "Status")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.channel ?? "—"}</td>
                  <td className="font-mono text-xs">
                    {c.starts_on ? fmt.date(c.starts_on) : "—"}
                    {c.ends_on ? ` → ${fmt.date(c.ends_on)}` : ""}
                  </td>
                  <td className="text-xs text-[var(--p-text-2)]">
                    {t("p.promoter.marketing.spendNotTracked", undefined, "Not tracked")}
                  </td>
                  <td>
                    <Badge
                      variant={
                        c.campaign_state === "live" ? "success" : c.campaign_state === "scheduled" ? "info" : "muted"
                      }
                    >
                      {c.campaign_state}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
