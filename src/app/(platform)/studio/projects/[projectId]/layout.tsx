import { RecordTabsProvider } from "@/components/ui/RecordTabsContext";
import { PhaseStepper } from "@/components/xpms/PhaseStepper";
import { ProjectSwitcher } from "@/components/studio/ProjectSwitcher";
import { requireSession } from "@/lib/auth";
import { getRequestT } from "@/lib/i18n/request";
import { createClient } from "@/lib/supabase/server";
import type { XpmsPhase } from "@/lib/xpms";

/**
 * Project detail layout — declares the record-tabs strip that the
 * page's `ModuleHeader` then renders directly under the title (Stripe /
 * Linear / Attio pattern). Routes back the state — one page per tab —
 * so deep links and browser back work natively.
 *
 * Top chrome — the 8-phase XPMS stepper (ADR-0004 Axis B) bound to
 * `projects.xpms_phase`. Renders above the record tabs so the
 * lifecycle phase is the first thing the operator sees on every
 * project surface.
 */
export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  // Read xpms_phase only — the stepper doesn't need the rest of the
  // row. Maybe-single so a soft-deleted or cross-org project just
  // renders the stepper inactive (Project page itself surfaces the
  // 404).
  const { data: project } = await supabase
    .from("projects")
    .select("xpms_phase")
    .eq("id", projectId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  const currentPhase = (project?.xpms_phase ?? null) as XpmsPhase | null;

  // Sibling projects for the switcher (F-B) — hop between shows without
  // re-drilling through the Projects list. Newest-first, capped; Combobox
  // search keeps a long portfolio usable.
  const { data: siblings } = await supabase
    .from("projects")
    .select("id, name")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);
  const projects = ((siblings ?? []) as { id: string; name: string }[]).map((p) => ({ id: p.id, name: p.name }));

  // Schedule consolidates the prior Gantt + Calendar tabs into one domain
  // with `?view=timeline|calendar|list` (Linear / Asana / Notion pattern).
  // Tasks stays distinct — work items vs. scheduled events are different
  // entities and operators access them on different cadences.
  const tabs = [
    {
      label: t("console.projects.tabs.overview", undefined, "Overview"),
      href: `/studio/projects/${projectId}/overview`,
    },
    { label: t("console.projects.tabs.tracker", undefined, "Tracker"), href: `/studio/projects/${projectId}/tracker` },
    { label: t("console.projects.tabs.tasks", undefined, "Tasks"), href: `/studio/projects/${projectId}/tasks` },
    { label: t("console.projects.tabs.sprints", undefined, "Sprints"), href: `/studio/projects/${projectId}/sprints` },
    {
      label: t("console.projects.tabs.schedule", undefined, "Schedule"),
      href: `/studio/projects/${projectId}/schedule`,
    },
    {
      label: t("console.projects.tabs.timeline", undefined, "Timeline"),
      href: `/studio/projects/${projectId}/timeline`,
    },
    { label: t("console.projects.tabs.files", undefined, "Files"), href: `/studio/projects/${projectId}/files` },
    { label: t("console.projects.tabs.photos", undefined, "Photos"), href: `/studio/projects/${projectId}/photos` },
    { label: t("console.projects.tabs.budget", undefined, "Budget"), href: `/studio/projects/${projectId}/budget` },
    { label: t("console.projects.tabs.finance", undefined, "P&L"), href: `/studio/projects/${projectId}/finance` },
    { label: t("console.projects.tabs.crew", undefined, "Crew"), href: `/studio/projects/${projectId}/crew` },
    { label: t("console.projects.tabs.members", undefined, "Members"), href: `/studio/projects/${projectId}/members` },
    { label: t("console.projects.tabs.roster", undefined, "Roster"), href: `/studio/projects/${projectId}/roster` },
    {
      label: t("console.projects.tabs.advancing", undefined, "Advancing"),
      href: `/studio/projects/${projectId}/advancing`,
    },
    { label: t("console.projects.tabs.guides", undefined, "Guides"), href: `/studio/projects/${projectId}/guides` },
    {
      label: t("console.projects.tabs.sustainability", undefined, "Sustainability"),
      href: `/studio/projects/${projectId}/sustainability`,
    },
  ];
  return (
    <RecordTabsProvider tabs={tabs}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <ProjectSwitcher projects={projects} currentId={projectId} />
      </div>
      <PhaseStepper currentPhase={currentPhase} projectId={projectId} />
      {children}
    </RecordTabsProvider>
  );
}
