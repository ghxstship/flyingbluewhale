"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ActionBar,
  DataTable,
  EmptySkeleton,
  GroupedList,
  KIcon,
  SwipeRow,
  TogRow,
  UndoBar,
  useUndo,
} from "@/components/mobile/kit";
import type { ViewMode } from "@/components/mobile/kit";
import { useToast } from "@/lib/hooks/useToast";
import { useT } from "@/lib/i18n/LocaleProvider";
import { AcknowledgeButton } from "./AcknowledgeButton";
import { setAlertDismissed, setAlertFlag, setAlertRead } from "./actions";

/**
 * AlertsList — client leaf for /m/notifications (the bell feed; it wore
 * /m/alerts before kit 28, and kit 29 gave that path to the crisis alert
 * log). Kit ActionBar with the kit 31 enum sets (view list/table · group
 * None/Type · sort Time/Type/Name · tone filter), and the v2.7 swipe canon on
 * every OWN row: Flag (danger) · Read/Unread (info) · Dismiss (danger,
 * soft-delete with 5s undo). Read rows dim; the bell count is the server's
 * unread count, refreshed after every write. Broadcast rows (user_id NULL)
 * carry no per-user row state — RLS only permits own-row updates — so they
 * keep the Acknowledge affordance and no swipe zone.
 */

export type AlertItem = {
  id: string;
  title: string;
  body: string;
  tone: "warn" | "ok" | "info" | "neutral";
  /** Humanized `kind` — the kit's Type column/group. */
  typeLabel: string;
  color: string;
  iconName: string;
  when: string;
  read: boolean;
  flagged: boolean;
  /** True when the row belongs to the caller (swipe writes allowed). */
  own: boolean;
  sortAt: string;
};

