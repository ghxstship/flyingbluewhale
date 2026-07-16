"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ActionBar, KIcon, SwipeRow } from "@/components/mobile/kit";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/lib/hooks/useToast";
import { useT } from "@/lib/i18n/LocaleProvider";
import { setRoomRead } from "./actions";

export type InboxRow = {
  id: string;
  name: string;
  kind: "channel" | "dm";
  last: string;
  time: string;
  /** Epoch millis of the newest message — the "recent" sort key. */
  stamp: number;
  unread: number;
  initials: string;
};

/**
 * COMPVSS · My Inbox — kit 28 `tab === "inbox"` verbatim.
 *
 * The page rendered the rows and nothing else: no ActionBar (the kit spec
 * says one sits on EVERY list screen), no swipe actions, no FAB. This is the
 * kit's shape: eyebrow unread count, search + sort (Recent/Unread/Name) +
 * kind filter (Channels/DMs with a reset), Channels and Direct Messages
 * sections that collapse to a flat list while a kind filter is active, swipe
 * Read/Unread, and the New Message FAB.
 *
 * Two deliberate divergences, both flagged rather than faked:
 *  - The kit's swipe row also carries Flag and Archive, which in the
 *    prototype only fire a toast — there is no flag or archive store in
 *    either the kit or the repo. A toast saying "Archived" over a row that
 *    stays put is a placebo, so the two actions are omitted until the kit
 *    gives them a store.
 *  - The kit's DM avatars carry an online dot. The repo has no presence
 *    store; a hardcoded dot would claim someone is reachable when nobody
 *    knows. Omitted for the same reason.
 */
export function InboxView({ rows, eyebrow, title }: { rows: InboxRow[]; eyebrow: string; title: string }) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const [kinds, setKinds] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const items = useMemo(() => {
    const q = query.toLowerCase();
    return rows
      .filter((r) => kinds.size === 0 || kinds.has(r.kind))
      .filter((r) => !q || `${r.name} ${r.last}`.toLowerCase().includes(q))
      .sort((a, b) =>
        sort === "unread" ? b.unread - a.unread : sort === "name" ? a.name.localeCompare(b.name) : b.stamp - a.stamp,
      );
  }, [rows, query, kinds, sort]);

  const markRead = (r: InboxRow, read: boolean) => {
    const fd = new FormData();
    fd.set("roomId", r.id);
    fd.set("read", read ? "1" : "");
    startTransition(async () => {
      const res = await setRoomRead(null, fd);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.info(
        read ? t("m.inbox.markedRead", undefined, "Marked read") : t("m.inbox.markedUnread", undefined, "Marked unread"),
        { description: r.name },
      );
      router.refresh();
    });
  };

  const chatRow = (r: InboxRow) => (
    <SwipeRow
      key={r.id}
      actions={[
        {
          icon: r.unread > 0 ? "MailOpen" : "Mail",
          label: r.unread > 0 ? t("m.inbox.read", undefined, "Read") : t("m.inbox.unreadAction", undefined, "Unread"),
          tone: "info",
          on: () => markRead(r, r.unread > 0),
        },
      ]}
    >
      <Link
        href={`/m/inbox/${r.id}`}
        className="item tap"
        style={{ margin: 0, cursor: "pointer", textDecoration: "none", color: "inherit" }}
      >
        {r.kind === "channel" ? <span className="chan">#</span> : <span className="avatar-sm">{r.initials}</span>}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="t">{r.name}</div>
          <div className="s" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {r.last}
          </div>
        </div>
        <span style={{ textAlign: "right", flex: "none" }}>
          {r.time && <div className="time">{r.time}</div>}
          {r.unread > 0 && <div className="unread" style={{ marginTop: 5, marginLeft: "auto" }}>{r.unread}</div>}
        </span>
      </Link>
    </SwipeRow>
  );

  const toggleKind = (k: string) =>
    setKinds((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  const channels = items.filter((r) => r.kind === "channel");
  const dms = items.filter((r) => r.kind === "dm");

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{eyebrow}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {title}
      </h1>

      <ActionBar
        k="ib"
        query={query}
        setQuery={setQuery}
        placeholder={t("m.inbox.search", undefined, "Search Messages…")}
        sort={sort}
        setSort={setSort}
        sortOpts={[
          ["recent", t("m.inbox.sort.recent", undefined, "Recent")],
          ["unread", t("m.inbox.sort.unread", undefined, "Unread")],
          ["name", t("m.inbox.sort.name", undefined, "Name")],
        ]}
        filterActive={kinds.size}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        filterChildren={
          <>
            <div className="wl" style={{ marginBottom: 8 }}>
              {t("m.inbox.type", undefined, "Type")}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 10 }}>
              {(
                [
                  ["channel", t("m.inbox.channels", undefined, "Channels")],
                  ["dm", t("m.inbox.directMessages", undefined, "Direct Messages")],
                ] as const
              ).map(([id, label]) => (
                <button key={id} type="button" className={`chip ${kinds.has(id) ? "on" : ""}`} onClick={() => toggleKind(id)}>
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="pill"
              style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
              onClick={() => setKinds(new Set())}
            >
              {t("m.inbox.resetFilters", undefined, "Reset Filters")}
            </button>
          </>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          title={t("m.inbox.emptyTitle", undefined, "No Conversations")}
          description={t("m.inbox.emptyHint", undefined, "Channels and direct messages land here.")}
        />
      ) : kinds.size === 0 ? (
        <>
          {channels.length > 0 && (
            <div className="sech" style={{ marginTop: 0 }}>
              <h2>{t("m.inbox.channels", undefined, "Channels")}</h2>
            </div>
          )}
          {channels.map(chatRow)}
          {dms.length > 0 && (
            <div className="sech">
              <h2>{t("m.inbox.directMessages", undefined, "Direct Messages")}</h2>
            </div>
          )}
          {dms.map(chatRow)}
        </>
      ) : (
        items.map(chatRow)
      )}

      {/* Kit FAB: New Message. */}
      <Link href="/m/inbox/new" className="fab" aria-label={t("m.inbox.new", undefined, "New Message")}>
        <KIcon name="Plus" size={22} />
      </Link>
    </div>
  );
}
