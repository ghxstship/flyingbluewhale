"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Check } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";

/**
 * <NotificationsBell> — closes the dead-zone flagged in IA audit §7 #4.
 *
 * Behavior (modeled on Linear + Notion):
 *   - A bell icon in the glass nav with an unread count badge.
 *   - Click opens a 360px popover with the 50 most recent rows.
 *   - Unread row has an accent dot + bold title; read rows dim.
 *   - "Mark all read" button at the top of the popover.
 *   - Row click: if `href` present, navigate + mark read; otherwise
 *     just mark read on hover + hold 1.5s (matches Linear).
 *   - Polls `/api/v1/notifications` every 60s when the tab is focused.
 */

type Notification = {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

export function NotificationsBell({ pollMs = 60_000 }: { pollMs?: number }) {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const body = (await res.json()) as {
        ok: boolean;
        data?: { notifications: Notification[]; unread: number };
      };
      if (body.ok && body.data) {
        setItems(body.data.notifications);
        setUnread(body.data.unread);
      }
    } catch {
      // Silent — a notifications poll failure is never user-visible.
    }
  }, []);

  // Load on mount + poll while the tab is visible.
  useEffect(() => {
    load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, pollMs);
    return () => clearInterval(timer);
  }, [load, pollMs]);

  async function markAllRead() {
    const prev = { items, unread };
    // Optimistic — strip read_at nulls client-side immediately.
    const now = new Date().toISOString();
    setItems((xs) => xs.map((x) => ({ ...x, read_at: x.read_at ?? now })));
    setUnread(0);
    try {
      const r = await fetch("/api/v1/notifications", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ readAll: true }),
      });
      if (!r.ok) throw new Error();
    } catch {
      setItems(prev.items);
      setUnread(prev.unread);
    }
  }

  async function markOne(id: string) {
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, read_at: new Date().toISOString() } : x)));
    setUnread((n) => Math.max(0, n - 1));
    await fetch("/api/v1/notifications", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    }).catch(() => undefined);
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--org-primary)] focus-visible:ring-offset-1"
          aria-label={unread > 0 ? `Notifications — ${unread} unread` : "Notifications"}
        >
          <Bell size={16} aria-hidden="true" />
          {unread > 0 ? (
            <span
              className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[color:var(--color-error)] px-1 text-[10px] font-semibold text-white"
              aria-hidden="true"
            >
              {unread > 99 ? "99+" : unread}
            </span>
          ) : null}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="surface-raised elevation-2 z-50 w-[360px] rounded-lg border border-[var(--border-color)] text-sm"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-color)]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Notifications
            </span>
            <button
              type="button"
              onClick={markAllRead}
              disabled={unread === 0}
              className="inline-flex items-center gap-1 text-xs hover:text-[var(--foreground)] disabled:opacity-40"
              aria-label="Mark all as read"
            >
              <Check size={12} aria-hidden="true" />
              Mark all read
            </button>
          </div>
          <div className="max-h-[420px] overflow-y-auto p-1">
            {items.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-[var(--text-muted)]">
                You&apos;re all caught up.
              </p>
            ) : (
              items.map((n) => {
                const isUnread = !n.read_at;
                const Row = (
                  <div
                    className="group flex items-start gap-2.5 rounded-md px-2.5 py-2 hover:bg-[var(--bg-secondary)]"
                    onClick={() => (isUnread ? void markOne(n.id) : null)}
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                        isUnread ? "bg-[var(--org-primary)]" : "bg-transparent"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-[13px] ${
                          isUnread ? "font-semibold text-[var(--foreground)]" : "text-[var(--text-muted)]"
                        }`}
                      >
                        {n.title}
                      </p>
                      {n.body ? (
                        <p className="mt-0.5 line-clamp-2 text-xs text-[var(--text-muted)]">{n.body}</p>
                      ) : null}
                      <p className="mt-1 text-[10px] font-mono text-[var(--text-muted)]">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
                return n.href ? (
                  <Link key={n.id} href={n.href} onClick={() => void markOne(n.id)} className="block">
                    {Row}
                  </Link>
                ) : (
                  <div key={n.id} role="button" tabIndex={0} className="block cursor-pointer">
                    {Row}
                  </div>
                );
              })
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
