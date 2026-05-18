import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { formatMoney } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

/**
 * Promoter co-pro splits — the deal terms across talent_offers on this
 * project. Walkout split %, headline fee, guarantee. Read-only here;
 * the canonical authoring surface lives on /console/bookings/deals.
 */

type Offer = {
  id: string;
  talent_profile_id: string | null;
  guarantee_cents: number | null;
  door_pct: number | null;
  status: string;
  currency: string | null;
  performance_date: string | null;
};

export default async function PromoterCoPro({ params }: { params: Promise<{ slug: string }> }) {
  if (!hasSupabase) return <div className="page-content">Configure Supabase.</div>;
  const { slug } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const project = await projectIdFromSlug(slug);

  const { data } = project
    ? await supabase
        .from("talent_offers")
        .select("id, talent_profile_id, guarantee_cents, door_pct, status, currency, performance_date")
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
    ((profiles ?? []) as Array<{ id: string; act_name: string | null }>).map((p) => [p.id, p.act_name ?? "Untitled"]),
  );

  return (
    <div className="flex min-h-screen">
      <PortalRail items={portalNav(slug, "promoter")} title="Promoter" />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-semibold">Co-Pro Splits</h1>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Deal terms across the talent offers on {project?.name ?? "this project"}.
        </p>

        {rows.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              size="compact"
              title="No Deals Yet"
              description="Once talent offers are signed, the guarantee + split show up here."
            />
          </div>
        ) : (
          <table className="data-table mt-5 w-full text-sm">
            <thead>
              <tr>
                <th>Talent</th>
                <th>Show Date</th>
                <th>Guarantee</th>
                <th>Door %</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td>{o.talent_profile_id ? (profileMap.get(o.talent_profile_id) ?? "—") : "—"}</td>
                  <td className="font-mono text-xs">{o.performance_date ? fmt.date(o.performance_date) : "—"}</td>
                  <td className="font-mono text-xs">
                    {o.guarantee_cents != null
                      ? formatMoney(o.guarantee_cents)
                      : "—"}
                  </td>
                  <td className="font-mono text-xs">{o.door_pct != null ? `${o.door_pct}%` : "—"}</td>
                  <td>
                    <Badge variant={o.status === "contracted" ? "success" : "info"}>{o.status}</Badge>
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
