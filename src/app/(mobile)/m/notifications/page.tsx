import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type NotificationRow = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  href: string | null;
  created_at: string;
  read_at: string | null;
};

export default async function NotificationsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--p-text-2)]">
        {t("common.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const relativeTime = (iso: string): string => {
    const ms = Date.now() - new Date(iso).getTime();
    const min = Math.floor(ms / 60_000);
    if (min < 1) return t("common.time.justNow", undefined, "just now");
    if (min < 60) return t("common.time.minutesShort", { n: min }, `${min}m`);
    const hr = Math.floor(min / 60);
    if (hr < 24) return t("common.time.hoursShort", { n: hr }, `${hr}h`);
    const day = Math.floor(hr / 24);
    if (day < 7) return t("common.time.daysShort", { n: day }, `${day}d`);
    return fmt.dateParts(iso, { month: "short", day: "numeric" });
  };
  const { data } = await supabase
    .from("notifications")
    .select("id, kind, title, body, href, created_at, read_at")
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);
  const rows = (data ?? []) as NotificationRow[];
  const unread = rows.filter((n) => n.read_at == null).length;

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--p-accent)] uppercase">
        {t("m.notifications.eyebrow", undefined, "Mobile")}
      </div>
      <h1 className="mt-1 text-2xl font-semibold">{t("m.notifications.title", undefined, "Notifications")}</h1>
      <p className="mt-1 text-xs text-[var(--p-text-2)]">
        {rows.length === 0
          ? t("m.notifications.allCaughtUp", undefined, "All caught up.")
          : t(
              "m.notifications.unreadOfRecent",
              { unread, total: rows.length },
              `${unread} unread of ${rows.length} recent`,
            )}
        {" · "}
        <Link href="/me/notifications" className="text-[var(--p-accent)]">
          {t("m.notifications.settingsLink", undefined, "settings")}
        </Link>
      </p>

      <ul className="mt-5 space-y-2">
        {rows.length === 0 ? (
          <li>
            <EmptyState
              size="compact"
              title={t("m.notifications.empty.title", undefined, "No Notifications")}
              description={t(
                "m.notifications.empty.description",
                undefined,
                "You're all caught up. New notifications will appear here.",
              )}
            />
          </li>
        ) : (
          rows.map((n) => {
            const inner = (
              <div className={`surface flex items-start gap-3 p-4 ${n.read_at ? "opacity-70" : ""}`}>
                <div className="mt-1 flex-none">
                  <span
                    className={`block h-2 w-2 rounded-full ${n.read_at ? "bg-[var(--p-text-2)]" : "bg-[var(--p-accent)]"}`}
                    aria-hidden
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm leading-snug font-medium">{n.title}</div>
                    <span className="flex-none font-mono text-xs text-[var(--p-text-2)]">
                      {relativeTime(n.created_at)}
                    </span>
                  </div>
                  {n.body && <p className="mt-1 text-xs text-[var(--p-text-2)]">{n.body}</p>}
                  <div className="mt-2">
                    <Badge variant="muted">{toTitle(n.kind)}</Badge>
                  </div>
                </div>
              </div>
            );
            return <li key={n.id}>{n.href ? <Link href={n.href}>{inner}</Link> : inner}</li>;
          })
        )}
      </ul>
    </div>
  );
}
