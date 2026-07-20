"use client";

import Link from "next/link";
import { KIcon, NormalizedList, type FieldDef } from "@/components/mobile/kit";
import { useFormatters } from "@/lib/i18n/LocaleProvider";

export type ActivityRow = {
  id: string;
  type: string;
  icon: string;
  title: string;
  detail: string;
  at: string;
  /** Kit 31 resolution #19b — linked asset records open their detail card. */
  href: string | null;
};

type Labels = { search: string; emptyTitle: string; emptyBody: string };

/** Kit 34 v3.4 — normalized (NormalizedList: search + View Options/Share drawers
 *  + schema DataView + type pills). The list view keeps the timeline rail
 *  (`listWrapClassName="tl"`); the same schema also offers a table view. */
export function ActivityView({ rows, labels }: { rows: ActivityRow[]; labels: Labels }) {
  const fmt = useFormatters();
  const allTypes = [...new Set(rows.map((r) => r.type))];

  const rel = (iso: string) => {
    if (!iso) return "";
    return fmt.dateParts(new Date(iso), { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  const FIELDS: FieldDef<ActivityRow>[] = [
    { id: "title", label: "Event", type: "text", get: (r) => r.title },
    { id: "type", label: "Type", type: "select", options: allTypes, get: (r) => r.type },
    { id: "at", label: "When", type: "date", get: (r) => r.at, iso: (r) => (r.at ? r.at.slice(0, 10) : null) },
  ];

  const row = (r: ActivityRow) => (
    <div className="tl-row" key={r.id}>
      <span className="tdot">
        <KIcon name={r.icon} size={8} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {r.href ? (
          <Link href={r.href} className="ttxt" style={{ display: "flex", alignItems: "center", gap: 5, color: "inherit", textDecoration: "none" }}>
            <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{r.title}</span>
            <KIcon name="ChevronRight" size={13} style={{ color: "var(--p-text-3)", flex: "none" }} />
          </Link>
        ) : (
          <div className="ttxt">{r.title}</div>
        )}
        {/* rel() uses the runtime-default locale + timezone, which differs
            between the SSR server (UTC) and the browser, so the formatted text
            mismatches on hydration → React #418. The row timestamp is purely
            informational, so suppress the per-cell hydration check. */}
        <div className="ttime" suppressHydrationWarning>
          {r.type} · {rel(r.at)}
        </div>
      </div>
    </div>
  );

  return (
    <NormalizedList
      k="ac"
      items={rows}
      fields={FIELDS}
      search={(r) => `${r.title} ${r.detail} ${r.type}`}
      searchPlaceholder={labels.search}
      renderRow={row}
      views={["list", "table"]}
      listWrapClassName="tl"
      pill={{ get: (r) => r.type, order: allTypes }}
      empty={{ cols: ["Event", "Type", "When"], title: labels.emptyTitle, hint: labels.emptyBody }}
    />
  );
}
