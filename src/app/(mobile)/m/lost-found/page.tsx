import { PackageSearch } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestT, getRequestFormatters } from "@/lib/i18n/request";
import { EmptyState } from "@/components/ui/EmptyState";
import { Fab, KIcon } from "@/components/mobile/kit";
import { PhotoStrip } from "@/components/media/PhotoStrip";
import { signPhotoRefsFor } from "@/lib/mobile/photo-sign";

export const dynamic = "force-dynamic";

/**
 * /m/lost-found — COMPVSS · Lost & Found (kit-29 Conformance Spec, ratified
 * 2026-07-17: "Log + claim lost items. Photo, location found, status.
 * FAB = Log Item.").
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

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.lostfound.eyebrow", undefined, "Site")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.lostfound.title", undefined, "Lost & Found")}
      </h1>

      {items.length === 0 ? (
        <EmptyState
          icon={<PackageSearch size={28} aria-hidden="true" />}
          title={t("m.lostfound.emptyTitle", undefined, "Nothing Logged")}
          description={t(
            "m.lostfound.emptyBody",
            undefined,
            "Lost or found property logged from the field shows up here for the whole org.",
          )}
        />
      ) : (
        items.map((i) => {
          const held = i.incident_state !== "closed";
          const lost = (i.summary ?? "").startsWith("Lost");
          return (
            <div className="item" key={i.id} style={{ display: "block" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <KIcon
                  name={lost ? "SearchX" : "PackageCheck"}
                  size={18}
                  style={{ color: "var(--p-text-2)", flex: "none" }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="t">{i.summary ?? t("m.lostfound.item", undefined, "Property Report")}</div>
                  <div className="s">
                    {i.location ?? ""}
                    {i.occurred_at ? ` · ${fmt.date(new Date(i.occurred_at), "medium")}` : ""}
                  </div>
                </div>
                <span className={`ps-badge ps-badge--${held ? "warn" : "ok"}`} style={{ flex: "none" }}>
                  {held ? t("m.lostfound.held", undefined, "Held") : t("m.lostfound.claimed", undefined, "Claimed")}
                </span>
              </div>
              {i.description ? (
                <p className="form-intro" style={{ margin: "8px 0 0" }}>
                  {i.description}
                </p>
              ) : null}
              <PhotoStrip photos={photosById.get(i.id) ?? []} label={i.summary ?? "Property"} />
            </div>
          );
        })
      )}

      {/* Kit-29 spec: FAB = Log Item. */}
      <Fab href="/m/lost-found/new" label={t("m.lostfound.newCta", undefined, "Log Item")} />
    </div>
  );
}
