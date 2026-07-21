import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { KIcon } from "@/components/mobile/kit";
import { signPhotoRefsFor } from "@/lib/mobile/photo-sign";
import { PunchListView, type PunchItem } from "./PunchListView";

export const dynamic = "force-dynamic";

/** Must match the bucket `raiseSnag` (/m/snags) uploads to. */
const PUNCH_PHOTO_BUCKET = "procore-parity";

/**
 * COMPVSS · Punch List — the org-wide inspection punch list, the field view
 * of the SAME `punch_items` store the console reads at /studio/punch.
 *
 * Kit 29 ratified this route as the punch LIST: items with status tones,
 * photo evidence, assignee, row opens the record. The previous occupant of
 * this route was a duplicate punch-in/out time surface; punching in and out
 * lives on /m/clock (the spec's Time Clock), so the time twin yielded.
 *
 * Deliberately org-wide (RLS: punch_items select is org-member-readable).
 * The MY-raised slice lives at /m/snags; this is the whole queue. No
 * `deleted_at` guard — punch_items has no soft-delete column.
 */
type PunchRow = {
  id: string;
  code: string;
  title: string;
  item_state: string;
  priority: string;
  photo_path: string | null;
  due_at: string | null;
  created_at: string;
  project: { name: string | null } | null;
  assignee: { name: string | null; email: string | null } | null;
};

export default async function PunchListPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="screen">{t("m.punchList.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("punch_items")
    .select(
      "id, code, title, item_state, priority, photo_path, due_at, created_at, project:project_id(name), assignee:assignee_id(name, email)",
    )
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .limit(100);
  const items = (data ?? []) as unknown as PunchRow[];

  // Sign the photo evidence — same idiom as /m/snags: the caller's client
  // signs, so RLS stays the gate.
  const photosById = await signPhotoRefsFor(supabase, PUNCH_PHOTO_BUCKET, items, (i) =>
    i.photo_path ? [i.photo_path] : [],
  );

  const openCount = items.filter((i) => !["complete", "void"].includes(i.item_state)).length;

  // Flatten to the client view's shape — signed photos + resolved names +
  // preformatted dates threaded in (the client can't reach storage or the DB).
  const viewItems: PunchItem[] = items.map((i) => ({
    id: i.id,
    code: i.code,
    title: i.title,
    item_state: i.item_state,
    priority: i.priority,
    projectName: i.project?.name ?? null,
    assigneeName: i.assignee?.name ?? i.assignee?.email ?? null,
    createdLabel: fmt.date(i.created_at),
    photos: photosById.get(i.id) ?? [],
  }));

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.punchList.eyebrow", undefined, "Site")}</div>
      <h1 className="scr-h" style={{ marginBottom: 4 }}>
        {t("m.punchList.title", undefined, "Punch List")}
      </h1>
      <div className="s" style={{ marginBottom: 12 }}>
        {t("m.punchList.openCount", { n: openCount }, `${openCount} Open`)}
      </div>

      <PunchListView items={viewItems} />

      <Link
        href="/m/snags/new"
        className="ps-btn ps-btn--secondary ps-btn--lg"
        style={{ width: "100%", justifyContent: "center", marginTop: 16 }}
      >
        <KIcon name="Camera" size={16} /> {t("m.punchList.raiseSnag", undefined, "Raise A Snag")}
      </Link>
    </div>
  );
}
