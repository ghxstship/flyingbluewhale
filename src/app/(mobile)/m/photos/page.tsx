import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestT } from "@/lib/i18n/request";
import { signPhotoRefs } from "@/lib/mobile/photo-sign";
import { PhotoNotesView, type PhotoNoteItem } from "./PhotoNotesView";

export const dynamic = "force-dynamic";

/** Same bucket the capture pipeline writes. */
const PHOTO_BUCKET = "procore-parity";

/**
 * COMPVSS · Photo Notes (T1-5 expansion) — the standalone geotagged photo
 * artifacts filed by the Capture surface's "Photo note" destination. Org
 * feed, newest first, thumbnails via short-lived signed URLs.
 */
export default async function PhotoNotesPage() {
  const session = await requireSession();
  const { t } = await getRequestT();
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("field_photo_notes")
    .select("id, project_id, note, file_path, lat, lng, accuracy_m, captured_at, created_by")
    .eq("org_id", session.orgId)
    .order("captured_at", { ascending: false })
    .limit(200);
  const notes = rows ?? [];

  const projectIds = [...new Set(notes.map((n) => n.project_id).filter((x): x is string => !!x))];
  const projectName = new Map<string, string>();
  if (projectIds.length) {
    // soft-delete-exempt: display-name resolution for historical photo notes — a
    // note filed under a since-archived project must still say which show it was.
    const { data: projRows } = await supabase.from("projects").select("id, name").eq("org_id", session.orgId).in("id", projectIds);
    for (const p of projRows ?? []) projectName.set(p.id, p.name ?? "");
  }

  const items: PhotoNoteItem[] = await Promise.all(
    notes.map(async (n) => {
      const signed = await signPhotoRefs(supabase, PHOTO_BUCKET, [
        { path: n.file_path, lat: n.lat, lng: n.lng, accuracyM: n.accuracy_m, capturedAt: n.captured_at },
      ]);
      return {
        id: n.id,
        url: signed[0]?.url ?? null,
        note: n.note,
        projectName: n.project_id ? (projectName.get(n.project_id) ?? null) : null,
        capturedAt: n.captured_at,
        located: n.lat != null && n.lng != null,
        mine: n.created_by === session.userId,
      };
    }),
  );

  return (
    <PhotoNotesView
      items={items}
      labels={{
        eyebrow: t("m.capture.photos.eyebrow", undefined, "Site"),
        title: t("m.capture.photos.title", undefined, "Photo Notes"),
        searchPlaceholder: t("m.capture.photos.search", undefined, "Search photo notes…"),
        emptyTitle: t("m.capture.photos.emptyTitle", undefined, "No Photo Notes Yet"),
        emptyHint: t("m.capture.photos.emptyHint", undefined, "Shoot one from Capture and pick Photo note."),
        cta: t("m.capture.photos.cta", undefined, "Open Capture"),
        unfiled: t("m.capture.photos.unfiled", undefined, "Unfiled"),
        located: t("m.capture.photos.located", undefined, "Geotagged"),
        mine: t("m.capture.photos.mine", undefined, "Mine"),
      }}
    />
  );
}
