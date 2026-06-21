"use client";

import { useMemo, useState } from "react";
import { ActionBar, GroupedList, KIcon, TogRow } from "@/components/mobile/kit";
import type { ViewMode } from "@/components/mobile/kit";
import { EmptyState } from "@/components/ui/EmptyState";
import { useT } from "@/lib/i18n/LocaleProvider";
import { DocDownloadLink } from "./DocDownloadLink";

export type DocScope = "All" | "Team" | "Role" | "You" | "Restricted";

export type DocItem = {
  id: string;
  title: string;
  cat: string;
  scope: DocScope;
  kind: "deliverable" | "personal";
  downloadable: boolean;
  updated: string | null;
};

const SCOPE_TONE: Record<DocScope, string> = {
  All: "neutral",
  Team: "info",
  Role: "warn",
  You: "ok",
  Restricted: "danger",
};

const SCOPES: DocScope[] = ["All", "Team", "Role", "You", "Restricted"];

function badgeClass(tone: string) {
  return `ps-badge ps-badge--${tone}`;
}

export function DocsView({ items, eyebrow, title }: { items: DocItem[]; eyebrow: string; title: string }) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("list");
  const [group, setGroup] = useState("none");
  const [sort, setSort] = useState("name");
  const [scopes, setScopes] = useState<Set<DocScope>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const cats = useMemo(() => Array.from(new Set(items.map((d) => d.cat))).sort(), [items]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items
      .filter((d) => scopes.size === 0 || scopes.has(d.scope))
      .filter((d) => !q || (d.title + " " + d.cat).toLowerCase().includes(q))
      .sort((a, b) =>
        sort === "cat" ? a.cat.localeCompare(b.cat) : sort === "updated" ? (b.updated ?? "").localeCompare(a.updated ?? "") : a.title.localeCompare(b.title),
      );
  }, [items, query, scopes, sort]);

  const toggleScope = (s: DocScope) =>
    setScopes((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });

  const row = (d: DocItem) => (
    <div className="item" key={d.id}>
      <span className="perm-ic" style={{ borderColor: "var(--p-border)", color: "var(--p-text-2)" }}>
        <KIcon name={d.kind === "personal" ? "FileText" : "File"} size={17} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="t">{d.title}</div>
        <div className="s">{d.cat}</div>
      </div>
      <span className={badgeClass(SCOPE_TONE[d.scope])}>{d.scope}</span>
      {d.downloadable && (
        <span style={{ marginLeft: 8 }}>
          <DocDownloadLink docId={d.id} />
        </span>
      )}
    </div>
  );

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{eyebrow}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>{title}</h1>

      <ActionBar
        k="dc"
        query={query}
        setQuery={setQuery}
        placeholder={t("m.docs.search", undefined, "Search Documents…")}
        view={view}
        setView={setView}
        views={["list"]}
        group={group}
        setGroup={setGroup}
        groupOpts={[
          ["none", t("m.docs.group.none", undefined, "None")],
          ["cat", t("m.docs.group.cat", undefined, "Category")],
        ]}
        sort={sort}
        setSort={setSort}
        sortOpts={[
          ["name", t("m.docs.sort.name", undefined, "Name")],
          ["cat", t("m.docs.sort.cat", undefined, "Category")],
          ["updated", t("m.docs.sort.updated", undefined, "Updated")],
        ]}
        filterActive={scopes.size}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        filterChildren={
          <div>
            {SCOPES.map((s) => (
              <TogRow key={s} label={s} on={scopes.has(s)} set={() => toggleScope(s)} />
            ))}
          </div>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          size="compact"
          title={t("m.docs.empty.title", undefined, "No Documents")}
          description={t("m.docs.empty.body", undefined, "Project documents you can access and your personal files land here.")}
        />
      ) : group === "cat" ? (
        <GroupedList
          skey="dc"
          groups={cats.filter((c) => filtered.some((d) => d.cat === c)).map((c) => [c, filtered.filter((d) => d.cat === c)])}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          renderRow={row}
        />
      ) : (
        filtered.map(row)
      )}
    </div>
  );
}
