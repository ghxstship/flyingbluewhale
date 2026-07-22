"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { KIcon, NormalizedList, type FieldDef } from "@/components/mobile/kit";
import { EmptyState } from "@/components/ui/EmptyState";
import { useT } from "@/lib/i18n/LocaleProvider";
import { CATALOG_KIND_LABEL_SINGULAR, type CatalogKind } from "@/lib/db/catalog-kinds";
import { KIND_ICON, STATE_TONE, fulfillmentStateLabels, prettyState } from "./_shared";

export type AdvanceRow = {
  id: string;
  title: string | null;
  catalogKind: string;
  fulfillmentState: string;
  deadline: string | null;
  project: string | null;
};

// Kind labels read from the client-safe catalog-kinds SSOT (never re-declared —
// a local copy drifted here before). The icon/tone maps live in ./_shared
// (also consumed by the detail page).
const kindLabel = (k: string): string => CATALOG_KIND_LABEL_SINGULAR[k as CatalogKind] ?? k;

function toneVar(tone: string | undefined): string {
  switch (tone) {
    case "ok":
      return "var(--p-success)";
    case "warn":
      return "var(--p-warning)";
    case "info":
      return "var(--p-info)";
    case "danger":
      return "var(--p-danger)";
    default:
      return "var(--p-border)";
  }
}

/** Kit 34 v3.4 — normalized (NormalizedList: search + View Options/Share drawers
 *  + schema DataView list/table/board + kind pills). Board columns = the
 *  fulfillment lifecycle. Keeps the offline empty state. */
export function AdvancesView({ rows }: { rows: AdvanceRow[] }) {
  const t = useT();
  const router = useRouter();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const stateLabels = useMemo(() => fulfillmentStateLabels(t), [t]);
  const stateLabel = (s: string) => stateLabels[s] ?? prettyState(s);

  const kindLabels = useMemo(() => [...new Set(rows.map((r) => kindLabel(r.catalogKind)))], [rows]);
  const stateInfo = useMemo(() => {
    const states = [...new Set(rows.map((r) => r.fulfillmentState))];
    const order = states.map((s) => stateLabels[s] ?? prettyState(s));
    const tones: Record<string, string> = {};
    for (const s of states) tones[stateLabels[s] ?? prettyState(s)] = STATE_TONE[s] ?? "neutral";
    return { order, tones };
  }, [rows, stateLabels]);

  const FIELDS: FieldDef<AdvanceRow>[] = [
    { id: "title", label: t("m.advances.sort.title", undefined, "Name"), type: "text", get: (r) => r.title ?? kindLabel(r.catalogKind) },
    { id: "kind", label: t("m.advances.group.kind", undefined, "Type"), type: "select", options: kindLabels, get: (r) => kindLabel(r.catalogKind) },
    { id: "state", label: t("m.advances.col.status", undefined, "Status"), type: "select", options: stateInfo.order, get: (r) => stateLabel(r.fulfillmentState) },
    { id: "deadline", label: t("m.advances.sort.deadline", undefined, "Due"), type: "text", get: (r) => r.deadline ?? "" },
    { id: "project", label: t("m.advances.col.project", undefined, "Project"), type: "text", get: (r) => r.project ?? "" },
  ];

  const row = (r: AdvanceRow) => (
    <div
      className="item tap"
      key={r.id}
      role="button"
      tabIndex={0}
      style={{ cursor: "pointer" }}
      onClick={() => router.push(`/m/advances/${r.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(`/m/advances/${r.id}`);
        }
      }}
    >
      <span className="bar" style={{ background: toneVar(STATE_TONE[r.fulfillmentState]) }} />
      <KIcon name={KIND_ICON[r.catalogKind] ?? "Package"} size={18} style={{ color: "var(--p-text-2)", flex: "none" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="t">{r.title ?? kindLabel(r.catalogKind)}</div>
        <div className="s">
          {kindLabel(r.catalogKind)}
          {r.project ? ` · ${r.project}` : ""}
        </div>
      </div>
      <span className={`ps-badge ps-badge--${STATE_TONE[r.fulfillmentState] ?? "neutral"}`}>
        {stateLabel(r.fulfillmentState)}
      </span>
    </div>
  );

  // Offline with nothing cached — the one non-standard empty (the queue promise).
  if (rows.length === 0 && !online) {
    return (
      <EmptyState
        variant="offline"
        title={t("m.advances.offline.title", undefined, "You're offline")}
        description={t("m.advances.offline.body", undefined, "Your advances will load — and any changes will sync — once you're back online.")}
      />
    );
  }

  return (
    <NormalizedList
      k="adv"
      items={rows}
      fields={FIELDS}
      search={(r) => `${r.title ?? ""} ${kindLabel(r.catalogKind)} ${r.project ?? ""}`}
      searchPlaceholder={t("m.advances.search", undefined, "Search Advances…")}
      renderRow={row}
      onRow={(r) => router.push(`/m/advances/${r.id}`)}
      views={["list", "table", "board"]}
      statusField="state"
      statusOrder={stateInfo.order}
      boardTone={stateInfo.tones}
      pill={{ get: (r) => kindLabel(r.catalogKind), order: kindLabels }}
      empty={{
        cols: [
          t("m.advances.sort.title", undefined, "Name"),
          t("m.advances.group.kind", undefined, "Type"),
          t("m.advances.col.status", undefined, "Status"),
        ],
        title: t("m.advances.empty.title", undefined, "No Advances"),
        hint: t("m.advances.empty.body", undefined, "Gear, credentials and services assigned to you appear here."),
      }}
    />
  );
}
