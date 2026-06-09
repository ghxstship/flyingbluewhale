import Link from "next/link";
import { notFound } from "next/navigation";
import { PortalRail } from "@/components/Shell";
import { EmptyState } from "@/components/ui/EmptyState";
import { portalNav } from "@/lib/nav";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { postPortalMessage, markPortalRoomRead } from "./actions";

export const dynamic = "force-dynamic";

/**
 * /p/[slug]/messages/[roomId] — portal-native chat room. Same chat_rooms /
 * chat_messages tables as /m/inbox/[roomId], but rendered inside the portal
 * shell so AM threads never bounce a vendor into the COMPVSS PWA (which
 * 404s under subdomain routing anyway). Authorization: caller must be a
 * chat_room_members row holder AND the room must belong to the same org as
 * the slug's project.
 */

type Msg = {
  id: string;
  author_id: string | null;
  body: string;
  created_at: string;
};

export default async function PortalRoomPage({ params }: { params: Promise<{ slug: string; roomId: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return <div className="page-content">{t("p.shared.configureSupabase", undefined, "Configure Supabase.")}</div>;
  const { slug, roomId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  // Org pin — the room must live in the same org as the slug's project.
  const project = await projectIdFromSlug(slug);
  if (!project) notFound();

  const { data: room } = await supabase
    .from("chat_rooms")
    .select("id, name, room_kind, org_id")
    .eq("id", roomId)
    .eq("org_id", project.org_id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!room) notFound();

  // Membership check — RLS hides non-member rooms too, but the explicit
  // guard keeps the 404 deterministic.
  const { data: member } = await supabase
    .from("chat_room_members")
    .select("room_id")
    .eq("room_id", roomId)
    .eq("user_id", session.userId)
    .maybeSingle();
  if (!member) notFound();

  const { data: msgs } = await supabase
    .from("chat_messages")
    .select("id, author_id, body, created_at")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true })
    .limit(200);
  const messages = (msgs ?? []) as Msg[];

  // Author names for the thread — the portal user sees who on the org side
  // is talking to them.
  const authorIds = Array.from(new Set(messages.map((m) => m.author_id).filter((id): id is string => !!id)));
  const { data: authors } = authorIds.length
    ? await supabase.from("users").select("id, email, name").in("id", authorIds)
    : { data: [] };
  const authorMap = new Map(
    ((authors ?? []) as unknown as Array<{ id: string; email: string; name: string | null }>).map((u) => [
      u.id,
      u.name ?? u.email,
    ]),
  );

  // Mark room read on render — same idempotent RSC side-effect as the
  // mobile room view; keeps unread badges in sync.
  await markPortalRoomRead({ roomId });

  return (
    <div className="flex">
      <PortalRail group={portalNav(slug, "vendor")} title={t("p.shared.portal", undefined, "Portal")} />
      <div className="flex-1">
        <div className="page-content">
          <Link href={`/p/${slug}/messages`} className="text-xs text-[var(--p-text-2)] hover:underline">
            ← {t("p.shared.messages.room.backToMessages", undefined, "All Messages")}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">
            {room.name ?? t("p.shared.messages.room.directMessage", undefined, "Direct Message")}
          </h1>
          <p className="mt-1 text-xs text-[var(--p-text-2)]">
            {t(
              "p.shared.messages.room.subtitle",
              { projectName: project.name },
              `Direct thread with your account manager for ${project.name}.`,
            )}
          </p>

          <RealtimeRefresh
            channelName={`p-messages-${roomId}`}
            table="chat_messages"
            filter={`room_id=eq.${roomId}`}
            event="INSERT"
          />

          <ul className="mt-5 space-y-2">
            {messages.length === 0 ? (
              <li>
                <EmptyState
                  size="compact"
                  title={t("p.shared.messages.room.emptyTitle", undefined, "No Messages Yet")}
                  description={t(
                    "p.shared.messages.room.empty",
                    undefined,
                    "Say hello — your account manager gets notified.",
                  )}
                />
              </li>
            ) : (
              messages.map((m) => {
                const mine = m.author_id === session.userId;
                return (
                  <li key={m.id} className={mine ? "flex justify-end" : "flex"}>
                    <div
                      className={
                        mine
                          ? "max-w-[80%] rounded-lg bg-[var(--p-accent)] px-3 py-2 text-xs text-[var(--p-accent-contrast)]"
                          : "surface max-w-[80%] px-3 py-2 text-xs"
                      }
                    >
                      {!mine && m.author_id && (
                        <span className="mb-1 block text-[10px] font-semibold opacity-80">
                          {authorMap.get(m.author_id) ??
                            t("p.shared.messages.accountManager", undefined, "Account Manager")}
                        </span>
                      )}
                      <p className="whitespace-pre-wrap">{m.body}</p>
                      <span className="mt-1 block text-[10px] opacity-70">{fmt.time(m.created_at)}</span>
                    </div>
                  </li>
                );
              })
            )}
          </ul>

          <form
            action={postPortalMessage}
            className="mt-5 flex items-center gap-2 border-t border-[var(--p-border)] pt-4"
          >
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="roomId" value={roomId} />
            <input
              type="text"
              name="body"
              placeholder={t("p.shared.messages.room.messagePlaceholder", undefined, "Message")}
              required
              maxLength={4000}
              className="flex-1 rounded-md border border-[var(--p-border)] bg-[var(--p-surface)] px-3 py-2 text-sm"
            />
            <button type="submit" className="ps-btn ps-btn--sm">
              {t("common.send", undefined, "Send")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
