import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import type { LooseSupabase } from "@/lib/supabase/loose";
import type { FloorPlanPlacement } from "@/components/ui/FloorPlan";
import { SitePlanMap } from "./SitePlanMap";

export const dynamic = "force-dynamic";

type PlanRow = {
  id: string;
  code: string;
  title: string;
  shell_dimensions: { length_in?: number; width_in?: number } | null;
};

type PlacementRow = {
  id: string;
  tag: string;
  footprint: { x?: number; y?: number } | null;
};

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const clampPct = (v: number) => Math.min(100, Math.max(0, v));

export default async function SitePlanMapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { data: planData } = await supabase
    .from("site_plans")
    .select("id, code, title, shell_dimensions")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  const plan = planData as PlanRow | null;
  if (!plan) notFound();

  const { data: placementData } = await supabase
    .from("siteplan_placement")
    .select("id, tag, footprint")
    .eq("sheet_id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .limit(500);
  const placementRows = (placementData ?? []) as PlacementRow[];

  // Normalize footprint inches against the shell envelope to 0–100% pin coords.
  const lengthIn = num(plan.shell_dimensions?.length_in) ?? 0;
  const widthIn = num(plan.shell_dimensions?.width_in) ?? 0;
  const placements: FloorPlanPlacement[] = placementRows
    .map((p): FloorPlanPlacement | null => {
      const x = num(p.footprint?.x);
      const y = num(p.footprint?.y);
      if (x === null || y === null) return null;
      const xPct = lengthIn > 0 ? clampPct((x / lengthIn) * 100) : clampPct(x);
      const yPct = widthIn > 0 ? clampPct((y / widthIn) * 100) : clampPct(y);
      return { id: p.id, x: xPct, y: yPct, label: p.tag };
    })
    .filter((p): p is FloorPlanPlacement => p !== null);

  const { t } = await getRequestT();

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.sitePlans.map.eyebrow", undefined, "Design")}
        title={t("console.sitePlans.map.title", { code: plan.code }, `${plan.code} — Plan map`)}
        subtitle={plan.title}
        breadcrumbs={[
          { label: "Site Plans", href: "/studio/site-plans" },
          { label: plan.code, href: `/studio/site-plans/${id}` },
          { label: "Map" },
        ]}
        action={
          <Button href={`/studio/site-plans/${id}`} variant="secondary">
            {t("console.sitePlans.map.back", undefined, "Back to sheet")}
          </Button>
        }
      />
      <div className="page-content">
        <SitePlanMap
          placements={placements}
          emptyLabel={t("console.sitePlans.map.selectHint", undefined, "Select a pin to see its placement.")}
          detailLabel={t("console.sitePlans.map.detail", undefined, "Placement")}
        />
      </div>
    </>
  );
}
