"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ActionBar, EmptySkeleton, Fab, GroupedList, KIcon, SheetHead, SwipeRow } from "@/components/mobile/kit";
import type { ViewMode } from "@/components/mobile/kit";
import { useToast } from "@/lib/hooks/useToast";
import { useT } from "@/lib/i18n/LocaleProvider";
import { addShiftNote } from "../clock/actions";

export type TimeRow = {
  id: string;
  day: string;
  span: string;
  duration: string;
  /** Minutes worked — the kit's Hours sort key. */
  durationMin: number;
  open: boolean;
  category: string | null;
  note: string | null;
  billable: boolean;
  fromShift: boolean;
};

/**
 * Kit 28 `time` + the kit 31 (v2.7) swipe canon: entry rows with the shift
 * note attached, grouped by day. ActionBar per the kit canon (group
 * None/Status/Day · sort Recent/Hours/Shift). Swipe: Note (warn — opens the
 * shift-note form bound to THIS entry, writing through the existing
 * `addShiftNote` store) · Export (info — downloads the entry as CSV).
 * FAB = Add Note (handover form, the nearest real store for free-standing
 * notes).
 */
export function TimeView({ rows, eyebrow, title }: { rows: TimeRow[]; eyebrow: string; title: string }) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("list");
  const [group, setGroup] = useState("day");
  const [sort, setSort] = useState("recent");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  // Kit 31: the swipe Note target — opens the note sheet bound to the entry.
  const [noteTarget, setNoteTarget] = useState<TimeRow | null>(null);
  const [noteBody, setNoteBody] = useState("");

  const items = useMemo(() => {
    const q = query.toLowerCase();
    return rows
      .filter((r) => !q || `${r.day} ${r.note ?? ""} ${r.category ?? ""}`.toLowerCase().includes(q))
      .slice()
      .sort((a, b) =>
        sort === "hours" ? b.durationMin - a.durationMin : sort === "shift" ? a.span.localeCompare(b.span) : 0,
      );
  }, [rows, query, sort]);

  const exportEntry = (r: TimeRow) => {
    // A real artifact, not a toast: the entry as a one-row CSV download.
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [
      ["Day", "Span", "Minutes", "Category", "Billable", "Note"].join(","),
      [
        esc(r.day),
        esc(r.span),
        String(r.durationMin),
        esc(r.category ?? ""),
        r.billable ? "yes" : "no",
        esc(r.note ?? ""),
      ].join(","),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `time-entry-${r.id.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.info(t("m.time.swipe.exported", undefined, "Entry Exported"), { description: `${r.day} · ${r.duration}` });
  };

  const saveNote = () => {
    if (!noteTarget) return;
    const body = noteBody.trim();
    if (!body) return;
    const target = noteTarget;
    startTransition(async () => {
      const res = await addShiftNote(target.id, body);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(t("m.time.swipe.noteAdded", undefined, "Note Added"), { description: target.day });
      setNoteTarget(null);
      setNoteBody("");
      router.refresh();
    });
  };

  const row = (r: TimeRow) => (
    <SwipeRow
      key={r.id}
      actions={[
        {
          icon: "StickyNote",
          label: t("m.time.swipe.note", undefined, "Note"),
          tone: "warn",
          on: () => {
            setNoteBody("");
            setNoteTarget(r);
          },
        },
        {
          icon: "Download",
          label: t("m.time.swipe.export", undefined, "Export"),
          tone: "info",
          on: () => exportEntry(r),
        },
      ]}
    >
      <div className="item" style={{ display: "block", margin: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <KIcon name="Timer" size={18} style={{ color: "var(--p-text-2)", flex: "none", marginTop: 2 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t">{r.span}</div>
            <div className="s">
              {r.category ?? t("m.time.uncategorised", undefined, "Uncategorised")}
              {r.fromShift ? ` · ${t("m.time.fromShift", undefined, "From A Shift")}` : ""}
              {r.billable ? ` · ${t("m.time.billable", undefined, "Billable")}` : ""}
            </div>
            {r.note && (
              <p className="form-intro" style={{ margin: "6px 0 0" }}>
                {r.note}
              </p>
            )}
          </div>
          <span className={`ps-badge ps-badge--${r.open ? "warn" : "neutral"}`} style={{ fontVariantNumeric: "tabular-nums" }}>
            {r.duration}
          </span>
        </div>
      </div>
    </SwipeRow>
  );

  const groups = useMemo<[string, TimeRow[]][] | null>(() => {
    if (group === "day") {
      const m = new Map<string, TimeRow[]>();
      items.forEach((r) => m.set(r.day, [...(m.get(r.day) ?? []), r]));
      return Array.from(m.entries());
    }
    if (group === "status") {
      const openLabel = t("m.time.group.open", undefined, "Open");
      const closedLabel = t("m.time.group.closed", undefined, "Closed");
      const m = new Map<string, TimeRow[]>();
      items.forEach((r) => {
        const k = r.open ? openLabel : closedLabel;
        m.set(k, [...(m.get(k) ?? []), r]);
      });
      return Array.from(m.entries());
    }
    return null;
  }, [group, items, t]);

  return (
    <div className="screen screen-anim" style={{ position: "relative" }}>
      <div className="scr-eye">{eyebrow}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {title}
      </h1>

      <ActionBar
        k="tm"
        query={query}
        setQuery={setQuery}
        placeholder={t("m.time.search", undefined, "Search Time…")}
        view={view}
        setView={setView}
        views={["list", "table"]}
        group={group}
        setGroup={setGroup}
        groupOpts={[
          ["none", t("m.time.group.none", undefined, "None")],
          ["status", t("m.time.group.status", undefined, "Status")],
          ["day", t("m.time.group.day", undefined, "Day")],
        ]}
        sort={sort}
        setSort={setSort}
        sortOpts={[
          ["recent", t("m.time.sort.recent", undefined, "Recent")],
          ["hours", t("m.time.sort.hours", undefined, "Hours")],
          ["shift", t("m.time.sort.shift", undefined, "Shift")],
        ]}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />

      {!items.length ? (
        <EmptySkeleton
          cols={[
            t("m.time.col.shift", undefined, "Shift"),
            t("m.time.col.hours", undefined, "Hours"),
            t("m.time.col.status", undefined, "Status"),
          ]}
          title={t("m.time.empty.title", undefined, "No Hours Yet")}
          hint={t(
            "m.time.empty.body",
            undefined,
            "Clock in and your hours land here, with the note from each shift attached.",
          )}
          action={
            <Link href="/m/clock" className="ps-btn ps-btn--cta">
              <KIcon name="Timer" size={15} /> {t("m.time.clockIn", undefined, "Go To Time Clock")}
            </Link>
          }
        />
      ) : groups ? (
        <GroupedList<TimeRow> skey="tm" groups={groups} collapsed={collapsed} setCollapsed={setCollapsed} renderRow={row} />
      ) : (
        items.map(row)
      )}

      {/* Kit 31 swipe Note — the shift-note form bound to the swiped entry. */}
      {noteTarget && (
        <div className="sheet">
          <button type="button" className="sheet-bg" aria-label={t("m.time.note.close", undefined, "Close")} onClick={() => setNoteTarget(null)} />
          <div className="sheet-panel" role="dialog" aria-modal="true">
            <div className="sheet-grip" />
            <SheetHead
              icon="StickyNote"
              title={t("m.time.note.title", undefined, "Shift Note")}
              onClose={() => setNoteTarget(null)}
            />
            <p className="form-intro" style={{ marginTop: 0 }}>
              {noteTarget.day} · {noteTarget.span}
            </p>
            <textarea
              className="ps-input"
              rows={3}
              maxLength={2000}
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              placeholder={t("m.time.note.placeholder", undefined, "What should the record say?")}
              style={{ width: "100%" }}
            />
            <button
              type="button"
              className="ps-btn ps-btn--cta ps-btn--lg"
              style={{ width: "100%", justifyContent: "center", marginTop: 12 }}
              disabled={pending || !noteBody.trim()}
              onClick={saveNote}
            >
              {pending ? t("m.time.note.saving", undefined, "Saving…") : t("m.time.note.save", undefined, "Add Note")}
            </button>
          </div>
        </div>
      )}

      {/* Kit FAB: Add Note. */}
      <Fab href="/m/handover/new" label={t("m.time.addNote", undefined, "Add Note")} />
    </div>
  );
}
