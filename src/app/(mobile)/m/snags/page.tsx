import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { KIcon } from "@/components/mobile/kit";
import { signPhotoRefsFor } from "@/lib/mobile/photo-sign";
import { SnagsListView, type SnagItem } from "./SnagsListView";

export const dynamic = "force-dynamic";

/** Must match the bucket `raiseSnag` uploads to. */
const SNAG_PHOTO_BUCKET = "procore-parity";

/**
 * COMPVSS · My Snags — the snags I raised, newest first, into the console
 * punch-list store (`punch_items`). Migrated onto the kit view engine
 * (NormalizedList) via <SnagsListView>; rows open /m/punch/[id].
 *
 * Deliberately self-scoped with an explicit `created_by` filter, the same
 * defensive shape as /m/expenses: punch_items RLS is org-member-readable, so
 * the whole-org queue is one missing predicate away, and the org queue is a
 * console surface (/studio/punch), not this one. No `deleted_at` guard —
 * punch_items has no soft-delete column.
 */
type SnagRow = {
  id: string;
  code: string;
  title: string;
  item_state: string;
  priority: string;
  photo_path: string | null;
  project_id: string;
  created_at: string;
};

export default async function SnagsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="screen">{t("m.snags.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("punch_items")
    .select("id, code, title, item_state, priority, photo_path, project_id, created_at")
    .eq("org_id", session.orgId)
    .eq("created_by", session.userId)
    .order("created_at", { ascending: false })
    .limit(50);
  const snags = (data ?? []) as SnagRow[];

  // Sign the photos (a snag report you can't look at is a sentence, not
  // evidence) and resolve project names in one round trip — both depend only
  // on the snag rows, not on each other.
  const projectIds = Array.from(new Set(snags.map((s) => s.project_id)));
  const [photosById, projectsRes] = await Promise.all([
    signPhotoRefsFor(supabase, SNAG_PHOTO_BUCKET, snags, (s) => (s.photo_path ? [s.photo_path] : [])),
    projectIds.length
      ? supabase.from("projects").select("id, name").eq("org_id", session.orgId).in("id", projectIds).is("deleted_at", null)
      : null,
  ]);
  const projectName = new Map<string, string>();
  for (const p of (projectsRes?.data ?? []) as Array<{ id: string; name: string | null }>) {
    projectName.set(p.id, p.name ?? "");
  }

  // Flatten to the client view's shape — signed photos + resolved project +
  // preformatted dates threaded in (the client can't reach storage or the DB).
  const viewItems: SnagItem[] = snags.map((s) => ({
    id: s.id,
    code: s.code,
    title: s.title,
    item_state: s.item_state,
    priority: s.priority,
    projectName: projectName.get(s.project_id) ?? null,
    createdLabel: fmt.date(s.created_at),
    photos: photosById.get(s.id) ?? [],
  }));

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.snags.eyebrow", undefined, "Site")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.snags.title", undefined, "My Snags")}
      </h1>

      <SnagsListView items={viewItems} />

      <Link
        href="/m/snags/new"
        className="ps-btn ps-btn--cta ps-btn--lg"
        style={{ width: "100%", justifyContent: "center", marginTop: 16 }}
      >
        <KIcon name="Camera" size={16} /> {t("m.snags.new", undefined, "Raise A Snag")}
      </Link>
    </div>
  );
}
