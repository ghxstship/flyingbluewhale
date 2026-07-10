import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/ModuleHeader";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { hasSupabase } from "@/lib/env";
import { getRequestT, getRequestFormatters } from "@/lib/i18n/request";
import { XPMS_PHASES } from "@/lib/finance/xpms-budget";
import { DrawScheduleClient } from "./DrawScheduleClient";

/**
 * XPMS Per-Project Draw Schedule.
 *
 * Renders the project's project_billing_draws rows + a "Seed default
 * 50/30/20" CTA + a form to add a custom draw. Each row exposes a
 * Mark Drawn / Delete control. Total amount per draw is computed as
 * percentage × SUM(budgets.amount_cents WHERE project_id = …) so the
 * UI mirrors the Summary sheet's Draw Schedule table.
 */
export const dynamic = "force-dynamic";

type DrawRow = {
  id: string;
  draw_name: string;
  trigger_label: string | null;
  trigger_phase: string | null;
  percentage: number | null;
  drawn: boolean;
  drawn_at: string | null;
  sort_order: number | null;
};

export default async function ProjectDrawSchedulePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  if (!hasSupabase) notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const { t } = await getRequestT();

  // Project guard
  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) notFound();

  // Project total budget = sum of budgets.amount_cents on this project
  const { data: budgetSum } = await supabase
    .from("budgets")
    .select("amount_cents")
    .eq("org_id", session.orgId)
    .eq("project_id", projectId);
  const totalCents = (budgetSum ?? []).reduce(
    (acc, r) => acc + (Number((r as { amount_cents: number | null }).amount_cents) || 0),
    0,
  );

  // Existing draws
  const { data: draws } = await (supabase as unknown as LooseSupabase)
    .from("project_billing_draws")
    .select("id, draw_name, trigger_label, trigger_phase, percentage, drawn, drawn_at, sort_order")
    .eq("org_id", session.orgId)
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const rows = (draws ?? []) as DrawRow[];

  return (
    <>
      <ModuleHeader
        eyebrow="Finance"
        title={t("console.projects.finance.draws.title", undefined, "Draw Schedule")}
        subtitle={t(
          "console.projects.finance.draws.subtitle",
          { project: project.name },
          `Project billing milestones. % of total contract for ${project.name}.`,
        )}
      />
      <div className="page-content max-w-4xl">
        <DrawScheduleClient
          projectId={projectId}
          rows={rows}
          totalBudgetCents={totalCents}
          totalBudgetFormatted={fmt.money(totalCents / 100)}
          phaseOptions={[...XPMS_PHASES]}
        />
      </div>
    </>
  );
}
