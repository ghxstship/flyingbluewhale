import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { projectIdFromSlug } from "@/lib/db/advancing";

export const dynamic = "force-dynamic";

type Campaign = {
  id: string;
  name: string;
  channel: string | null;
  status: string;
  starts_on: string | null;
  ends_on: string | null;
  spent_cents: number | null;
};

export default async function PromoterMarketing({ params }: { params: Promise<{ slug: string }> }) {
  if (!hasSupabase) return <div className="page-content">Configure Supabase.</div>;
  const { slug } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const project = await projectIdFromSlug(slug);

  // campaigns are org-scoped — no project_id column. The promoter
  // typically only has visibility into a single project's org via
  // their share-link, so all active campaigns are relevant.
  const { data } = await supabase
    .from("campaigns")
    .select("id, name, channel, status, starts_on, ends_on, spent_cents")
    .eq("org_id", session.orgId)
    .order("starts_on", { ascending: true, nullsFirst: false });
  const rows = (data ?? []) as Campaign[];

  return (
    <div className="flex min-h-screen">
      <PortalRail items={portalNav(slug, "promoter")} title="Promoter" />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-semibold">Marketing Milestones</h1>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Onsale, presale, and ad-drop campaigns for {project?.name ?? "this project"}.
        </p>

        {rows.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              size="compact"
              title="No Campaigns"
              description="Promotional campaigns the marketing team launches on this project show up here."
            />
          </div>
        ) : (
          <table className="data-table mt-5 w-full text-sm">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Channel</th>
                <th>Dates</th>
                <th>Spend</th>
                <th>Status</th>
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
                  <td className="font-mono text-xs">
                    {c.spent_cents != null
                      ? (c.spent_cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })
                      : "—"}
                  </td>
                  <td>
                    <Badge variant={c.status === "live" ? "success" : c.status === "scheduled" ? "info" : "muted"}>
                      {c.status}
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
