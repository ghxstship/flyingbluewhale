import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * Promoter co-pro splits — the deal terms across talent_offers on this
 * project. Walkout split %, headline fee, guarantee. Read-only here;
 * the canonical authoring surface lives on /studio/bookings/deals.
 */

type Offer = {
  id: string;
  talent_profile_id: string | null;
  guarantee_cents: number | null;
  door_pct: number | null;
  talent_offer_state: string;
  currency: string | null;
  performance_date: string | null;
};

export default async function PromoterCoPro({ params }: { params: Promise<{ slug: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return <div className="page-content">{t("common.configureSupabase", undefined, "Configure Supabase.")}</div>;
  const { slug } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const project = await projectIdFromSlug(slug);

  const { data } = project
    ? await supabase
        .from("talent_offers")
        .select("id, talent_profile_id, guarantee_cents, door_pct, talent_offer_state, currency, performance_date")
        .eq("org_id", session.orgId)
        .eq("project_id", project.id)
        .order("performance_date", { ascending: true, nullsFirst: false })
    : { data: [] };
  const rows = (data ?? []) as Offer[];

  // Hydrate talent names from talent_profiles.
  const profileIds = Array.from(new Set(rows.map((r) => r.talent_profile_id).filter((p): p is string => !!p)));
  const { data: profiles } = profileIds.length
    ? await supabase.from("talent_profiles").select("id, act_name").in("id", profileIds)
    : { data: [] };
  const profileMap = new Map(
    ((profiles ?? []) as Array<{ id: string; act_name: string | null }>).map((p) => [
      p.id,
      p.act_name ?? t("common.untitled", undefined, "Untitled"),
    ]),
  );

  return (
    <div className="flex min-h-screen">
      <PortalRail group={portalNav(slug, "promoter")} />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-semibold">{t("p.promoter.coPro.title", undefined, "Co-Pro Splits")}</h1>
        <p className="mt-1 text-xs text-[var(--p-text-2)]">
          {t(
            "p.promoter.coPro.subtitle",
            { project: project?.name ?? t("p.promoter.coPro.thisProject", undefined, "this project") },
            "Deal terms across the talent offers on {project}.",
          )}
        </p>

        {rows.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              size="compact"
              title={t("p.promoter.coPro.empty.title", undefined, "No Deals Yet")}
              description={t(
                "p.promoter.coPro.empty.description",
                undefined,
                "Once talent offers are signed, the guarantee + split show up here.",
              )}
            />
          </div>
        ) : (
          <table className="ps-table mt-5 w-full text-sm">
            <thead>
              <tr>
                <th>{t("p.promoter.coPro.col.talent", undefined, "Talent")}</th>
                <th>{t("p.promoter.coPro.col.showDate", undefined, "Show Date")}</th>
                <th>{t("p.promoter.coPro.col.guarantee", undefined, "Guarantee")}</th>
                <th>{t("p.promoter.coPro.col.doorPct", undefined, "Door %")}</th>
                <th>{t("p.promoter.coPro.col.talent_offer_state", undefined, "Status")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td>{o.talent_profile_id ? (profileMap.get(o.talent_profile_id) ?? "—") : "—"}</td>
                  <td className="font-mono text-xs">{o.performance_date ? fmt.date(o.performance_date) : "—"}</td>
                  <td className="font-mono text-xs">
                    {o.guarantee_cents != null ? fmt.money(o.guarantee_cents, o.currency ?? "USD") : "—"}
                  </td>
                  <td className="font-mono text-xs">{o.door_pct != null ? `${o.door_pct}%` : "—"}</td>
                  <td>
                    <Badge variant={o.talent_offer_state === "contracted" ? "success" : "info"}>
                      {toTitle(o.talent_offer_state)}
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
