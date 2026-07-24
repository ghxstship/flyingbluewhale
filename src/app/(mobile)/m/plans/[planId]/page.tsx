import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { KIcon } from "@/components/mobile/kit";
import { PlanViewer, type PlanPin } from "./PlanViewer";

/**
 * COMPVSS · Site Plan sheet — released drawing, rendered on-device.
 *
 * Server component resolves the sheet + its pins (both RLS-scoped); the
 * client `PlanViewer` fetches the PDF through the existing signed-URL route
 * and renders it with PDF.js, caching the bytes for offline re-reads.
 */
export const dynamic = "force-dynamic";

const FIELD_VISIBLE_STATES = ["approved", "issued", "as_built"] as const;

export default async function PlanDetailPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="screen">{t("common.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();

  const [{ data: plan }, { data: pinRows }] = await Promise.all([
    supabase
      .from("site_plans")
      .select("id, code, title, discipline, revision_letter, document_state, storage_path")
      .eq("id", planId)
      .eq("org_id", session.orgId)
      .in("document_state", [...FIELD_VISIBLE_STATES])
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("site_plan_pins")
      .select("id, pin_type, label, x_pct, y_pct")
      .eq("site_plan_id", planId)
      .eq("org_id", session.orgId)
      .limit(300),
  ]);
  if (!plan || !plan.storage_path) notFound();

  const pins: PlanPin[] = ((pinRows ?? []) as PlanPin[]).map((p) => ({
    id: p.id,
    pin_type: p.pin_type,
    label: p.label,
    x_pct: p.x_pct,
    y_pct: p.y_pct,
  }));

  return (
    <div className="screen screen-anim">
      <Link href="/m/plans" className="ps-btn ps-btn--tertiary ps-btn--sm" style={{ marginBottom: 10 }}>
        <KIcon name="ChevronLeft" size={14} /> {t("m.plans.back", undefined, "Site Plans")}
      </Link>
      <div className="scr-eye">
        {[
          plan.code,
          plan.revision_letter ? `${t("m.plans.rev", undefined, "Rev")} ${plan.revision_letter}` : null,
          toTitle(plan.document_state),
        ]
          .filter(Boolean)
          .join(" · ")}
      </div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {plan.title}
      </h1>

      <PlanViewer planId={plan.id} pins={pins} />
    </div>
  );
}
