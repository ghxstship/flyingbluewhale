import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
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
  if (!hasSupabase) {
    return <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">Configure Supabase.</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const relativeTime = (iso: string): string => {
    const ms = Date.now() - new Date(iso).getTime();
    const min = Math.floor(ms / 60_000);
    if (min < 1) return "just now";
    if (min < 60) return `${min}m`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day}d`;
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
      <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">Mobile</div>
      <h1 className="mt-1 text-2xl font-semibold">Notifications</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        {rows.length === 0 ? "All caught up." : `${unread} unread of ${rows.length} recent`}
        {" · "}
        <Link href="/me/notifications" className="text-[var(--org-primary)]">
          settings
        </Link>
      </p>

      <ul className="mt-5 space-y-2">
        {rows.length === 0 ? (
          <li>
            <EmptyState
              size="compact"
              title="No Notifications"
              description="You're all caught up. New notifications will appear here."
            />
          </li>
        ) : (
          rows.map((n) => {
            const inner = (
              <div className={`surface flex items-start gap-3 p-4 ${n.read_at ? "opacity-70" : ""}`}>
                <div className="mt-1 flex-none">
                  <span
                    className={`block h-2 w-2 rounded-full ${n.read_at ? "bg-[var(--text-muted)]" : "bg-[var(--org-primary)]"}`}
                    aria-hidden
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm leading-snug font-medium">{n.title}</div>
                    <span className="flex-none font-mono text-xs text-[var(--text-muted)]">
                      {relativeTime(n.created_at)}
                    </span>
                  </div>
                  {n.body && <p className="mt-1 text-xs text-[var(--text-secondary)]">{n.body}</p>}
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
