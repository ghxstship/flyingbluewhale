"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, Check, Archive, AtSign, UserCheck, Inbox as InboxIcon, CheckCheck, Clock, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Alert } from "@/components/ui/Alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { timeAgo } from "@/lib/format";
import { useT } from "@/lib/i18n/LocaleProvider";
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

const TAB_ICONS: Record<InboxTab, React.ReactNode> = {
  all: <InboxIcon size={14} aria-hidden="true" />,
  unread: <Bell size={14} aria-hidden="true" />,
  mentioned: <AtSign size={14} aria-hidden="true" />,
  assigned: <UserCheck size={14} aria-hidden="true" />,
  snoozed: <Clock size={14} aria-hidden="true" />,
  done: <CheckCheck size={14} aria-hidden="true" />,
};

const TAB_ORDER: readonly InboxTab[] = ["all", "unread", "mentioned", "assigned", "snoozed", "done"];

/**
 * Snooze presets — modeled on Gmail/Linear. Hours-from-now so the
 * snooze writer can compute the timestamp server-side and we avoid
 * client/server clock drift. "Tomorrow" + "Next Week" are computed
 * client-side at click time so they always land at 9am local.
 */
const SNOOZE_PRESETS: ReadonlyArray<{ key: string; label: string; hint: string; hours: number }> = [
  { key: "laterToday", label: "Later Today", hint: "+3h", hours: 3 },
  { key: "tomorrow", label: "Tomorrow", hint: "9am", hours: hoursUntilTomorrow9am() },
  { key: "nextWeek", label: "Next Week", hint: "Mon 9am", hours: hoursUntilNextMonday9am() },
  { key: "twoWeeks", label: "Two Weeks", hint: "14d", hours: 24 * 14 },
];

function hoursUntilTomorrow9am(): number {
  const now = new Date();
  const target = new Date(now);
  target.setDate(target.getDate() + 1);
  target.setHours(9, 0, 0, 0);
  return Math.max(1, Math.round((target.getTime() - now.getTime()) / 3600 / 1000));
}

