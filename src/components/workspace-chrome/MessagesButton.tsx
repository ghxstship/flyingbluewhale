"use client";

import * as React from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";

/**
 * Messages affordance (ADR-0007).
 *
 * Lifts the messages destination into the workspace chrome alongside
 * notifications. Each shell passes the canonical messages URL for its
 * scope — `/console/inbox` for platform, `/p/[slug]/messages` for
 * portal, `/m/inbox` for mobile.
 *
 * Behavior MVP: this is a direct link (no popover). A future iteration
 * can mirror NotificationsBell (recent threads in a popover, click to
 * deep-link). Kept link-only for now to ship the chrome contract first.
 */
export function MessagesButton({ href, unreadCount }: { href: string; unreadCount?: number }) {
  return (
    <Link
      href={href}
      aria-label={unreadCount && unreadCount > 0 ? `Messages (${unreadCount} unread)` : "Messages"}
      className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--text-primary)]"
    >
      <MessageSquare size={16} aria-hidden="true" />
      {unreadCount && unreadCount > 0 ? (
        <span
          aria-hidden="true"
          className="absolute -end-0.5 -top-0.5 h-2 w-2 rounded-full bg-[var(--org-primary)] ring-2 ring-[var(--background)]"
        />
      ) : null}
    </Link>
  );
}
