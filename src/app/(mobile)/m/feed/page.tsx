import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { markAnnouncementRead } from "./actions";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  title: string;
  body: string;
  audience: string;
  pinned: boolean;
  published_at: string | null;
};

export default async function MobileFeedPage() {
  if (!hasSupabase) {
    return <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">Configure Supabase.</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const [{ data: announcements }, { data: reads }] = await Promise.all([
    supabase
      .from("announcements")
      .select("id, title, body, audience, pinned, published_at")
      .eq("org_id", session.orgId)
      .eq("publish_state", "published")
      .is("deleted_at", null)
      .order("pinned", { ascending: false })
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(50),
    supabase.from("announcement_reads").select("announcement_id").eq("user_id", session.userId),
  ]);

  const readSet = new Set<string>(((reads ?? []) as Array<{ announcement_id: string }>).map((r) => r.announcement_id));
  const rows = (announcements ?? []) as Row[];
  const unread = rows.filter((r) => !readSet.has(r.id)).length;

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">Mobile</div>
      <h1 className="mt-1 text-2xl font-semibold">Updates</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        {rows.length === 0 ? "No updates yet." : `${unread} unread of ${rows.length}`}
      </p>

      <ul className="mt-5 space-y-3">
        {rows.length === 0 ? (
          <li>
            <EmptyState size="compact" title="No Updates" description="Org announcements will appear here." />
          </li>
        ) : (
          rows.map((a) => {
            const read = readSet.has(a.id);
            return (
              <li key={a.id} className={`surface p-4 ${read ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {a.pinned && <Badge variant="warning">Pinned</Badge>}
                    <Badge variant="muted">{a.audience}</Badge>
                  </div>
                  <span className="font-mono text-xs text-[var(--text-muted)]">
                    {a.published_at ? fmt.date(a.published_at) : ""}
                  </span>
                </div>
                <h2 className="mt-2 text-sm font-semibold">{a.title}</h2>
                <p className="mt-1 text-xs whitespace-pre-wrap text-[var(--text-secondary)]">{a.body}</p>
                {!read && (
                  <form action={markAnnouncementRead} className="mt-3 flex justify-end">
                    <input type="hidden" name="announcementId" value={a.id} />
                    <button type="submit" className="btn btn-secondary btn-sm">
                      Mark Read
                    </button>
                  </form>
                )}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