function hoursUntilNextMonday9am(): number {
  const now = new Date();
  const target = new Date(now);
  // 1 = Monday in JS Date (0 = Sunday)
  const daysUntilMonday = (1 + 7 - target.getDay()) % 7 || 7;
  target.setDate(target.getDate() + daysUntilMonday);
  target.setHours(9, 0, 0, 0);
  return Math.max(1, Math.round((target.getTime() - now.getTime()) / 3600 / 1000));
}

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
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const TAB_LABELS: Record<InboxTab, string> = {
    all: t("me.inbox.tabs.all", undefined, "All"),
    unread: t("me.inbox.tabs.unread", undefined, "Unread"),
    mentioned: t("me.inbox.tabs.mentioned", undefined, "@Mentioned"),
    assigned: t("me.inbox.tabs.assigned", undefined, "Assigned"),
    snoozed: t("me.inbox.tabs.snoozed", undefined, "Snoozed"),
    done: t("me.inbox.tabs.done", undefined, "Done"),
  };

  const EMPTY_COPY: Record<InboxTab, { title: string; description: string }> = {
    all: {
      title: t("me.inbox.empty.all.title", undefined, "No notifications yet"),
      description: t("me.inbox.empty.all.description", undefined, "Activity across the workspace will land here."),
    },
    unread: {
      title: t("me.inbox.empty.unread.title", undefined, "Inbox zero"),
      description: t("me.inbox.empty.unread.description", undefined, "Everything is read. Take a breath."),
    },
    mentioned: {
      title: t("me.inbox.empty.mentioned.title", undefined, "No mentions"),
      description: t(
        "me.inbox.empty.mentioned.description",
        undefined,
        "When someone @-mentions you on a record, it shows up here.",
      ),
    },
    assigned: {
      title: t("me.inbox.empty.assigned.title", undefined, "Nothing assigned to you"),
      description: t(
        "me.inbox.empty.assigned.description",
        undefined,
        "Tasks, requests, and reviews routed your way will land here.",
      ),
    },
    snoozed: {
      title: t("me.inbox.empty.snoozed.title", undefined, "Nothing snoozed"),
      description: t(
        "me.inbox.empty.snoozed.description",
        undefined,
        "Snooze a row to defer it — it returns to your inbox at the chosen time.",
      ),
    },
    done: {
      title: t("me.inbox.empty.done.title", undefined, "Nothing marked done"),
      description: t(
        "me.inbox.empty.done.description",
        undefined,
        "Mark items done to clear them from the active inbox; they stay searchable here.",
      ),
    },
  };

  const SNOOZE_LABELS: Record<string, { label: string; hint: string }> = {
    laterToday: {
      label: t("me.inbox.snooze.laterToday.label", undefined, "Later Today"),
      hint: t("me.inbox.snooze.laterToday.hint", undefined, "+3h"),
    },
    tomorrow: {
      label: t("me.inbox.snooze.tomorrow.label", undefined, "Tomorrow"),
      hint: t("me.inbox.snooze.tomorrow.hint", undefined, "9am"),
    },
    nextWeek: {
      label: t("me.inbox.snooze.nextWeek.label", undefined, "Next Week"),
      hint: t("me.inbox.snooze.nextWeek.hint", undefined, "Mon 9am"),
    },
    twoWeeks: {
      label: t("me.inbox.snooze.twoWeeks.label", undefined, "Two Weeks"),
      hint: t("me.inbox.snooze.twoWeeks.hint", undefined, "14d"),
    },
  };

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
          <h1 className="text-2xl font-semibold tracking-tight">{t("me.inbox.title", undefined, "Inbox")}</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {t(
              "me.inbox.subtitle",
              undefined,
              "All your activity across the platform — assignments, mentions, status changes.",
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/me/notifications"
            className="text-xs font-medium text-[var(--text-muted)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
          >
            {t("me.inbox.preferences", undefined, "Preferences")}
          </Link>
          {tab === "unread" && unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMarkAllRead}
              loading={pending}
              aria-label={t("me.inbox.markAllRead.ariaLabel", undefined, "Mark all notifications as read")}
            >
              <Check size={14} aria-hidden="true" />
              <span className="ms-1">{t("me.inbox.markAllRead.label", undefined, "Mark All Read")}</span>
            </Button>
          )}
        </div>
      </header>

      {loadError && (
        <div className="mb-4">
          <Alert kind="error">{loadError}</Alert>
        </div>
      )}

      <nav
        aria-label={t("me.inbox.filters.ariaLabel", undefined, "Inbox filters")}
        className="mb-4 flex items-center gap-1 border-b border-[var(--border-color)]"
      >
        {TAB_ORDER.map((tabKey) => {
          const active = tabKey === tab;
          return (
            <Link
              key={tabKey}
              href={tabHref(tabKey)}
              aria-current={active ? "page" : undefined}
              className={`relative -mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors ${
                active
                  ? "border-[var(--org-primary)] text-[var(--foreground)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {TAB_ICONS[tabKey]}
              <span>{TAB_LABELS[tabKey]}</span>
              {tabKey === "unread" && unreadCount > 0 && (
                <Badge
                  variant="brand"
                  shape="count"
                  aria-label={t("me.inbox.unreadCount.ariaLabel", { count: unreadCount }, `${unreadCount} unread`)}
                >
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
                      aria-label={t("me.inbox.actions.restore", undefined, "Restore to inbox")}
                      onClick={() => handleUndo(n.id)}
                      disabled={pending}
                      title={t("me.inbox.actions.restore", undefined, "Restore to inbox")}
                    >
                      <Undo2 size={14} aria-hidden="true" />
                    </Button>
                  ) : (
                    <>
                      {unread && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t("me.inbox.actions.markRead", undefined, "Mark as read")}
                          onClick={() => handleMarkRead(n.id)}
                          disabled={pending}
                          title={t("me.inbox.actions.markRead", undefined, "Mark as read")}
                        >
                          <Check size={14} aria-hidden="true" />
                        </Button>
                      )}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t("me.inbox.actions.snooze", undefined, "Snooze")}
                            disabled={pending}
                            title={t("me.inbox.actions.snooze", undefined, "Snooze")}
                          >
                            <Clock size={14} aria-hidden="true" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-44 p-1 text-sm">
                          {SNOOZE_PRESETS.map((p) => {
                            const labels = SNOOZE_LABELS[p.key] ?? { label: p.label, hint: p.hint };
                            return (
                              <button
                                key={p.key}
                                type="button"
                                className="flex w-full items-center justify-between rounded px-3 py-1.5 text-start hover:bg-[var(--surface-inset)]"
                                onClick={() => handleSnooze(n.id, p.hours)}
                                disabled={pending}
                              >
                                <span>{labels.label}</span>
                                <span className="font-mono text-[10px] text-[var(--text-muted)]">{labels.hint}</span>
                              </button>
                            );
                          })}
                        </PopoverContent>
                      </Popover>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("me.inbox.actions.markDone", undefined, "Mark done")}
                        onClick={() => handleMarkDone(n.id)}
                        disabled={pending}
                        title={t("me.inbox.actions.markDone", undefined, "Mark done")}
                      >
                        <CheckCheck size={14} aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("me.inbox.actions.archive", undefined, "Archive")}
                        onClick={() => handleArchive(n.id)}
                        disabled={pending}
                        title={t("me.inbox.actions.archive", undefined, "Archive")}
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
