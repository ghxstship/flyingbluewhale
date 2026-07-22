"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  KIcon,
  NormalizedList,
  SwipeRow,
  UndoBar,
  useUndo,
  type FieldDef,
} from "@/components/mobile/kit";
import { useToast } from "@/lib/hooks/useToast";
import { useT } from "@/lib/i18n/LocaleProvider";
import { AcknowledgeButton } from "./AcknowledgeButton";
import { setAlertDismissed, setAlertFlag, setAlertRead } from "./actions";

/**
 * AlertsList — client leaf for /m/notifications (the bell feed). Kit 34 v3.4:
 * normalized onto NormalizedList (search + View Options/Share drawers + schema
 * DataView list/table + tone pills). Keeps the v2.7 swipe canon on every OWN
 * row (Flag · Read/Unread · Dismiss with 5s undo), the optimistic overrides,
 * and the Acknowledge affordance on broadcast rows (RLS permits no per-user row
 * state there). Read rows dim; the bell count is the server's unread count.
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
  // Optimistic swipe state.
  const [gone, setGone] = useState<Set<string>>(new Set());
  const [readOverride, setReadOverride] = useState<Map<string, boolean>>(new Map());
  const [flagOverride, setFlagOverride] = useState<Map<string, boolean>>(new Map());
  const { undo, withUndo, clearUndo } = useUndo();

  const isRead = (a: AlertItem) => readOverride.get(a.id) ?? a.read;
  const isFlagged = (a: AlertItem) => flagOverride.get(a.id) ?? a.flagged;

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

  const liveItems = useMemo(() => items.filter((i) => !gone.has(i.id)), [items, gone]);
  const typeList = useMemo(() => [...new Set(items.map((i) => i.typeLabel))], [items]);

  const send = (action: typeof setAlertRead, a: AlertItem, on: boolean, onError: () => void) => {
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
    <div className="item" style={{ display: "block", margin: 0, opacity: isRead(a) ? 0.55 : 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span className="bar" style={{ background: a.color }} />
        <KIcon name={a.iconName} size={18} style={{ color: a.color }} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="t">
            {isFlagged(a) && (
              <KIcon name="Flag" size={12} style={{ color: "var(--p-danger)", marginRight: 5, verticalAlign: "-1px" }} />
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
          { icon: "X", label: t("m.alerts.dismiss", undefined, "Dismiss"), tone: "danger", on: () => dismiss(a) },
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

  const colNotification = t("m.alerts.col.notification", undefined, "Notification");
  const colType = t("m.alerts.col.type", undefined, "Type");
  const colTime = t("m.alerts.col.time", undefined, "Time");
  const readLabel = t("m.alerts.read", undefined, "Read");
  const unreadLabel = t("m.alerts.unread", undefined, "Unread");

  const FIELDS: FieldDef<AlertItem>[] = [
    { id: "title", label: colNotification, type: "text", get: (a) => a.title },
    { id: "type", label: colType, type: "select", options: typeList, get: (a) => a.typeLabel },
    { id: "read", label: t("m.alerts.filter.unread", undefined, "Read State"), type: "select", options: [readLabel, unreadLabel], get: (a) => (isRead(a) ? readLabel : unreadLabel) },
    // Sort on the real timestamp; display the humanized string (kit 32 D1).
    { id: "when", label: colTime, type: "text", get: (a) => a.sortAt, cell: (a) => a.when },
  ];

  return (
    <>
      <NormalizedList
        k="nt"
        items={liveItems}
        fields={FIELDS}
        search={(a) => `${a.title} ${a.body}`}
        searchPlaceholder={t("m.alerts.search", undefined, "Search Notifications…")}
        renderRow={row}
        onRow={openDetail}
        views={["list", "table"]}
        pill={{ get: (a) => toneLabels[a.tone], order: presentTones.map((tn) => toneLabels[tn]) }}
        empty={{
          cols: [colNotification, colType, colTime],
          title: t("m.alerts.empty.title", undefined, "All Clear"),
          hint: t("m.alerts.empty.hint", undefined, "Approvals, shift reminders, incidents and updates land here."),
        }}
      />

      <UndoBar undo={undo} onUndo={clearUndo} undoLabel={t("m.undo", undefined, "Undo")} />
    </>
  );
}
