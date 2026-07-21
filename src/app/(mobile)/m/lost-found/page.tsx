import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestT, getRequestFormatters } from "@/lib/i18n/request";
import { Fab } from "@/components/mobile/kit";
import { signPhotoRefsFor } from "@/lib/mobile/photo-sign";
import { LostFoundListView, type LostFoundItem } from "./LostFoundListView";

export const dynamic = "force-dynamic";

/**
 * /m/lost-found — COMPVSS · Lost & Found (kit-29 Conformance Spec, ratified
 * 2026-07-17: "Log + claim lost items. Photo, location found, status.
 * FAB = Log Item."). Migrated onto the kit view engine (NormalizedList) via
 * <LostFoundListView>.
 *
 * This surface was intake-ONLY (the FormScreen now lives at
 * /m/lost-found/new behind the FAB); the list half is the point — a finder
 * logs it, an owner LOOKS FOR it, so the roll is org-wide, newest first.
 *
 * Store: `incidents` with report_kind='lost_property' (ADR-0014 — one
 * store, honest filtered lenses, no parallel table). Status mapping is the
 * honest one the store supports today: open = Held, closed = Claimed. The
 * spec's third state (Donated) has no store facet — flagged kit-side in
 * KIT28_CONFORMANCE_BACKLOG §4 rather than painted on.
 */
type ItemRow = {
  id: string;
  summary: string | null;
  description: string | null;
  location: string | null;
  incident_state: string | null;
  photos: string[] | null;
  occurred_at: string | null;
};

export default async function LostFoundPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("incidents")
    .select("id, summary, description, location, incident_state, photos, occurred_at")
    .eq("org_id", session.orgId)
    .eq("report_kind", "lost_property")
    .is("deleted_at", null)
    .order("occurred_at", { ascending: false })
    .limit(100);
  const items = (data ?? []) as ItemRow[];

  const photosById = await signPhotoRefsFor(supabase, "incident-photos", items, (i) => i.photos ?? []);

  // Flatten to the client view's shape — signed photos + preformatted dates
  // threaded in (the client can't reach storage).
  const viewItems: LostFoundItem[] = items.map((i) => ({
    id: i.id,
    summary: i.summary,
    description: i.description,
    location: i.location,
    incident_state: i.incident_state,
    dateLabel: i.occurred_at ? fmt.date(new Date(i.occurred_at), "medium") : null,
    photos: photosById.get(i.id) ?? [],
  }));

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.lostfound.eyebrow", undefined, "Site")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.lostfound.title", undefined, "Lost & Found")}
      </h1>

      <LostFoundListView items={viewItems} />

      {/* Kit-29 spec: FAB = Log Item. */}
      <Fab href="/m/lost-found/new" label={t("m.lostfound.newCta", undefined, "Log Item")} />
    </div>
  );
}
