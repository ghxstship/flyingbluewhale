"use client";

import { useState } from "react";
import { KIcon } from "./icon";
import { mkItems } from "./Menu";
import { useDismissable } from "./useDismissable";

/**
 * Item-level unit listing — real instances with interchangeable list/grid
 * views + a search/sort action bar. Ported from the prototype `ItemUnits`.
 *
 * DS `Badge` is replaced with the repo's `.ps-badge--*` classes (tone-mapped);
 * the DS `Menu` is rendered inline as a `.ps-menu pop` list.
 */
export type UnitTone = "ok" | "warn" | "danger" | "info" | "accent" | "neutral";

export type Unit = {
  /** Backing record id, when the unit is actionable (e.g. an `assets` row).
   *  Optional so the kit stays presentational for callers with no store. */
  id?: string;
  /** Raw lifecycle state; `status` above is its display label. */
  state?: string;
  tag: string;
  status: string;
  holder: string;
  tone: UnitTone;
};

export type ItemUnitsProps = {
  units: Unit[];
  onToast: (unit: Unit) => void;
};

const TONE_BADGE: Record<UnitTone, string> = {
  ok: "ps-badge--ok",
  warn: "ps-badge--warn",
  danger: "ps-badge--danger",
  info: "ps-badge--info",
  accent: "ps-badge--accent",
  neutral: "ps-badge--neutral",
};

function toneBar(tone: UnitTone): string {
  switch (tone) {
    case "ok":
      return "var(--p-success)";
    case "warn":
      return "var(--p-warning)";
    case "info":
      return "var(--p-info)";
    case "accent":
      return "var(--p-accent)";
    default:
      return "var(--p-border)";
  }
}

type SortKey = "tag" | "status";

export function ItemUnits({ units, onToast }: ItemUnitsProps) {
  const [view, setView] = useState<"list" | "grid">("list");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("tag");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useDismissable<HTMLDivElement>(sortOpen, () => setSortOpen(false), { modal: false });
  let rows = units.filter(
    (u) => !q || (u.tag + u.status + u.holder).toLowerCase().includes(q.toLowerCase()),
  );
  rows = [...rows].sort((a, b) =>
    sort === "status" ? a.status.localeCompare(b.status) : a.tag.localeCompare(b.tag),
  );
  const sortItems = mkItems(
    [
      ["tag", "By Unit ID"],
      ["status", "By Status"],
    ] as const,
    sort,
    setSort,
    () => setSortOpen(false),
  );
  return (
    <div>
      <div className="searchbar" style={{ marginBottom: 8 }}>
        <KIcon name="Search" size={16} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search units…" />
        {q && (
          <button type="button" aria-label="Clear search" onClick={() => setQ("")} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", display: "inline-flex", color: "inherit" }}>
            <KIcon name="X" size={15} />
          </button>
        )}
      </div>
      <div className="pillrow" style={{ marginBottom: 10 }}>
        <button
          type="button"
          className="pill ico"
          data-active={view === "grid" || undefined}
          onClick={() => setView((v) => (v === "list" ? "grid" : "list"))}
          aria-label="Toggle view"
        >
          <KIcon name={view === "list" ? "LayoutGrid" : "List"} size={16} />
        </button>
        <div style={{ position: "relative" }}>
          <button
            type="button"
            className="pill ico"
            data-active={sort !== "tag" || undefined}
            onClick={() => setSortOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={sortOpen}
            aria-label="Sort"
          >
            <KIcon name="ArrowDownUp" size={16} />
          </button>
          {sortOpen && (
            <>
              <button type="button" className="menu-back" aria-label="Close sort menu" onClick={() => setSortOpen(false)} />
              <div ref={sortRef} className="ps-menu pop" role="menu">
                {sortItems.map((it, i) => (
                  <button key={i} type="button" className="mi" role="menuitem" onClick={it.onSelect}>
                    {it.icon != null && <span style={{ display: "flex", flex: "none" }}>{it.icon}</span>}
                    <span>{it.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <span className="sp" />
        <span className="s" style={{ fontSize: 11 }}>
          {rows.length} units
        </span>
      </div>
      {view === "list" ? (
        rows.map((u) => (
          <button type="button" className="item tap" key={u.tag} style={{ cursor: "pointer", width: "100%", textAlign: "left", font: "inherit", color: "inherit" }} onClick={() => onToast(u)}>
            <span className="bar" style={{ background: toneBar(u.tone) }} />
            <div style={{ flex: 1 }}>
              <div className="t">{u.tag}</div>
              <div className="s">{u.holder}</div>
            </div>
            <span className={`ps-badge ${TONE_BADGE[u.tone]}`}>{u.status}</span>
          </button>
        ))
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {rows.map((u) => (
            <button
              type="button"
              className="item tap"
              key={u.tag}
              style={{ cursor: "pointer", display: "block", margin: 0, width: "100%", textAlign: "left", font: "inherit", color: "inherit" }}
              onClick={() => onToast(u)}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <KIcon name="Package" size={16} style={{ color: "var(--p-text-3)" }} />
                <span className={`ps-badge ${TONE_BADGE[u.tone]}`}>{u.status}</span>
              </div>
              <div className="t" style={{ fontSize: 13 }}>
                {u.tag}
              </div>
              <div className="s" style={{ fontSize: 11 }}>
                {u.holder}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
