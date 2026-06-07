import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";

export const dynamic = "force-dynamic";

/**
 * Portal notifications inbox. Reads `public.notifications` filtered to
 * the caller. The notifications table feeds every shell — this surface
 * gives portal recipients (vendors / delegates / sponsors / etc.) a
 * dedicated view that doesn't require them to deep-link in from emails.
 */

type Row = {
  id: string;
  title: string | null;
  body: string | null;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

export default async function PortalInboxPage({ params }: { params: Promise<{ slug: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="page-content">{t("p.shared.inbox.configureSupabase", undefined, "Configure Supabase.")}</div>
    );
  const { slug } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("notifications")
    .select("id, title, body, href, read_at, created_at")
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false })
    .limit(100);
  const rows = (data ?? []) as Row[];
  const unread = rows.filter((r) => !r.read_at).length;

  return (
    <div className="flex">
      <PortalRail group={portalNav(slug, "crew")} title={t("p.shared.inbox.railTitle", undefined, "Portal")} />
      <div className="flex-1">
        <div className="page-content">
          <h1 className="text-2xl font-semibold">{t("p.shared.inbox.title", undefined, "Inbox")}</h1>
          <p className="mt-1 text-xs text-[var(--p-text-2)]">
            {t("p.shared.inbox.unreadOf", { unread, total: rows.length }, `${unread} unread of ${rows.length}.`)}
          </p>

          <ul className="mt-5 space-y-2">
            {rows.length === 0 ? (
              <li>
                <EmptyState
                  size="compact"
                  title={t("p.shared.inbox.empty.title", undefined, "No Notifications")}
                  description={t(
                    "p.shared.inbox.empty.description",
                    undefined,
                    "Production-team pings, deliverable updates, and contract decisions land here.",
                  )}
                />
              </li>
            ) : (
              rows.map((n) => {
                const Body = (
                  <div className={`surface p-4 ${n.read_at ? "opacity-60" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                          {n.title ?? t("p.shared.inbox.fallbackTitle", undefined, "Notification")}
                        </div>
                        {n.body && <p className="mt-1 line-clamp-2 text-xs text-[var(--p-text-2)]">{n.body}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {!n.read_at && <Badge variant="warning">{t("p.shared.inbox.new", undefined, "New")}</Badge>}
                        <span className="font-mono text-xs text-[var(--p-text-2)]">{fmt.time(n.created_at)}</span>
                      </div>
                    </div>
                  </div>
                );
                return <li key={n.id}>{n.href ? <a href={n.href}>{Body}</a> : Body}</li>;
              })
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
