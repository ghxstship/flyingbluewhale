import { RecordTabsProvider } from "@/components/ui/RecordTabsContext";
import { PhaseStepper } from "@/components/xpms/PhaseStepper";
import { requireSession } from "@/lib/auth";
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

  const tabs = [
    { label: "Overview", href: `/console/projects/${projectId}/overview` },
    { label: "Tasks", href: `/console/projects/${projectId}/tasks` },
    { label: "Gantt", href: `/console/projects/${projectId}/gantt` },
    { label: "Files", href: `/console/projects/${projectId}/files` },
    { label: "Photos", href: `/console/projects/${projectId}/photos` },
    { label: "Calendar", href: `/console/projects/${projectId}/calendar` },
    { label: "Budget", href: `/console/projects/${projectId}/budget` },
    { label: "P&L", href: `/console/projects/${projectId}/finance` },
    { label: "Crew", href: `/console/projects/${projectId}/crew` },
    { label: "Advancing", href: `/console/projects/${projectId}/advancing` },
    { label: "Guides", href: `/console/projects/${projectId}/guides` },
    { label: "Sustainability", href: `/console/projects/${projectId}/sustainability` },
  ];
  return (
    <RecordTabsProvider tabs={tabs}>
      <PhaseStepper currentPhase={currentPhase} projectId={projectId} />
      {children}
    </RecordTabsProvider>
  );
}
