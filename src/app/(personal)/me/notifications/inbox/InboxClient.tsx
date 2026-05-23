"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, Check, Archive, AtSign, UserCheck, Inbox as InboxIcon, CheckCheck, Clock, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Alert } from "@/components/ui/Alert";
import { timeAgo } from "@/lib/format";
import { markReadAction, markAllReadAction, archiveAction, markDoneAction, snoozeAction, undoAction } from "./actions";

export type InboxTab = "all" | "unread" | "mentioned" | "assigned" | "snoozed" | "done";

export type InboxNotification = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  href: string | null;
  read_at: string | null;
  created_at: string;
  done_at?: string | null;
  snoozed_until?: string | null;
};

const TAB_LABELS: Record<InboxTab, string> = {
  all: "All",
  unread: "Unread",
  mentioned: "@Mentioned",
  assigned: "Assigned",
  snoozed: "Snoozed",
  done: "Done",
};

const TAB_ICONS: Record<InboxTab, React.ReactNode> = {
  all: <InboxIcon size={14} aria-hidden="true" />,
  unread: <Bell size={14} aria-hidden="true" />,
  mentioned: <AtSign size={14} aria-hidden="true" />,
  assigned: <UserCheck size={14} aria-hidden="true" />,
  snoozed: <Clock size={14} aria-hidden="true" />,
  done: <CheckCheck size={14} aria-hidden="true" />,
};

const TAB_ORDER: readonly InboxTab[] = ["all", "unread", "mentioned", "assigned", "snoozed", "done"];

const EMPTY_COPY: Record<InboxTab, { title: string; description: string }> = {
  all: {
    title: "No notifications yet",
    description: "Activity across the workspace will land here.",
  },
  unread: {
    title: "Inbox zero",
    description: "Everything is read. Take a breath.",
  },
  mentioned: {
    title: "No mentions",
    description: "When someone @-mentions you on a record, it shows up here.",
  },
  assigned: {
    title: "Nothing assigned to you",
    description: "Tasks, requests, and reviews routed your way will land here.",
  },
  snoozed: {
    title: "Nothing snoozed",
    description: "Snooze a row to defer it — it returns to your inbox at the chosen time.",
  },
  done: {
    title: "Nothing marked done",
    description: "Mark items done to clear them from the active inbox; they stay searchable here.",
  },
};

