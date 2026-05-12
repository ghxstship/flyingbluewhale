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

/**
 * Promoter approvals — proposal_approvals (sign-off ceremonies) across
 * the project's proposals. Shows state across the whole table since the
 * sign-off identity is captured at sign time, not pre-assigned. Pending
 * rows are highlighted; the actual signature ceremony happens on the
 * proposal-side flow (/p/[slug]/client/proposals/[id]/approvals).
 */

type Approval = {
  id: string;
  proposal_id: string;
  kind: string;
  title: string | null;
  state: string;
  due_at: string | null;
  created_at: string;
};

export default async function PromoterApprovals({ params }: { params: Promise<{ slug: string }> }) {
  if (!hasSupabase) return <div className="page-content">Configure Supabase.</div>;
  const { slug } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const project = await projectIdFromSlug(slug);

  const { data: proposals } = project
    ? await supabase.from("proposals").select("id, title").eq("org_id", session.orgId).eq("project_id", project.id)
    : { data: [] };
  const propMap = new Map(((proposals ?? []) as Array<{ id: string; title: string }>).map((p) => [p.id, p.title]));
  const propIds = Array.from(propMap.keys());

  const { data } = propIds.length
    ? await supabase
        .from("proposal_approvals")
        .select("id, proposal_id, kind, title, state, due_at, created_at")
        .eq("org_id", session.orgId)
        .in("proposal_id", propIds)
        .order("created_at", { ascending: false })
    : { data: [] };
  const rows = (data ?? []) as Approval[];
  const pending = rows.filter((r) => r.state === "pending");

  return (
    <div className="flex min-h-screen">
      <PortalRail items={portalNav(slug, "promoter")} title="Promoter" />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-semibold">Approvals</h1>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {pending.length} pending decision{pending.length === 1 ? "" : "s"} across this project&apos;s proposals.
        </p>

        <ul className="mt-5 space-y-2">
          {rows.length === 0 ? (
            <li>
              <EmptyState
                size="compact"
                title="Nothing Pending"
                description="Once a proposal routes a signature ceremony, it appears here."
              />
            </li>
          ) : (
            rows.map((a) => (
              <li key={a.id} className="surface p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">
                      {propMap.get(a.proposal_id) ?? "Proposal"} — {a.title ?? a.kind}
                    </div>
                    <div className="font-mono text-[10px] text-[var(--text-muted)]">
                      {a.kind} · {fmt.date(a.created_at)}
                      {a.due_at ? ` · due ${fmt.date(a.due_at)}` : ""}
                    </div>
                  </div>
                  <Badge variant={a.state === "signed" ? "success" : a.state === "declined" ? "error" : "warning"}>
                    {a.state}
                  </Badge>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
