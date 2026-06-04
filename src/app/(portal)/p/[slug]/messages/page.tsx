import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { projectIdFromSlug } from "@/lib/db/advancing";

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

  // Pull last-message previews for the rooms that already exist.
  const roomIds = rows.map((r) => r.chat_room_id).filter((id): id is string => !!id);
  const { data: rooms } = roomIds.length
    ? await supabase.from("chat_rooms").select("id, last_message_at").in("id", roomIds)
    : { data: [] };
  const roomMeta = new Map(
    ((rooms ?? []) as Array<{ id: string; last_message_at: string | null }>).map((r) => [r.id, r]),
  );

  return (
    <div className="flex">
      <PortalRail group={portalNav(slug, "vendor")} title={t("p.shared.portal", undefined, "Portal")} />
      <div className="flex-1">
        <div className="page-content">
          <h1 className="text-2xl font-semibold">{t("p.shared.messages.title", undefined, "Messages")}</h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
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
                return (
                  <li key={r.id} className="surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                          {managerMap.get(r.manager_user_id) ??
                            t("p.shared.messages.accountManager", undefined, "Account Manager")}
                        </div>
                        <Badge variant="muted" className="mt-1">
                          {r.persona}
                        </Badge>
                      </div>
                      {meta?.last_message_at && (
                        <span className="font-mono text-xs text-[var(--text-muted)]">
                          {fmt.time(meta.last_message_at)}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex justify-end">
                      {r.chat_room_id ? (
                        <Link href={`/m/inbox/${r.chat_room_id}`} className="btn btn-primary btn-sm">
                          {t("p.shared.messages.openThread", undefined, "Open Thread")}
                        </Link>
                      ) : (
                        <form action={`/p/${slug}/messages/start`} method="post">
                          <input type="hidden" name="assignment_id" value={r.id} />
                          <button type="submit" className="btn btn-primary btn-sm">
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
