import { RecordTabsProvider } from "@/components/ui/RecordTabsContext";
import { PhaseStepper } from "@/components/xpms/PhaseStepper";
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

  // Schedule consolidates the prior Gantt + Calendar tabs into one domain
  // with `?view=timeline|calendar|list` (Linear / Asana / Notion pattern).
  // Tasks stays distinct — work items vs. scheduled events are different
  // entities and operators access them on different cadences.
  const tabs = [
    {
      label: t("console.projects.tabs.overview", undefined, "Overview"),
      href: `/console/projects/${projectId}/overview`,
    },
    { label: t("console.projects.tabs.tracker", undefined, "Tracker"), href: `/console/projects/${projectId}/tracker` },
    { label: t("console.projects.tabs.tasks", undefined, "Tasks"), href: `/console/projects/${projectId}/tasks` },
    {
      label: t("console.projects.tabs.schedule", undefined, "Schedule"),
      href: `/console/projects/${projectId}/schedule`,
    },
    { label: t("console.projects.tabs.files", undefined, "Files"), href: `/console/projects/${projectId}/files` },
    { label: t("console.projects.tabs.photos", undefined, "Photos"), href: `/console/projects/${projectId}/photos` },
    { label: t("console.projects.tabs.budget", undefined, "Budget"), href: `/console/projects/${projectId}/budget` },
    { label: t("console.projects.tabs.finance", undefined, "P&L"), href: `/console/projects/${projectId}/finance` },
    { label: t("console.projects.tabs.crew", undefined, "Crew"), href: `/console/projects/${projectId}/crew` },
    { label: t("console.projects.tabs.members", undefined, "Members"), href: `/console/projects/${projectId}/members` },
    {
      label: t("console.projects.tabs.advancing", undefined, "Advancing"),
      href: `/console/projects/${projectId}/advancing`,
    },
    { label: t("console.projects.tabs.guides", undefined, "Guides"), href: `/console/projects/${projectId}/guides` },
    {
      label: t("console.projects.tabs.sustainability", undefined, "Sustainability"),
      href: `/console/projects/${projectId}/sustainability`,
    },
  ];
  return (
    <RecordTabsProvider tabs={tabs}>
      <PhaseStepper currentPhase={currentPhase} projectId={projectId} />
      {children}
    </RecordTabsProvider>
  );
}