export function InboxClient({
  tab,
  notifications,
  unreadCount,
  loadError,
}: {
  tab: InboxTab;
  notifications: InboxNotification[];
  unreadCount: number;
  loadError: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function tabHref(target: InboxTab): string {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (target === "unread") {
      params.delete("tab");
    } else {
      params.set("tab", target);
    }
    const qs = params.toString();
    return qs ? `/me/notifications/inbox?${qs}` : "/me/notifications/inbox";
  }

  function handleRowClick(n: InboxNotification, e: React.MouseEvent<HTMLAnchorElement>) {
    // Let modifier-clicks open the destination in a new tab without
    // optimistically marking-as-read on this surface.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (n.read_at) return;
    const fd = new FormData();
    fd.set("id", n.id);
    startTransition(async () => {
      await markReadAction(null, fd);
      router.refresh();
    });
  }

  async function handleMarkRead(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      await markReadAction(null, fd);
      router.refresh();
    });
  }

  async function handleArchive(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      await archiveAction(null, fd);
      router.refresh();
    });
  }

  async function handleMarkAllRead() {
    startTransition(async () => {
      await markAllReadAction(null, new FormData());
      router.refresh();
    });
  }

  async function handleMarkDone(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      await markDoneAction(null, fd);
      router.refresh();
    });
  }

  async function handleSnooze(id: string, hours: number) {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("hours", String(hours));
    startTransition(async () => {
      await snoozeAction(null, fd);
      router.refresh();
    });
  }

  async function handleUndo(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      await undoAction(null, fd);
      router.refresh();
    });
  }

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            All your activity across the platform — assignments, mentions, status changes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/me/notifications"
            className="text-xs font-medium text-[var(--text-muted)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
          >
            Preferences
          </Link>
          {tab === "unread" && unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMarkAllRead}
              loading={pending}
              aria-label="Mark all notifications as read"
            >
              <Check size={14} aria-hidden="true" />
              <span className="ms-1">Mark All Read</span>
            </Button>
          )}
        </div>
      </header>

      {loadError && (
        <div className="mb-4">
          <Alert kind="error">{loadError}</Alert>
        </div>
      )}

      <nav aria-label="Inbox filters" className="mb-4 flex items-center gap-1 border-b border-[var(--border-color)]">
        {TAB_ORDER.map((t) => {
          const active = t === tab;
          return (
            <Link
              key={t}
              href={tabHref(t)}
              aria-current={active ? "page" : undefined}
              className={`relative -mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors ${
                active
                  ? "border-[var(--org-primary)] text-[var(--foreground)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {TAB_ICONS[t]}
              <span>{TAB_LABELS[t]}</span>
              {t === "unread" && unreadCount > 0 && (
                <Badge variant="brand" shape="count" aria-label={`${unreadCount} unread`}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {notifications.length === 0 ? (
        <EmptyState title={EMPTY_COPY[tab].title} description={EMPTY_COPY[tab].description} />
      ) : (
        <ul className="surface divide-y divide-[var(--border-color)]" aria-busy={pending || undefined}>
          {notifications.map((n) => {
            const unread = !n.read_at;
            return (
              <li
                key={n.id}
                className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                  unread ? "bg-[var(--surface-raised)]" : ""
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
                    unread ? "bg-[var(--org-primary)]" : "bg-transparent"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  {n.href ? (
                    <Link
                      href={n.href}
                      onClick={(e) => handleRowClick(n, e)}
                      className="block focus-visible:ring-2 focus-visible:ring-[var(--org-primary)] focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      <NotificationBody notification={n} />
                    </Link>
                  ) : (
                    <NotificationBody notification={n} />
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {n.done_at || n.snoozed_until ? (
                    // Restoreable state — single Undo replaces the
                    // read/snooze/done action rail.
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Restore to inbox"
                      onClick={() => handleUndo(n.id)}
                      disabled={pending}
                      title="Restore to inbox"
                    >
                      <Undo2 size={14} aria-hidden="true" />
                    </Button>
                  ) : (
                    <>
                      {unread && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Mark as read"
                          onClick={() => handleMarkRead(n.id)}
                          disabled={pending}
                          title="Mark as read"
                        >
                          <Check size={14} aria-hidden="true" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Snooze 1 hour"
                        onClick={() => handleSnooze(n.id, 1)}
                        disabled={pending}
                        title="Snooze 1 hour"
                      >
                        <Clock size={14} aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Mark done"
                        onClick={() => handleMarkDone(n.id)}
                        disabled={pending}
                        title="Mark done"
                      >
                        <CheckCheck size={14} aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Archive"
                        onClick={() => handleArchive(n.id)}
                        disabled={pending}
                        title="Archive"
                      >
                        <Archive size={14} aria-hidden="true" />
                      </Button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function NotificationBody({ notification }: { notification: InboxNotification }) {
  return (
    <>
      <div className="flex items-center gap-2">
        <h3
          className={`truncate text-sm ${
            notification.read_at ? "font-medium text-[var(--text-secondary)]" : "font-semibold text-[var(--foreground)]"
          }`}
        >
          {notification.title}
        </h3>
        <Badge variant="muted" className="font-mono text-[10px]">
          {notification.kind}
        </Badge>
      </div>
      {notification.body && <p className="mt-1 line-clamp-2 text-sm text-[var(--text-muted)]">{notification.body}</p>}
      <p className="mt-1 text-xs text-[var(--text-muted)]">{timeAgo(notification.created_at)}</p>
    </>
  );
}
