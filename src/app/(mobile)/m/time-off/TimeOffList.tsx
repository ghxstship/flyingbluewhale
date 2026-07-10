"use client";

import { useMemo, useState } from "react";
import { CalendarOff } from "lucide-react";
import { ActionBar, TogRow } from "@/components/mobile/kit";
import { EmptyState } from "@/components/ui/EmptyState";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * TimeOffList — client leaf for the caller's time-off requests. Adds the kit
 * ActionBar (search + sort + state filter cluster) over the rows the server
 * page shapes (audit D-22; KIT_CANON: ActionBar on every list screen).
 */

export type TimeOffItem = {
  id: string;
  range: string;
  meta: string;
  state: string;
  tone: string;
  barColor: string;
  sortAt: string;
};

export function TimeOffList({ items }: { items: TimeOffItem[] }) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [states, setStates] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const stateList = useMemo(() => Array.from(new Set(items.map((i) => i.state).filter((s) => s !== "—"))).sort(), [items]);
  const toggleState = (s: string) =>
    setStates((prev) => {
      const n = new Set(prev);
      if (n.has(s)) n.delete(s);
      else n.add(s);
      return n;
    });

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = items.filter(
      (i) =>
        (!q || `${i.range} ${i.meta} ${i.state}`.toLowerCase().includes(q)) &&
        (states.size === 0 || states.has(i.state)),
    );
    return sort === "oldest"
      ? filtered.slice().sort((a, b) => a.sortAt.localeCompare(b.sortAt))
      : filtered.slice().sort((a, b) => b.sortAt.localeCompare(a.sortAt));
  }, [items, query, sort, states]);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<CalendarOff size={28} aria-hidden="true" />}
        title={t("m.timeOff.emptyTitle", undefined, "No Requests")}
        description={t("m.timeOff.emptyBody", undefined, "You haven't requested any time off.")}
      />
    );
  }

  return (
    <>
      <ActionBar
        k="to"
        query={query}
        setQuery={setQuery}
        placeholder={t("m.timeOff.search", undefined, "Search requests…")}
        sort={sort}
        setSort={setSort}
        sortOpts={[
          ["newest", t("m.timeOff.sort.newest", undefined, "Newest")],
          ["oldest", t("m.timeOff.sort.oldest", undefined, "Oldest")],
        ]}
        filterActive={states.size}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        filterChildren={
          <div>
            {stateList.map((s) => (
              <TogRow key={s} label={s} on={states.has(s)} set={() => toggleState(s)} />
            ))}
          </div>
        }
      />

      {visible.length === 0 ? (
        <div className="s" style={{ color: "var(--p-text-3)", padding: "16px 4px" }}>
          {t("m.timeOff.noMatch", undefined, "Nothing matches your search.")}
        </div>
      ) : (
        visible.map((r) => (
          <div className="item" key={r.id}>
            <span className="bar" style={{ background: r.barColor }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="t">{r.range}</div>
              <div className="s">{r.meta}</div>
            </div>
            <span className={`ps-badge ps-badge--${r.tone}`} style={{ flex: "none" }}>
              {r.state}
            </span>
          </div>
        ))
      )}
    </>
  );
}
