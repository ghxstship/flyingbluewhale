import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PortalRail } from "@/components/Shell";
import { portalNav, portalPersonaForSession } from "@/lib/nav";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * /p/[slug]/messages — portal-side DM with the caller's assigned
 * account-manager(s) on the org side. Backed by
 * `account_manager_assignments` (migration 0051): every portal user
 * can have an AM per persona-relationship. Each pairing keeps a
 * chat_rooms row; this page lists them and links to /p/[slug]/messages/[roomId].
 */

type AmAssignment = {
  id: string;
  manager_user_id: string;
  persona: string;
  chat_room_id: string | null;
};

export default async function PortalMessages({ params }: { params: Promise<{ slug: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return <div className="page-content">{t("p.shared.configureSupabase", undefined, "Configure Supabase.")}</div>;
  const { slug } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const project = await projectIdFromSlug(slug);

  const { data: assignments } = await supabase
    .from("account_manager_assignments")
    .select("id, manager_user_id, persona, chat_room_id")
    .eq("portal_user_id", session.userId)
    .eq("active", true);
  const rows = (assignments ?? []) as AmAssignment[];

  const managerIds = Array.from(new Set(rows.map((r) => r.manager_user_id)));
  const { data: managers } = managerIds.length
    ? await supabase.from("users").select("id, email, name").in("id", managerIds)
    : { data: [] };
  const managerMap = new Map(
    ((managers ?? []) as unknown as Array<{ id: string; email: string; name: string | null }>).map((u) => [
      u.id,
      u.name ?? u.email,
    ]),
  );

  // Pull last-message previews + unread counts for the rooms that already
  // exist (C-10). Unread = messages from the other side created after the
  // caller's chat_room_members.last_read_at.
  const roomIds = rows.map((r) => r.chat_room_id).filter((id): id is string => !!id);
  const [{ data: rooms }, { data: myMemberships }, { data: recent }] = roomIds.length
    ? await Promise.all([
        supabase.from("chat_rooms").select("id, last_message_at").in("id", roomIds),
        supabase
          .from("chat_room_members")
          .select("room_id, last_read_at")
          .in("room_id", roomIds)
          .eq("user_id", session.userId),
        supabase
          .from("chat_messages")
          .select("room_id, author_id, body, created_at")
          .in("room_id", roomIds)
          .order("created_at", { ascending: false })
          .limit(200),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];
  const roomMeta = new Map(
    ((rooms ?? []) as Array<{ id: string; last_message_at: string | null }>).map((r) => [r.id, r]),
  );
  const lastReadByRoom = new Map(
    ((myMemberships ?? []) as Array<{ room_id: string; last_read_at: string | null }>).map((m) => [
      m.room_id,
      m.last_read_at,
    ]),
  );
  const snippetByRoom = new Map<string, { body: string; mine: boolean }>();
  const unreadByRoom = new Map<string, number>();
  for (const m of (recent ?? []) as Array<{
    room_id: string;
    author_id: string | null;
    body: string;
    created_at: string;
  }>) {
    if (!snippetByRoom.has(m.room_id)) {
      snippetByRoom.set(m.room_id, { body: m.body, mine: m.author_id === session.userId });
    }
    const lastRead = lastReadByRoom.get(m.room_id);
    if (m.author_id !== session.userId && (!lastRead || m.created_at > lastRead)) {
      unreadByRoom.set(m.room_id, (unreadByRoom.get(m.room_id) ?? 0) + 1);
    }
  }

  return (
    <div className="flex">
      <PortalRail group={portalNav(slug, portalPersonaForSession(session.persona))} title={t("p.shared.portal", undefined, "Portal")} />
      <div className="flex-1">
        <div className="page-content">
          <h1>{t("p.shared.messages.title", undefined, "Messages")}</h1>
          <p className="mt-1 text-xs text-[var(--p-text-2)]">
            {t(
              "p.shared.messages.subtitle",
              { projectName: project?.name ?? t("p.shared.messages.thisProject", undefined, "this project") },
              `Direct thread with your account manager for ${project?.name ?? "this project"}.`,
            )}
          </p>

          <ul className="mt-5 space-y-3">
            {rows.length === 0 ? (
              <li>
                <EmptyState
                  size="compact"
                  title={t("p.shared.messages.emptyTitle", undefined, "No Account Manager Yet")}
                  description={t(
                    "p.shared.messages.emptyDescription",
                    undefined,
                    "Once your account manager is assigned, you can DM them here. Reach the production team via your persona page for now.",
                  )}
                />
              </li>
            ) : (
              rows.map((r) => {
                const meta = r.chat_room_id ? roomMeta.get(r.chat_room_id) : null;
                const snippet = r.chat_room_id ? snippetByRoom.get(r.chat_room_id) : null;
                const unread = r.chat_room_id ? (unreadByRoom.get(r.chat_room_id) ?? 0) : 0;
                return (
                  <li key={r.id} className="surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold">
                            {managerMap.get(r.manager_user_id) ??
                              t("p.shared.messages.accountManager", undefined, "Account Manager")}
                          </span>
                          {unread > 0 && (
                            <span
                              className="rounded-full bg-[var(--p-accent)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--p-accent-contrast)]"
                              aria-label={t(
                                "p.shared.messages.unreadAria",
                                { count: String(unread) },
                                `${unread} unread messages`,
                              )}
                            >
                              {unread}
                            </span>
                          )}
                        </div>
                        <Badge variant="muted" className="mt-1">
                          {toTitle(r.persona)}
                        </Badge>
                        {snippet && (
                          <p className="mt-2 truncate text-xs text-[var(--p-text-2)]">
                            {snippet.mine ? `${t("p.shared.messages.snippetYou", undefined, "You")}: ` : ""}
                            {snippet.body}
                          </p>
                        )}
                      </div>
                      {meta?.last_message_at && (
                        <span className="font-mono text-xs text-[var(--p-text-2)]">
                          {fmt.time(meta.last_message_at)}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex justify-end">
                      {r.chat_room_id ? (
                        <Link href={`/p/${slug}/messages/${r.chat_room_id}`} className="ps-btn ps-btn--sm">
                          {t("p.shared.messages.openThread", undefined, "Open Thread")}
                        </Link>
                      ) : (
                        <form action={`/p/${slug}/messages/start`} method="post">
                          <input type="hidden" name="assignment_id" value={r.id} />
                          <button type="submit" className="ps-btn ps-btn--sm">
                            {t("p.shared.messages.startThread", undefined, "Start Thread")}
                          </button>
                        </form>
                      )}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
