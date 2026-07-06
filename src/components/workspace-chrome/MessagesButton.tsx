"use client";

import * as React from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { Hint } from "@/components/ui/Tooltip";

/**
 * Messages affordance (ADR-0007).
 *
 * Lifts the messages destination into the workspace chrome alongside
 * notifications. Each shell passes the canonical messages URL for its
 * scope — `/studio/inbox` for platform, `/p/[slug]/messages` for
 * portal, `/m/inbox` for mobile.
 *
 * Behavior MVP: this is a direct link (no popover). A future iteration
 * can mirror NotificationsBell (recent threads in a popover, click to
 * deep-link). Kept link-only for now to ship the chrome contract first.
 */
export function MessagesButton({ href, unreadCount }: { href: string; unreadCount?: number }) {
  return (
    <Hint label="Messages" side="bottom">
      <Link
        href={href}
        data-tour="messages"
        aria-label={unreadCount && unreadCount > 0 ? `Messages (${unreadCount} unread)` : "Messages"}
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--p-text-2)] hover:bg-[var(--p-surface)] hover:text-[var(--p-text-1)]"
      >
        <MessageSquare size={16} aria-hidden="true" />
        {unreadCount && unreadCount > 0 ? (
          <span
            aria-hidden="true"
            className="absolute -end-0.5 -top-0.5 h-2 w-2 rounded-full bg-[var(--p-accent)] ring-2 ring-[var(--p-bg)]"
          />
        ) : null}
      </Link>
    </Hint>
  );
}
