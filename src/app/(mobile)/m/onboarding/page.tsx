import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { EmptyState } from "@/components/ui/EmptyState";
import { KIcon } from "@/components/mobile/kit";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Onboarding — the caller's new-hire flows, rebuilt to the kit.
 * Reads `new_hire_assignments` (+ flow name) for this user; each card links to
 * the `[assignmentId]` detail where steps are completed and the flow finalized.
 */
type Assignment = {
  id: string;
  flow_id: string;
  assignment_phase: string | null;
  assigned_at: string | null;
  completed_at: string | null;
};

type Flow = { id: string; name: string | null; description: string | null };

const PHASE_TONE: Record<string, string> = {
  assigned: "warn",
  in_progress: "info",
  completed: "ok",
  abandoned: "neutral",
};

const PHASE_LABEL: Record<string, string> = {
  assigned: "To Do",
  in_progress: "In Progress",
  completed: "Done",
  abandoned: "Abandoned",
};

const TONE_VAR: Record<string, string> = {
  warn: "var(--p-warning)",
  info: "var(--p-info)",
  ok: "var(--p-success)",
  neutral: "var(--p-border)",
};

export default async function MobileOnboardingPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();

  const { data: assignments } = await supabase
    .from("new_hire_assignments")
    .select("id, flow_id, assignment_phase, assigned_at, completed_at")
    .eq("org_id", session.orgId)
    .eq("assignee_id", session.userId)
    .order("assigned_at", { ascending: false })
    .limit(100);
  const rows = (assignments ?? []) as Assignment[];

  const flowIds = rows.map((r) => r.flow_id);
  const { data: flows } = flowIds.length
    ? await supabase.from("new_hire_flows").select("id, name, description").in("id", flowIds)
    : { data: [] as Flow[] };
  const flowMap = new Map(((flows ?? []) as Flow[]).map((f) => [f.id, f]));

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.onboarding.eyebrow", undefined, "You")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.onboarding.title", undefined, "Onboarding")}
      </h1>

      {rows.length === 0 ? (
        <EmptyState
          icon={<GraduationCap size={28} aria-hidden="true" />}
          title={t("m.onboarding.emptyTitle", undefined, "All Caught Up")}
          description={t("m.onboarding.emptyBody", undefined, "New-hire journeys assigned to you appear here.")}
        />
      ) : (
        rows.map((a) => {
          const phase = a.assignment_phase ?? "assigned";
          const tone = PHASE_TONE[phase] ?? "neutral";
          const flow = flowMap.get(a.flow_id);
          return (
            <Link href={`/m/onboarding/${a.id}`} key={a.id} className="item" style={{ textDecoration: "none" }}>
              <span className="bar" style={{ background: TONE_VAR[tone] ?? "var(--p-accent)" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t">{flow?.name ?? t("m.onboarding.untitled", undefined, "Onboarding")}</div>
                {flow?.description && <div className="s">{flow.description}</div>}
                <div className="s">
                  {a.assigned_at
                    ? fmt.dateParts(new Date(a.assigned_at), { month: "short", day: "numeric" })
                    : ""}
                </div>
              </div>
              <span className={`ps-badge ps-badge--${tone}`} style={{ flex: "none" }}>
                {PHASE_LABEL[phase] ?? phase}
              </span>
              <KIcon name="ChevronRight" size={16} style={{ color: "var(--p-text-3)", flex: "none" }} />
            </Link>
          );
        })
      )}
    </div>
  );
}
