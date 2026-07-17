import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { SpacesView, type SpaceRow } from "./SpacesView";

/**
 * COMPVSS · Spaces & Clubs — kit 28 `spaces` (/m/spaces).
 *
 * "Team / Trade / Location / Club channels, credential-gated. Kind filter.
 * Row opens the space; join/leave state persists."
 *
 * A space is a `chat_rooms` row with `room_kind = 'space'` plus a kind facet
 * and an about blurb (migration 20260716120000) — not a parallel store. The
 * directory is org-browsable by design; the CONTENT stays member-gated
 * (chat_messages RLS is untouched), which is what "credential-gated" means
 * here.
 */
export const dynamic = "force-dynamic";

export default async function SpacesPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="screen">{t("m.spaces.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data: roomRows } = await supabase
    .from("chat_rooms")
    .select("id, name, space_kind, about, last_message_at")
    .eq("org_id", session.orgId)
    .eq("room_kind", "space")
    .is("deleted_at", null)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(200);

  type Row = { id: string; name: string | null; space_kind: string | null; about: string | null };
  const rooms = (roomRows ?? []) as Row[];
  const roomIds = rooms.map((r) => r.id);

  // One membership sweep for both facts the list needs: which spaces I'm in,
  // and how big each one is. RLS note: membership rows of spaces I'm NOT in
  // are visible only through my own row — so counts for unjoined spaces come
  // from the same query being run as an org member against space rooms.
  const memberByRoom = new Map<string, number>();
  const mine = new Set<string>();
  if (roomIds.length) {
    const { data: memberRows } = await supabase
      .from("chat_room_members")
      .select("room_id, user_id")
      .in("room_id", roomIds);
    for (const m of (memberRows ?? []) as Array<{ room_id: string; user_id: string }>) {
      memberByRoom.set(m.room_id, (memberByRoom.get(m.room_id) ?? 0) + 1);
      if (m.user_id === session.userId) mine.add(m.room_id);
    }
  }

  const rows: SpaceRow[] = rooms.map((r) => ({
    id: r.id,
    name: r.name ?? t("m.spaces.unnamed", undefined, "Unnamed Space"),
    kind: (r.space_kind ?? "team") as SpaceRow["kind"],
    about: r.about,
    members: memberByRoom.get(r.id) ?? 0,
    joined: mine.has(r.id),
  }));

  return (
    <SpacesView
      rows={rows}
      eyebrow={t("m.spaces.eyebrow", { count: rows.length }, `${rows.length} Spaces`)}
      title={t("m.spaces.title", undefined, "Spaces & Clubs")}
    />
  );
}
