import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { markAnnouncementRead } from "./feed-action";

/**
 * Shared announcements feed (ADR-0008 Move 1 — proof of pattern).
 *
 * Same query + render across COMPVSS (`/m/feed`) and the portal crew
 * persona (`/p/[slug]/crew/feed`). Caller passes the variant (drives a
 * subtle layout/spacing difference) + the revalidate path the
 * markRead form should re-render after upsert.
 *
 * The shared the deskless-workforce suite component pattern this file proves: extract
 * the surface body into a server component under
 * `src/components/workforce/`, parameterize per-shell concerns (path
 * for revalidate, eyebrow label), let both shells mount the same
 * component. Remaining 7 surfaces (chat, kudos, learning, time-off,
 * docs, directory, schedule) follow this template in dedicated PRs.
 */

type Row = {
  id: string;
  title: string;
  body: string;
  audience: string;
  pinned: boolean;
  published_at: string | null;
};

export async function FeedSurface({
  variant,
  revalidatePath: revalidate,
  eyebrowLabel,
  titleLabel,
}: {
  variant: "mobile" | "portal";
  /** Path to revalidate after a mark-as-read action — typically the same
   *  page the surface is mounted on. */
  revalidatePath: string;
  /** Eyebrow text (e.g. "Mobile" or "Crew"). Falls back to a generic
   *  variant-derived label. */
  eyebrowLabel?: string;
  /** Title text (e.g. "Updates" or "Feed"). */
  titleLabel?: string;
}) {
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

  const containerClass = variant === "mobile" ? "px-4 pt-6 pb-24" : "page-content";
  const eyebrow = eyebrowLabel ?? (variant === "mobile" ? t("m.feed.eyebrow", undefined, "Mobile") : "Crew");
  const title = titleLabel ?? t("m.feed.title", undefined, "Updates");

  return (
    <div className={containerClass}>
      <RealtimeRefresh
        channelName={`feed-${variant}-${session.orgId}`}
        table="announcements"
        filter={`org_id=eq.${session.orgId}`}
      />
      <div className="text-xs font-semibold tracking-wider text-[var(--p-accent)] uppercase">{eyebrow}</div>
      <h1 className="mt-1 text-2xl font-semibold">{title}</h1>
      <p className="mt-1 text-xs text-[var(--p-text-2)]">
        {rows.length === 0
          ? t("m.feed.noUpdatesYet", undefined, "No updates yet.")
          : t("m.feed.unreadOfTotal", { unread, total: rows.length }, `${unread} unread of ${rows.length}`)}
      </p>

      <ul className="mt-5 space-y-3">
        {rows.length === 0 ? (
          <li>
            <EmptyState
              size="compact"
              title={t("m.feed.empty.title", undefined, "No Updates")}
              description={t("m.feed.empty.description", undefined, "Org announcements will appear here.")}
            />
          </li>
        ) : (
          rows.map((a) => {
            const read = readSet.has(a.id);
            return (
              <li key={a.id} className={`surface p-4 ${read ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {a.pinned && <Badge variant="warning">{t("m.feed.pinned", undefined, "Pinned")}</Badge>}
                    <Badge variant="muted">{toTitle(a.audience)}</Badge>
                  </div>
                  <span className="font-mono text-xs text-[var(--p-text-2)]">
                    {a.published_at ? fmt.date(a.published_at) : ""}
                  </span>
                </div>
                <h2 className="mt-2 text-sm font-semibold">{a.title}</h2>
                <p className="mt-1 text-xs whitespace-pre-wrap text-[var(--p-text-2)]">{a.body}</p>
                {!read && (
                  <form action={markAnnouncementRead} className="mt-3 flex justify-end">
                    <input type="hidden" name="announcementId" value={a.id} />
                    <input type="hidden" name="revalidate" value={revalidate} />
                    <button type="submit" className="ps-btn ps-btn--ghost ps-btn--sm">
                      {t("m.feed.markRead", undefined, "Mark Read")}
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
