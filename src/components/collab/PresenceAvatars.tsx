"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Hint } from "@/components/ui/Tooltip";
import type { PresentUser } from "@/lib/realtime/usePresenceChannel";

/**
 * Stacked overlapping avatars for live presence on a record. Renders nothing
 * if `peers` is empty — keep the header uncluttered when the user is alone.
 *
 * The display order is stable by `joinedAt` so newer joiners appear at the
 * end of the stack rather than reshuffling on every sync tick.
 */
export function PresenceAvatars({
  peers,
  max = 5,
  isOnline,
}: {
  peers: PresentUser[];
  max?: number;
  isOnline: boolean;
}) {
  if (peers.length === 0) return null;

  const sorted = [...peers].sort((a, b) => a.joinedAt - b.joinedAt);
  const shown = sorted.slice(0, max);
  const overflow = Math.max(0, sorted.length - max);

  return (
    <div className="flex items-center gap-2" aria-label={`${peers.length} viewer${peers.length === 1 ? "" : "s"}`}>
      <div className="flex -space-x-1.5">
        {shown.map((p) => (
          <Hint key={`${p.userId}-${p.joinedAt}`} label={p.displayName} side="bottom">
            <span className="rounded-full ring-2 ring-[var(--background)]">
              <Avatar src={p.avatarUrl} name={p.displayName} size="sm" />
            </span>
          </Hint>
        ))}
        {overflow > 0 && (
          <Hint
            label={sorted
              .slice(max)
              .map((p) => p.displayName)
              .join(", ")}
            side="bottom"
          >
            <span className="rounded-full ring-2 ring-[var(--background)]">
              <Avatar name={`+${overflow}`} size="sm" />
            </span>
          </Hint>
        )}
      </div>
      {isOnline && (
        <span
          className="inline-flex items-center gap-1 text-[11px] font-medium tracking-wide text-[var(--text-muted)] uppercase"
          aria-label="Live presence"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Live
        </span>
      )}
    </div>
  );
}
