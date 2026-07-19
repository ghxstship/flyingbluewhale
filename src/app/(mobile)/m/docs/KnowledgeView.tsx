"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { KIcon, NormalizedList, ScreenHeader, type FieldDef } from "@/components/mobile/kit";
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

/** Kit 28 `library` / kit 34 v3.4: normalized — category pills, must-read badge,
 *  row opens the article. */
export function KnowledgeView({ rows, title }: { rows: ArticleRow[]; eyebrow?: string; title: string }) {
  const t = useT();
  const router = useRouter();

  const catList = Array.from(new Set(rows.map((r) => r.category))).sort();

  const FIELDS: FieldDef<ArticleRow>[] = [
    { id: "title", label: t("m.docs.col.title", undefined, "Title"), type: "text", get: (r) => r.title },
    { id: "code", label: "Code", type: "text", get: (r) => r.code },
    { id: "category", label: t("m.docs.category", undefined, "Category"), type: "select", options: catList, get: (r) => r.category },
    { id: "mustRead", label: t("m.docs.mustRead", undefined, "Must Read"), type: "bool", options: ["Must Read", "Read", "—"], get: (r) => (r.mustRead ? (r.acked ? "Read" : "Must Read") : "—") },
  ];

  const row = (r: ArticleRow) => (
    <Link key={r.id} href={`/m/docs/${r.id}`} className="item tap" style={{ textDecoration: "none", color: "inherit" }}>
      <KIcon name="BookOpen" size={18} style={{ color: "var(--p-text-2)", flex: "none" }} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="t">{r.title}</div>
        <div className="s" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          <span style={{ fontFamily: "var(--p-mono)" }}>{r.code}</span> · {r.category}
        </div>
      </div>
      {r.mustRead && (
        <span className={`ps-badge ${r.acked ? "ps-badge--ok" : "ps-badge--warn"}`}>
          {r.acked ? t("m.docs.acked", undefined, "Read") : t("m.docs.mustRead", undefined, "Must Read")}
        </span>
      )}
    </Link>
  );

  return (
    <div className="screen screen-anim">
      <ScreenHeader onBack={() => window.dispatchEvent(new CustomEvent("compvss:nav-open"))} title={title} />

      <NormalizedList
        k="kn"
        items={rows}
        fields={FIELDS}
        search={(r) => `${r.code} ${r.title} ${r.purpose ?? ""} ${r.category}`}
        searchPlaceholder={t("m.docs.search", undefined, "Search Knowledge…")}
        renderRow={row}
        onRow={(r) => router.push(`/m/docs/${r.id}`)}
        views={["list", "table"]}
        pill={{ get: (r) => r.category, order: catList }}
        empty={{
          cols: [t("m.docs.col.title", undefined, "Title"), t("m.docs.category", undefined, "Category")],
          title: t("m.docs.empty.title", undefined, "No Articles"),
          hint: t("m.docs.empty.body", undefined, "Published SOPs and policies land here. Must-reads ask for your acknowledgement."),
        }}
      />
    </div>
  );
}
