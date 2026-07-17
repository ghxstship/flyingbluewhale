"use client";

import Link from "next/link";
import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { ShieldCheck } from "lucide-react";
import { ActionBar, TogRow } from "@/components/mobile/kit";
import { EmptyState } from "@/components/ui/EmptyState";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * IncidentsList — client leaf for the org incident queue. Adds the kit
 * ActionBar (search + sort + severity/state filter cluster) over the rows
 * the server page shapes (audit D-22; KIT_CANON: ActionBar on every list
 * screen).
 */

export type IncidentItem = {
  id: string;
  title: string;
  meta: string;
  severity: string;
  state: string;
  sevTone: string;
  stTone: string;
  barColor: string;
  sortAt: string;
};

export function IncidentsList({ items }: { items: IncidentItem[] }) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [sevs, setSevs] = useState<Set<string>>(new Set());
  const [states, setStates] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const sevList = useMemo(() => Array.from(new Set(items.map((i) => i.severity).filter((s) => s !== "—"))).sort(), [items]);
  const stateList = useMemo(() => Array.from(new Set(items.map((i) => i.state).filter((s) => s !== "—"))).sort(), [items]);

  const toggle = (set: Dispatch<SetStateAction<Set<string>>>) => (v: string) =>
    set((s) => {
      const n = new Set(s);
      if (n.has(v)) n.delete(v);
      else n.add(v);
      return n;
    });
  const toggleSev = toggle(setSevs);
  const toggleState = toggle(setStates);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = items.filter(
      (i) =>
        (!q || `${i.title} ${i.meta}`.toLowerCase().includes(q)) &&
        (sevs.size === 0 || sevs.has(i.severity)) &&
        (states.size === 0 || states.has(i.state)),
    );
    if (sort === "oldest") return filtered.slice().sort((a, b) => a.sortAt.localeCompare(b.sortAt));
    if (sort === "severity") return filtered.slice().sort((a, b) => a.severity.localeCompare(b.severity));
    return filtered.slice().sort((a, b) => b.sortAt.localeCompare(a.sortAt));
  }, [items, query, sort, sevs, states]);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ShieldCheck size={28} aria-hidden="true" />}
        title={t("m.incidents.emptyTitle", undefined, "All Clear")}
        description={t("m.incidents.emptyBody", undefined, "No incidents logged for this org yet.")}
      />
    );
  }

  return (
    <>
      <ActionBar
        k="inc"
        query={query}
        setQuery={setQuery}
        placeholder={t("m.incidents.search", undefined, "Search incidents…")}
        sort={sort}
        setSort={setSort}
        sortOpts={[
          ["newest", t("m.incidents.sort.newest", undefined, "Newest")],
          ["oldest", t("m.incidents.sort.oldest", undefined, "Oldest")],
          ["severity", t("m.incidents.sort.severity", undefined, "Severity")],
        ]}
        filterActive={sevs.size + states.size}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        filterChildren={
          <div>
            {sevList.map((s) => (
              <TogRow key={`sev-${s}`} label={s} on={sevs.has(s)} set={() => toggleSev(s)} />
            ))}
            {stateList.map((s) => (
              <TogRow key={`st-${s}`} label={s} on={states.has(s)} set={() => toggleState(s)} />
            ))}
          </div>
        }
      />

      {visible.length === 0 ? (
        <div className="s" style={{ color: "var(--p-text-3)", padding: "16px 4px" }}>
          {t("m.incidents.noMatch", undefined, "Nothing matches your search.")}
        </div>
      ) : (
        // A filed incident has to be openable. These rows were plain divs,
        // so mobile could report a thing and then never look at it again.
        visible.map((r) => (
          <Link
            className="item tap"
            key={r.id}
            href={`/m/incidents/${r.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <span className="bar" style={{ background: r.barColor }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="t">{r.title}</div>
              <div className="s">{r.meta}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end", flex: "none" }}>
              <span className={`ps-badge ps-badge--${r.sevTone}`}>{r.severity}</span>
              <span className={`ps-badge ps-badge--${r.stTone}`}>{r.state}</span>
            </div>
          </Link>
        ))
      )}
    </>
  );
}
