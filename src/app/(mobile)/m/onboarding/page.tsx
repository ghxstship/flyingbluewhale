import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { KIcon } from "@/components/mobile/kit";
import { listMyAssignments } from "@/lib/db/assignments";
import { OnboardingView, type OnboardingItem } from "./OnboardingView";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Onboarding — the caller's new-hire flows, rebuilt to the kit.
 * Reads `new_hire_assignments` (+ flow name) for this user; each row opens the
 * `[assignmentId]` detail where steps are completed and the flow finalized.
 * The list is rendered by `OnboardingView` on the kit view engine; the
 * live-packet banner stays above it (a one-off, not a list row).
 */
type Assignment = {
  id: string;
  flow_id: string;
  assignment_phase: string | null;
  assigned_at: string | null;
  completed_at: string | null;
};

type Flow = { id: string; name: string | null; description: string | null };

export default async function MobileOnboardingPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();

  // The new-hire assignments and the caller's advancing assignments are
  // independent reads — fire them together. Their dependent lookups (flow
  // names · live packets) then resolve in a second parallel round.
  const [{ data: assignments }, myAssignments] = await Promise.all([
    supabase
      .from("new_hire_assignments")
      .select("id, flow_id, assignment_phase, assigned_at, completed_at")
      .eq("org_id", session.orgId)
      .eq("assignee_id", session.userId)
      .order("assigned_at", { ascending: false })
      .limit(100),
    listMyAssignments(session.orgId, session.userId),
  ]);
  const rows = (assignments ?? []) as Assignment[];

  const flowIds = rows.map((r) => r.flow_id);
  const myProjectIds = Array.from(new Set(myAssignments.map((a) => a.project_id)));
  const [flowsRes, livePacketsRes] = await Promise.all([
    flowIds.length ? supabase.from("new_hire_flows").select("id, name, description").in("id", flowIds) : null,
    // Kit 27 — surface the project advance when one is live on a project the
    // caller is assigned to; the packet card itself renders on /m/advances.
    myProjectIds.length
      ? supabase
          .from("advance_packets")
          .select("project_id, projects(name)")
          .eq("org_id", session.orgId)
          .eq("packet_state", "live")
          .in("project_id", myProjectIds)
          .is("deleted_at", null)
          .limit(20)
      : null,
  ]);
  const flowMap = new Map(((flowsRes?.data ?? []) as Flow[]).map((f) => [f.id, f]));
  const livePacketProjects: string[] = ((livePacketsRes?.data ?? []) as Array<{ projects: { name: string } | null }>)
    .map((p) => p.projects?.name)
    .filter((n): n is string => Boolean(n));

  // Flatten to the client view's shape — resolved flow names + a preformatted
  // assigned date threaded in (the client can't reach the DB).
  const viewItems: OnboardingItem[] = rows.map((a) => {
    const flow = flowMap.get(a.flow_id);
    return {
      id: a.id,
      phase: a.assignment_phase ?? "assigned",
      flowName: flow?.name ?? null,
      flowDescription: flow?.description ?? null,
      assignedLabel: a.assigned_at
        ? fmt.dateParts(new Date(a.assigned_at), { month: "short", day: "numeric" })
        : "",
      assignedIso: a.assigned_at ? a.assigned_at.slice(0, 10) : null,
    };
  });

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.onboarding.eyebrow", undefined, "You")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.onboarding.title", undefined, "Onboarding")}
      </h1>

      {livePacketProjects.length > 0 && (
        <Link href="/m/advances" className="item" style={{ textDecoration: "none", marginBottom: 12 }}>
          <span className="bar" style={{ background: "var(--p-success)" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t">{t("m.onboarding.packetTitle", undefined, "Project Advance Live")}</div>
            <div className="s">{livePacketProjects.join(" · ")}</div>
            <div className="s">
              {t("m.onboarding.packetHint", undefined, "Your schedule, PPE requirements, and credential status.")}
            </div>
          </div>
          <KIcon name="ChevronRight" size={16} style={{ color: "var(--p-text-3)", flex: "none" }} />
        </Link>
      )}

      <OnboardingView items={viewItems} />
    </div>
  );
}
