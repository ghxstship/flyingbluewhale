import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestT } from "@/lib/i18n/request";
import { GuideView } from "@/components/guides/GuideView";
import { EmptyState } from "@/components/ui/EmptyState";
import { KIcon } from "@/components/mobile/kit";
import type { GuideConfig } from "@/lib/guides/types";
import type { EventGuide, GuidePersona, Persona } from "@/lib/supabase/types";
import type { LooseSupabase } from "@/lib/supabase/loose";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Boarding Pass — the field crew's Know-Before-You-Go guide,
 * auto-scoped to the viewer's session persona (mirrors the portal's
 * `mapSessionToGuidePersona`). Reads the org's most-recent published
 * `event_guides` row for that persona and renders it via <GuideView>.
 */
function mapSessionToGuidePersona(persona: Persona): GuidePersona {
  switch (persona) {
    case "owner":
    case "admin":
    case "manager":
    case "collaborator":
      return "staff";
    case "contractor":
      return "vendor";
    case "client":
      return "client";
    case "crew":
      return "crew";
    case "viewer":
    case "community":
    case "member":
    case "guest":
    case "visitor":
    default:
      return "guest";
  }
}

export default async function MobileGuidePage() {
  const session = await requireSession();
  const persona = mapSessionToGuidePersona(session.persona);
  const { t } = await getRequestT();

  const supabase = await createClient();
  const { data } = await supabase
    .from("event_guides")
    .select("*")
    .eq("org_id", session.orgId)
    .eq("persona", persona)
    .eq("published", true)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const guide = (data ?? null) as EventGuide | null;

  if (!guide) {
    return (
      <div className="screen screen-anim">
        <div className="scr-eye">{t("m.guide.eyebrow", undefined, "Know Before You Go")}</div>
        <h1 className="scr-h" style={{ marginBottom: 12 }}>
          {t("m.guide.title", undefined, "Guide")}
        </h1>
        <EmptyState
          icon={<KIcon name="BookOpen" size={40} />}
          title={t("m.guide.empty", undefined, "No Guide Yet")}
          description={t(
            "m.guide.emptyBody",
            undefined,
            "The production team hasn't published a guide for your role yet.",
          )}
        />
      </div>
    );
  }

  // Read-receipt write: one guide_views row per viewer per guide (a repeat
  // visit refreshes viewed_at via the upsert). Best-effort fire-and-forget —
  // analytics must never block or break the guide render. guide_views is not
  // in the generated client types yet (migration not applied), hence the
  // loose client; the .then() arms trigger execution without awaiting.
  void (supabase as unknown as LooseSupabase)
    .from("guide_views")
    .upsert(
      {
        org_id: guide.org_id,
        guide_id: guide.id,
        user_id: session.userId,
        persona,
        viewed_at: new Date().toISOString(),
      },
      { onConflict: "guide_id,user_id" },
    )
    .then(
      () => undefined,
      () => undefined,
    );

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.guide.eyebrow", undefined, "Know Before You Go")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {guide.title}
      </h1>
      <GuideView
        title={guide.title}
        subtitle={guide.subtitle}
        classification={guide.classification}
        tier={guide.tier}
        updatedAt={guide.updated_at}
        hideTitle
        config={guide.config as GuideConfig}
      />
    </div>
  );
}
