import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PortalRail } from "@/components/Shell";
import { portalNav, portalPersonaForSession } from "@/lib/nav";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * /p/[slug]/tasks — unified "what do I owe?" inbox for portal users.
 * Aggregates open work the caller has across:
 *   - assignments.party_user_id = caller (catalog items: tickets, credentials, lodging, etc.)
 *   - proposal_approvals.approver_id = caller (decisions waiting)
 *   - new_hire_assignments.assignee_id = caller (onboarding)
 *
 * Sorted by deadline ascending; overdue surfaces a warn tone.
 */

type Item = {
  kind: "assignment" | "approval" | "onboarding";
  title: string;
  state: string;
  due: string | null;
  href: string;
};

export default async function PortalTasks({ params }: { params: Promise<{ slug: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return <div className="page-content">{t("p.shared.config.supabase", undefined, "Configure Supabase.")}</div>;
  const { slug } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const project = await projectIdFromSlug(slug);

  const items: Item[] = [];

  if (project) {
    const [{ data: assignments }, { data: proposals }, { data: onboarding }] = await Promise.all([
      supabase
        .from("assignments")
        .select("id, title, catalog_kind, fulfillment_state, deadline")
        .eq("org_id", session.orgId)
        .eq("project_id", project.id)
        .eq("party_user_id", session.userId)
        .is("deleted_at", null)
        .not("fulfillment_state", "in", "(delivered,rejected,redeemed,voided,expired,returned)"),
      supabase.from("proposals").select("id, title").eq("org_id", session.orgId).eq("project_id", project.id),
      supabase
        .from("new_hire_assignments")
        .select("id, flow_id, assignment_phase")
        .eq("org_id", session.orgId)
        .eq("assignee_id", session.userId)
        .neq("assignment_phase", "completed"),
    ]);

    for (const a of (assignments ?? []) as Array<{
      id: string;
      title: string | null;
      catalog_kind: string;
      fulfillment_state: string;
      deadline: string | null;
    }>) {
      items.push({
        kind: "assignment",
        title: `${toTitle(a.catalog_kind)}: ${a.title ?? t("p.shared.tasks.untitled", undefined, "Untitled")}`,
        state: a.fulfillment_state,
        due: a.deadline,
        href: `/p/${slug}/crew/advances`,
      });
    }

    // Proposal approvals where caller is approver + pending.
    const propIds = ((proposals ?? []) as Array<{ id: string }>).map((p) => p.id);
    if (propIds.length) {
      const { data: approvals } = await supabase
        .from("proposal_approvals")
        .select("id, proposal_id, kind, title, state, due_at")
        .eq("org_id", session.orgId)
        .in("proposal_id", propIds)
        .eq("state", "pending");
      const propMap = new Map(((proposals ?? []) as Array<{ id: string; title: string }>).map((p) => [p.id, p.title]));
      for (const a of (approvals ?? []) as Array<{
        id: string;
        proposal_id: string;
        kind: string;
        title: string | null;
        state: string;
        due_at: string | null;
      }>) {
        items.push({
          kind: "approval",
          title: `${a.title ?? a.kind}: ${propMap.get(a.proposal_id) ?? t("p.shared.tasks.proposalFallback", undefined, "Proposal")}`,
          state: a.state,
          due: a.due_at,
          href: `/p/${slug}/client/proposals/${a.proposal_id}/approvals`,
        });
      }
    }

    const flowIds = ((onboarding ?? []) as Array<{ flow_id: string }>).map((o) => o.flow_id);
    const { data: flows } = flowIds.length
      ? await supabase.from("new_hire_flows").select("id, name").in("id", flowIds)
      : { data: [] };
    const flowMap = new Map(((flows ?? []) as Array<{ id: string; name: string }>).map((f) => [f.id, f.name]));
    for (const o of (onboarding ?? []) as Array<{ id: string; flow_id: string; assignment_phase: string }>) {
      items.push({
        kind: "onboarding",
        title: flowMap.get(o.flow_id) ?? t("p.shared.tasks.onboardingFallback", undefined, "Onboarding"),
        state: o.assignment_phase,
        due: null,
        // Portal-native as of ADR-0008 Amendment 4. This used to eject to
        // /m/onboarding/[id] — out of the shell that had just listed the
        // task, and into an app the vendor persona can't open at all.
        href: `/p/${slug}/onboarding/${o.id}`,
      });
    }
  }

  // Sort by due asc, nulls last.
  items.sort((a, b) => {
    if (a.due && b.due) return a.due.localeCompare(b.due);
    if (a.due) return -1;
    if (b.due) return 1;
    return 0;
  });
  const now = Date.now();

  return (
    <div className="flex">
      <PortalRail
        group={portalNav(slug, portalPersonaForSession(session.persona))}
        title={t("p.shared.rail.title", undefined, "Portal")}
      />
      <div className="flex-1">
        <div className="page-content">
          <h1>{t("p.shared.tasks.title", undefined, "My Tasks")}</h1>
          <p className="mt-1 text-xs text-[var(--p-text-2)]">
            {t(
              "p.shared.tasks.subtitle",
              undefined,
              "Everything waiting on you for this project: advancing items, approvals, and onboarding.",
            )}
          </p>

          <ul className="mt-5 space-y-2">
            {items.length === 0 ? (
              <li>
                <EmptyState
                  size="compact"
                  title={t("p.shared.tasks.empty.title", undefined, "All Clear")}
                  description={t(
                    "p.shared.tasks.empty.description",
                    undefined,
                    "Nothing waiting on you on this project. Check your Inbox for notifications.",
                  )}
                />
              </li>
            ) : (
              items.map((it, idx) => {
                const overdue = it.due && new Date(it.due).getTime() < now;
                return (
                  <li key={idx}>
                    <Link href={it.href} className="surface flex items-start justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="muted">{toTitle(it.kind)}</Badge>
                          {overdue && (
                            <Badge variant="error">{t("p.shared.tasks.overdue", undefined, "Overdue")}</Badge>
                          )}
                        </div>
                        <div className="mt-1 truncate text-sm font-semibold">{it.title}</div>
                        <div className="font-mono text-[11px] text-[var(--p-text-2)]">
                          {it.state}
                          {it.due
                            ? ` · ${t("p.shared.tasks.duePrefix", { date: fmt.date(it.due) }, `due ${fmt.date(it.due)}`)}`
                            : ""}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
