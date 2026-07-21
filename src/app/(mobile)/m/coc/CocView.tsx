"use client";

import { NormalizedList, KIcon, type FieldDef } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Chain of Custody — the org-wide asset custody log, migrated onto the kit view
 * engine (NormalizedList: search + View Options / Share & Export drawers + a
 * typed context pill). The `.tl` timeline look is preserved: `renderRow` keeps
 * the `.tl-row` markup and the list is wrapped in `.tl` via `listWrapClassName`.
 * There is no per-event detail page, so rows aren't tappable (as before).
 */
export type CocEvent = {
  id: string;
  title: string;
  event_kind: string; // "scan" | "state_change"
  catalog_kind: string | null;
  result: string | null;
  from_state: string | null;
  to_state: string | null;
  body: string | null;
  dateLabel: string;
  iso: string | null;
};

export function CocView({ items }: { items: CocEvent[] }) {
  const t = useT();

  const kindLabel = (x: CocEvent) =>
    x.event_kind === "scan"
      ? t("m.coc.kind.scan", undefined, "Scan")
      : t("m.coc.kind.stateChange", undefined, "State Change");

  const detailOf = (x: CocEvent) =>
    x.event_kind === "scan"
      ? `${t("m.coc.scan", undefined, "Scan")} · ${x.result ?? "—"}`
      : `${x.from_state ?? "—"} → ${x.to_state ?? "—"}`;

  const fields: FieldDef<CocEvent>[] = [
    { id: "title", label: t("m.coc.col.asset", undefined, "Asset"), type: "text", get: (x) => x.title },
    { id: "event_kind", label: t("m.coc.col.event", undefined, "Event"), type: "select", get: kindLabel },
    { id: "catalog_kind", label: t("m.coc.col.kind", undefined, "Kind"), type: "select", get: (x) => x.catalog_kind ?? "" },
    { id: "at", label: t("m.coc.col.when", undefined, "When"), type: "date", get: (x) => x.dateLabel, iso: (x) => x.iso },
  ];

  const row = (x: CocEvent) => {
    const isScan = x.event_kind === "scan";
    return (
      <div className="tl-row" key={x.id}>
        <span className="tdot" aria-hidden="true">
          <KIcon name={isScan ? "ScanLine" : "ArrowRight"} size={9} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="ttxt">{x.title}</div>
          <div className="ttime">
            {detailOf(x)}
            {x.catalog_kind ? ` · ${x.catalog_kind}` : ""}
          </div>
          {x.body && <div className="hint">{x.body}</div>}
          <div className="ttime">{x.dateLabel}</div>
        </div>
      </div>
    );
  };

  return (
    <NormalizedList
      k="coc"
      items={items}
      fields={fields}
      search={(x) =>
        `${x.title} ${x.catalog_kind ?? ""} ${x.result ?? ""} ${x.from_state ?? ""} ${x.to_state ?? ""} ${x.body ?? ""}`
      }
      searchPlaceholder={t("m.coc.search", undefined, "Search custody events…")}
      renderRow={row}
      views={["list", "table"]}
      listWrapClassName="tl"
      pill={{ get: (x) => x.catalog_kind ?? "—" }}
      empty={{
        cols: [
          t("m.coc.col.asset", undefined, "Asset"),
          t("m.coc.col.event", undefined, "Event"),
          t("m.coc.col.when", undefined, "When"),
        ],
        title: t("m.coc.emptyTitle", undefined, "No Custody Events"),
        hint: t("m.coc.emptyBody", undefined, "Scans and asset handoffs will appear here as a timeline."),
      }}
    />
  );
}
