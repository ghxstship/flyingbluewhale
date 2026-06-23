import { Bookmark, UserPlus, CalendarCheck, MessageSquare, ListPlus } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * ActivityTimeline — the GVTEWAY friend-activity feed (design_handoff §2,
 * Dice × Radiate). Renders rows from `public.activity`
 * (20260623120000_gvteway_consumer.sql) — saves, follows, attendances, posts,
 * lists. Presentational + server-safe: the page resolves rows once the
 * migration is applied (item 4); until then it renders the firstRun empty
 * state via `EmptyState`.
 *
 * Token-only colors. No partner logos.
 */
export type ActivityVerb = "saved" | "followed" | "attended" | "posted" | "listed";

export type ActivityRow = {
  id: string;
  actorName: string;
  verb: ActivityVerb;
  /** Human-readable object label (event name, scene name, person, …). */
  objectLabel: string;
  /** Optional in-app href for the object. */
  objectHref?: string;
  /** ISO timestamp; rendered relative. */
  at: string;
};

const VERB_META: Record<ActivityVerb, { icon: typeof Bookmark; phrase: string }> = {
  saved: { icon: Bookmark, phrase: "saved" },
  followed: { icon: UserPlus, phrase: "started following" },
  attended: { icon: CalendarCheck, phrase: "is going to" },
  posted: { icon: MessageSquare, phrase: "posted in" },
  listed: { icon: ListPlus, phrase: "added to a list" },
};

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.round(days / 7)}w`;
}

export function ActivityTimeline({
  items,
  emptyTitle = "No activity yet",
  emptyDescription = "Follow friends and scenes — their saves, RSVPs, and posts land here.",
}: {
  items: ActivityRow[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <ol className="space-y-1">
      {items.map((row) => {
        const meta = VERB_META[row.verb];
        const Icon = meta.icon;
        return (
          <li
            key={row.id}
            className="surface flex items-start gap-3 rounded-[var(--p-r-md)] p-3"
          >
            <span
              aria-hidden="true"
              className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-[var(--p-surface-2)] text-[var(--p-accent)]"
            >
              <Icon size={15} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug text-[var(--p-text-1)]">
                <span className="font-semibold">{row.actorName}</span>{" "}
                <span className="text-[var(--p-text-2)]">{meta.phrase}</span>{" "}
                {row.objectHref ? (
                  <a href={row.objectHref} className="font-medium text-[var(--p-accent-text)] hover:underline">
                    {row.objectLabel}
                  </a>
                ) : (
                  <span className="font-medium">{row.objectLabel}</span>
                )}
              </p>
              <p className="mt-0.5 font-mono text-[11px] tracking-wide text-[var(--p-text-3)]">
                {relativeTime(row.at)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
