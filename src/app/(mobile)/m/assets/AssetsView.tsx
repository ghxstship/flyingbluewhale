"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ActionBar, GroupedList, KIcon, TogRow } from "@/components/mobile/kit";
import type { ViewMode } from "@/components/mobile/kit";
import { EmptyState } from "@/components/ui/EmptyState";
import { useT } from "@/lib/i18n/LocaleProvider";

export type AssetRow = {
  id: string;
  cat: string;
  title: string;
  sub: string;
  tag: string;
  tone: "ok" | "info" | "neutral" | "danger";
  time: string;
};

/**
 * Kit 28 `tab === "assets"` verbatim: eyebrow count, "My Assets", the shared
 * ActionBar (list/table · group None|Category · sort Name|Status|Tag · category
 * filter chips), `.item.tap` rows with a leading `.bar`, mono tag in the
 * sub-line, and a tone Badge carrying the return state. FAB = Request Advance.
 */
export function AssetsView({ rows, eyebrow, title }: { rows: AssetRow[]; eyebrow: string; title: string }) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("list");
  const [group, setGroup] = useState("none");
  const [sort, setSort] = useState("name");
  const [cats, setCats] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const catList = useMemo(() => Array.from(new Set(rows.map((r) => r.cat))).sort(), [rows]);

  const items = useMemo(() => {
    const q = query.toLowerCase();
    return rows
      .filter((r) => cats.size === 0 || cats.has(r.cat))
      .filter((r) => !q || `${r.title} ${r.sub} ${r.tag}`.toLowerCase().includes(q))
      .sort((x, y) =>
        sort === "status" ? x.time.localeCompare(y.time) : sort === "tag" ? x.tag.localeCompare(y.tag) : x.title.localeCompare(y.title),
      );
  }, [rows, query, cats, sort]);

  const toggleCat = (c: string) =>
    setCats((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });

  const row = (r: AssetRow) => (
    <Link className="item tap" key={r.id} href={`/m/advances/${r.id}`} style={{ cursor: "pointer", textDecoration: "none" }}>
      <span className="bar" />
      <div>
        <div className="t">{r.title}</div>
        <div className="s">
          {r.sub} · <span style={{ fontFamily: "var(--p-mono)" }}>{r.tag}</span>
        </div>
      </div>
      <span className="sp" />
      <span className={`ps-badge ps-badge--${r.tone}`}>{r.time}</span>
    </Link>
  );

  const groups = useMemo(() => {
    if (group !== "cat") return null;
    const m = new Map<string, AssetRow[]>();
    items.forEach((r) => m.set(r.cat, [...(m.get(r.cat) ?? []), r]));
    return catList.filter((c) => m.has(c)).map((c) => [c, m.get(c) ?? []] as [string, AssetRow[]]);
  }, [group, items, catList]);

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{eyebrow}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {title}
      </h1>

      <ActionBar
        k="as"
        query={query}
        setQuery={setQuery}
        placeholder={t("m.assets.search", undefined, "Search Assets…")}
        view={view}
        setView={setView}
        views={["list", "table"]}
        group={group}
        setGroup={setGroup}
        groupOpts={[
          ["none", t("m.assets.group.none", undefined, "None")],
          ["cat", t("m.assets.group.cat", undefined, "Category")],
        ]}
        sort={sort}
        setSort={setSort}
        sortOpts={[
          ["name", t("m.assets.sort.name", undefined, "Name")],
          ["status", t("m.assets.sort.status", undefined, "Status")],
          ["tag", t("m.assets.sort.tag", undefined, "Tag")],
        ]}
        filterActive={cats.size}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        filterChildren={
          <div>
            <div className="wl" style={{ marginBottom: 8 }}>
              {t("m.assets.category", undefined, "Category")}
            </div>
            {catList.map((c) => (
              <TogRow key={c} label={c} on={cats.has(c)} set={() => toggleCat(c)} />
            ))}
          </div>
        }
      />

      {!items.length ? (
        <EmptyState
          size="compact"
          title={t("m.assets.empty.title", undefined, "No Assets")}
          description={t(
            "m.assets.empty.body",
            undefined,
            "Gear, credentials and vouchers issued to you land here. Request what you need from the catalog.",
          )}
        />
      ) : groups ? (
        <GroupedList<AssetRow> skey="as" groups={groups} collapsed={collapsed} setCollapsed={setCollapsed} renderRow={row} />
      ) : (
        items.map(row)
      )}

      {/* Kit FAB: Request Advance. */}
      <Link href="/m/advances/new" className="fab" aria-label={t("m.assets.request", undefined, "Request Advance")}>
        <KIcon name="Plus" size={22} />
      </Link>
    </div>
  );
}