export function AlertsList({ items }: { items: AlertItem[] }) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("list");
  const [group, setGroup] = useState("none");
  const [sort, setSort] = useState("time");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [tones, setTones] = useState<Set<AlertItem["tone"]>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  // Optimistic swipe state.
  const [gone, setGone] = useState<Set<string>>(new Set());
  const [readOverride, setReadOverride] = useState<Map<string, boolean>>(new Map());
  const [flagOverride, setFlagOverride] = useState<Map<string, boolean>>(new Map());
  const { undo, withUndo, clearUndo } = useUndo();

  const isRead = (a: AlertItem) => readOverride.get(a.id) ?? a.read;
  const isFlagged = (a: AlertItem) => flagOverride.get(a.id) ?? a.flagged;

  const toggleTone = (tone: AlertItem["tone"]) =>
    setTones((s) => {
      const n = new Set(s);
      if (n.has(tone)) n.delete(tone);
      else n.add(tone);
      return n;
    });

  const toneLabels: Record<AlertItem["tone"], string> = {
    warn: t("m.alerts.filter.urgent", undefined, "Urgent"),
    ok: t("m.alerts.filter.approvals", undefined, "Approvals"),
    info: t("m.alerts.filter.updates", undefined, "Updates"),
    neutral: t("m.alerts.filter.general", undefined, "General"),
  };
  const presentTones = useMemo(
    () => (["warn", "ok", "info", "neutral"] as const).filter((tn) => items.some((i) => i.tone === tn)),
    [items],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = items.filter(
      (i) =>
        !gone.has(i.id) &&
        (!q || `${i.title} ${i.body}`.toLowerCase().includes(q)) &&
        (!unreadOnly || !(readOverride.get(i.id) ?? i.read)) &&
        (tones.size === 0 || tones.has(i.tone)),
    );
    return filtered
      .slice()
      .sort((a, b) =>
        sort === "type"
          ? a.typeLabel.localeCompare(b.typeLabel)
          : sort === "name"
            ? a.title.localeCompare(b.title)
            : b.sortAt.localeCompare(a.sortAt),
      );
  }, [items, query, sort, unreadOnly, tones, gone, readOverride]);

  const send = (
    action: typeof setAlertRead,
    a: AlertItem,
    on: boolean,
    onError: () => void,
  ) => {
    const fd = new FormData();
    fd.set("alertId", a.id);
    fd.set("on", on ? "1" : "");
    startTransition(async () => {
      const res = await action(null, fd);
      if (res?.error) {
        onError();
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  };

  const toggleRead = (a: AlertItem) => {
    const next = !isRead(a);
    setReadOverride((m) => new Map(m).set(a.id, next));
    send(setAlertRead, a, next, () => setReadOverride((m) => new Map(m).set(a.id, !next)));
  };

  const toggleFlag = (a: AlertItem) => {
    const next = !isFlagged(a);
    setFlagOverride((m) => new Map(m).set(a.id, next));
    send(setAlertFlag, a, next, () => setFlagOverride((m) => new Map(m).set(a.id, !next)));
  };

  const dismiss = (a: AlertItem) => {
    setGone((s) => new Set(s).add(a.id));
    send(setAlertDismissed, a, true, () =>
      setGone((s) => {
        const n = new Set(s);
        n.delete(a.id);
        return n;
      }),
    );
    withUndo(t("m.alerts.dismissed", undefined, "Notification Dismissed"), () => {
      setGone((s) => {
        const n = new Set(s);
        n.delete(a.id);
        return n;
      });
      send(setAlertDismissed, a, false, () => setGone((s) => new Set(s).add(a.id)));
    });
  };

  const face = (a: AlertItem) => (
    <div
      className={a.own ? "item" : "item"}
      style={{ display: "block", margin: 0, opacity: isRead(a) ? 0.55 : 1 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span className="bar" style={{ background: a.color }} />
        <KIcon name={a.iconName} size={18} style={{ color: a.color }} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="t">
            {isFlagged(a) && (
              <KIcon
                name="Flag"
                size={12}
                style={{ color: "var(--p-danger)", marginRight: 5, verticalAlign: "-1px" }}
              />
            )}
            {a.title}
          </div>
          <div className="s">{a.body}</div>
        </div>
        <span className="time">{a.when}</span>
      </div>
      {!a.own && !a.read && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <AcknowledgeButton alertId={a.id} />
        </div>
      )}
    </div>
  );

  // Kit 31 (live-test resolution #2): every row opens the full notification
  // record at /m/notifications/[id] — fields, timeline, related deep link.
  const openDetail = (a: AlertItem) => router.push(`/m/notifications/${a.id}`);

  const row = (a: AlertItem) =>
    a.own ? (
      <SwipeRow
        key={a.id}
        onClick={() => openDetail(a)}
        actions={[
          {
            icon: "Flag",
            label: isFlagged(a) ? t("m.alerts.unflag", undefined, "Unflag") : t("m.alerts.flag", undefined, "Flag"),
            tone: "danger",
            on: () => toggleFlag(a),
          },
          {
            icon: isRead(a) ? "Mail" : "MailOpen",
            label: isRead(a) ? t("m.alerts.unread", undefined, "Unread") : t("m.alerts.read", undefined, "Read"),
            tone: "info",
            on: () => toggleRead(a),
          },
          {
            icon: "X",
            label: t("m.alerts.dismiss", undefined, "Dismiss"),
            tone: "danger",
            on: () => dismiss(a),
          },
        ]}
      >
        {face(a)}
      </SwipeRow>
    ) : (
      <div
        key={a.id}
        style={{ marginBottom: 8, cursor: "pointer" }}
        role="link"
        tabIndex={0}
        onClick={() => openDetail(a)}
        onKeyDown={(e) => {
          if (e.key === "Enter") openDetail(a);
        }}
      >
        {face(a)}
      </div>
    );

  const grouped = useMemo(() => {
    if (group !== "type") return null;
    const m = new Map<string, AlertItem[]>();
    visible.forEach((a) => m.set(a.typeLabel, [...(m.get(a.typeLabel) ?? []), a]));
    return Array.from(m.entries());
  }, [group, visible]);

  const colNotification = t("m.alerts.col.notification", undefined, "Notification");
  const colType = t("m.alerts.col.type", undefined, "Type");
  const colTime = t("m.alerts.col.time", undefined, "Time");
  const emptyCols = [colNotification, colType, colTime];

  return (
    <>
      <ActionBar<AlertItem>
        k="nt"
        query={query}
        setQuery={setQuery}
        placeholder={t("m.alerts.search", undefined, "Search Notifications…")}
        view={view}
        setView={setView}
        views={["list", "table"]}
        group={group}
        setGroup={setGroup}
        groupOpts={[
          ["none", t("m.alerts.group.none", undefined, "None")],
          ["type", t("m.alerts.group.type", undefined, "Type")],
        ]}
        sort={sort}
        setSort={setSort}
        sortOpts={[
          ["time", t("m.alerts.sort.time", undefined, "Time")],
          ["type", t("m.alerts.sort.type", undefined, "Type")],
          ["name", t("m.alerts.sort.name", undefined, "Name")],
        ]}
        filterActive={tones.size + (unreadOnly ? 1 : 0)}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        filterChildren={
          <div>
            <TogRow
              label={t("m.alerts.filter.unread", undefined, "Unread Only")}
              on={unreadOnly}
              set={() => setUnreadOnly((v) => !v)}
            />
            {presentTones.map((tn) => (
              <TogRow key={tn} label={toneLabels[tn]} on={tones.has(tn)} set={() => toggleTone(tn)} />
            ))}
          </div>
        }
      />

      {visible.length === 0 ? (
        <EmptySkeleton
          cols={emptyCols}
          title={t("m.alerts.empty.title", undefined, "All Clear")}
          hint={t(
            "m.alerts.empty.hint",
            undefined,
            "Approvals, shift reminders, incidents and updates land here.",
          )}
        />
      ) : view === "table" ? (
        <DataTable<AlertItem>
          fields={[
            { id: "title", label: colNotification, type: "text", get: (a) => a.title },
            { id: "type", label: colType, type: "text", get: (a) => a.typeLabel },
            { id: "body", label: t("m.alerts.col.detail", undefined, "Detail"), type: "text", get: (a) => a.body },
            { id: "when", label: colTime, type: "text", get: (a) => a.when },
          ]}
          items={visible}
          onRow={openDetail}
        />
      ) : grouped ? (
        <GroupedList<AlertItem>
          skey="nt"
          groups={grouped}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          renderRow={row}
        />
      ) : (
        visible.map(row)
      )}

      <UndoBar undo={undo} onUndo={clearUndo} undoLabel={t("m.undo", undefined, "Undo")} />
    </>
  );
}
