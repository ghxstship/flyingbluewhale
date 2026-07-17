import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { KIcon } from "@/components/mobile/kit";
import { SpaceMembership } from "./SpaceMembership";

/**
 * COMPVSS · Space Detail — kit 28 `space-detail` (/m/spaces/[id]).
 *
 * "Space feed with about/gated info, join/leave, member posts." The about and
 * membership are here; the POSTS are the room's chat thread, which already
 * exists at /m/inbox/[roomId] — members get one tap into it rather than this
 * page forking the whole thread surface (composer, realtime, record-ref
 * chips) a second time. Non-members see the gated card, which is what
 * "credential-gated" content means in practice.
 */
export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  team: "Team",
  trade: "Trade",
  location: "Location",
  club: "Club",
};

export default async function SpaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="screen">{t("m.spaces.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data: room } = await supabase
    .from("chat_rooms")
    .select("id, name, space_kind, about, created_at")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .eq("room_kind", "space")
    .is("deleted_at", null)
    .maybeSingle();
  if (!room) notFound();

  const { data: memberRows } = await supabase.from("chat_room_members").select("user_id").eq("room_id", id);
  const members = (memberRows ?? []) as Array<{ user_id: string }>;
  const joined = members.some((m) => m.user_id === session.userId);

  const kind = KIND_LABEL[(room as { space_kind: string | null }).space_kind ?? ""] ?? "Team";
  const name = (room as { name: string | null }).name ?? t("m.spaces.unnamed", undefined, "Unnamed Space");
  const about = (room as { about: string | null }).about;

  return (
    <div className="screen screen-anim">
      <Link href="/m/spaces" className="backbtn">
        <KIcon name="ChevronLeft" size={17} /> {t("m.spaces.title", undefined, "Spaces & Clubs")}
      </Link>
      <div className="scr-eye">
        {kind} · {members.length}{" "}
        {members.length === 1 ? t("m.spaces.member", undefined, "Member") : t("m.spaces.members", undefined, "Members")}
      </div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {name}
      </h1>

      {about && (
        <div className="item" style={{ display: "block" }}>
          <div className="s" style={{ whiteSpace: "pre-wrap" }}>{about}</div>
        </div>
      )}

      <SpaceMembership roomId={id} joined={joined} />

      {joined ? (
        <Link
          href={`/m/inbox/${id}`}
          className="ps-btn ps-btn--cta ps-btn--lg"
          style={{ width: "100%", justifyContent: "center", marginTop: 8, textDecoration: "none" }}
        >
          <KIcon name="MessageSquare" size={15} /> {t("m.spaces.openFeed", undefined, "Open The Space Feed")}
        </Link>
      ) : (
        <div className="item" style={{ display: "block", marginTop: 8 }}>
          <div className="t">{t("m.spaces.gated.title", undefined, "Members Only")}</div>
          <div className="s">
            {t("m.spaces.gated.body", undefined, "Posts in this space are visible to members. Join to read and post.")}
          </div>
        </div>
      )}
    </div>
  );
}
