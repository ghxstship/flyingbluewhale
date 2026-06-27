import type { ReactNode } from "react";
import { Avatar } from "./Avatar";

/**
 * <ActivityTimeline> — the cohort-community-class community feed primitive. A
 * vertical stream of contribution events (posts, replies, completions,
 * awards) with actor avatar, verb, optional body, and a relative time.
 * Token-only.
 */
export type ActivityItem = {
  id: string;
  actorName: string;
  actorAvatarUrl?: string | null;
  /** the verb phrase, e.g. "posted in", "completed", "earned". */
  action: string;
  /** optional target/object of the action, emphasized. */
  target?: string;
  /** relative or absolute time label, pre-formatted by the caller. */
  time: string;
  body?: ReactNode;
  /** small leading glyph rendered over the avatar (e.g. an award icon). */
  badge?: ReactNode;
};

export function ActivityTimeline({ items, emptyLabel = "No activity yet" }: { items: ActivityItem[]; emptyLabel?: string }) {
  if (!items.length) {
    return <p className="px-1 py-6 text-center text-sm text-[var(--p-text-2)]">{emptyLabel}</p>;
  }
  return (
    <ol className="relative flex flex-col">
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <li key={it.id} className="relative flex gap-3 pb-5">
            {!last && (
              <span
                aria-hidden="true"
                className="absolute left-[15px] top-9 w-px"
                style={{ height: "calc(100% - 1.75rem)", background: "var(--p-border)" }}
              />
            )}
            <div className="relative shrink-0">
              <Avatar size="sm" name={it.actorName} src={it.actorAvatarUrl ?? undefined} />
              {it.badge && (
                <span
                  className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full"
                  style={{ background: "var(--p-accent)", color: "var(--p-accent-cta-contrast)" }}
                >
                  {it.badge}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm text-[var(--p-text-1)]">
                <span className="font-semibold">{it.actorName}</span> <span className="text-[var(--p-text-2)]">{it.action}</span>
                {it.target && <span className="font-medium"> {it.target}</span>}
              </div>
              {it.body && <div className="mt-1 text-sm text-[var(--p-text-2)]">{it.body}</div>}
              <div className="mt-0.5 text-xs text-[var(--p-text-3)]">{it.time}</div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
