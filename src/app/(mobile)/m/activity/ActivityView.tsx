"use client";

import { useMemo, useState } from "react";
import { KIcon } from "@/components/mobile/kit";
import { EmptyState } from "@/components/ui/EmptyState";
import { useFormatters } from "@/lib/i18n/LocaleProvider";

export type ActivityRow = {
  id: string;
  type: string;
  icon: string;
  title: string;
  detail: string;
  at: string;
};

type Labels = { search: string; emptyTitle: string; emptyBody: string };

export function ActivityView({ rows, labels }: { rows: ActivityRow[]; labels: Labels }) {
  const fmt = useFormatters();
  const [query, setQuery] = useState("");
  const [types, setTypes] = useState<Set<string>>(new Set());

  const allTypes = useMemo(() => [...new Set(rows.map((r) => r.type))], [rows]);

  const items = useMemo(
    () =>
      rows.filter(
        (r) =>
          (types.size === 0 || types.has(r.type)) &&
          (!query ||
            (r.title + " " + r.detail + " " + r.type).toLowerCase().includes(query.toLowerCase())),
      ),
    [rows, types, query],
  );

  const rel = (iso: string) => {
    if (!iso) return "";
    return fmt.dateParts(new Date(iso), {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <>
      <div className="searchbar" style={{ marginBottom: 8 }}>
        <KIcon name="Search" size={16} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={labels.search}
        />
        {query && (
          <KIcon name="X" size={15} style={{ cursor: "pointer" }} />
        )}
      </div>
      <div className="chips" style={{ paddingBottom: 12 }}>
        {allTypes.map((tp) => (
          <button
            type="button"
            key={tp}
            className={`chip ${types.has(tp) ? "on" : ""}`}
            onClick={() =>
              setTypes((p) => {
                const n = new Set(p);
                n.has(tp) ? n.delete(tp) : n.add(tp);
                return n;
              })
            }
          >
            {tp}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState title={labels.emptyTitle} description={labels.emptyBody} />
      ) : (
        <div className="tl">
          {items.map((r) => (
            <div className="tl-row" key={r.id}>
              <span className="tdot">
                <KIcon name={r.icon} size={8} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="ttxt">{r.title}</div>
                {/* rel() uses the runtime-default locale + timezone, which
                    differs between the SSR server (UTC) and the browser, so the
                    formatted text mismatches on hydration → React #418. The row
                    timestamp is purely informational, so suppress the per-cell
                    hydration check (the repo pattern, see AuditLogViewer). */}
                <div className="ttime" suppressHydrationWarning>
                  {r.type} · {rel(r.at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
