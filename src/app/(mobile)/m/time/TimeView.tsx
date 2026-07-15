"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ActionBar, GroupedList, KIcon } from "@/components/mobile/kit";
import type { ViewMode } from "@/components/mobile/kit";
import { EmptyState } from "@/components/ui/EmptyState";
import { useT } from "@/lib/i18n/LocaleProvider";

export type TimeRow = {
  id: string;
  day: string;
  span: string;
  duration: string;
  open: boolean;
  category: string | null;
  note: string | null;
  billable: boolean;
  fromShift: boolean;
};

/**
 * Kit 28 `time`: entry rows with the shift note attached, grouped by day.
 * ActionBar per the kit canon (search + icon-only cluster). FAB = Add Note,
 * which for now routes to the handover form — the kit's "two-way shift notes"
 * store doesn't exist yet, and handover is the nearest real one.
 */
export function TimeView({ rows, eyebrow, title }: { rows: TimeRow[]; eyebrow: string; title: string }) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("list");
  const [group, setGroup] = useState("day");
  const [sort, setSort] = useState("recent");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const items = useMemo(() => {
    const q = query.toLowerCase();
    return rows.filter((r) => !q || `${r.day} ${r.note ?? ""} ${r.category ?? ""}`.toLowerCase().includes(q));
  }, [rows, query]);

  const row = (r: TimeRow) => (
    <div className="item" key={r.id} style={{ display: "block" }}>
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
  );

  const groups = useMemo(() => {
    if (group !== "day") return null;
    const m = new Map<string, TimeRow[]>();
    items.forEach((r) => m.set(r.day, [...(m.get(r.day) ?? []), r]));
    return Array.from(m.entries());
  }, [group, items]);

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
          ["day", t("m.time.group.day", undefined, "Day")],
        ]}
        sort={sort}
        setSort={setSort}
        sortOpts={[["recent", t("m.time.sort.recent", undefined, "Recent")]]}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />

      {!items.length ? (
        <EmptyState
          size="compact"
          title={t("m.time.empty.title", undefined, "No Hours Yet")}
          description={t(
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

      {/* Kit FAB: Add Note. */}
      <Link href="/m/handover/new" className="fab" aria-label={t("m.time.addNote", undefined, "Add Note")}>
        <KIcon name="Plus" size={22} />
      </Link>
    </div>
  );
}
