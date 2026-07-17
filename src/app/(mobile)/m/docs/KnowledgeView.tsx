"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ActionBar, KIcon, TogRow } from "@/components/mobile/kit";
import { EmptyState } from "@/components/ui/EmptyState";
import { useT } from "@/lib/i18n/LocaleProvider";

export type ArticleRow = {
  id: string;
  code: string;
  title: string;
  purpose: string | null;
  category: string;
  mustRead: boolean;
  acked: boolean;
};

/** Kit 28 `library`: category filter, must-read badge, row opens the article. */
export function KnowledgeView({ rows, eyebrow, title }: { rows: ArticleRow[]; eyebrow: string; title: string }) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [cats, setCats] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const catList = useMemo(() => Array.from(new Set(rows.map((r) => r.category))).sort(), [rows]);

  const items = useMemo(() => {
    const q = query.toLowerCase();
    return rows
      .filter((r) => cats.size === 0 || cats.has(r.category))
      .filter((r) => !q || `${r.code} ${r.title} ${r.purpose ?? ""}`.toLowerCase().includes(q));
  }, [rows, query, cats]);

  const toggleCat = (c: string) =>
    setCats((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{eyebrow}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {title}
      </h1>

      <ActionBar
        k="kn"
        query={query}
        setQuery={setQuery}
        placeholder={t("m.docs.search", undefined, "Search Knowledge…")}
        filterActive={cats.size}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        filterChildren={
          <div>
            <div className="wl" style={{ marginBottom: 8 }}>
              {t("m.docs.category", undefined, "Category")}
            </div>
            {catList.map((c) => (
              <TogRow key={c} label={c} on={cats.has(c)} set={() => toggleCat(c)} />
            ))}
          </div>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          size="compact"
          title={t("m.docs.empty.title", undefined, "No Articles")}
          description={t(
            "m.docs.empty.body",
            undefined,
            "Published SOPs and policies land here. Must-reads ask for your acknowledgement.",
          )}
        />
      ) : (
        items.map((r) => (
          <Link key={r.id} href={`/m/docs/${r.id}`} className="item tap" style={{ textDecoration: "none", color: "inherit" }}>
            <KIcon name="BookOpen" size={18} style={{ color: "var(--p-text-2)", flex: "none" }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="t">{r.title}</div>
              <div className="s" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <span style={{ fontFamily: "var(--p-mono)" }}>{r.code}</span> · {r.category}
              </div>
            </div>
            {/* Must-read state: unacked demands attention, acked confirms it. */}
            {r.mustRead && (
              <span className={`ps-badge ${r.acked ? "ps-badge--ok" : "ps-badge--warn"}`}>
                {r.acked ? t("m.docs.acked", undefined, "Read") : t("m.docs.mustRead", undefined, "Must Read")}
              </span>
            )}
          </Link>
        ))
      )}
    </div>
  );
}
