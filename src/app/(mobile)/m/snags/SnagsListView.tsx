"use client";

import { useRouter } from "next/navigation";
import { NormalizedList, type FieldDef, toneToBadge } from "@/components/mobile/kit";
import { PhotoStrip, type StripPhoto } from "@/components/media/PhotoStrip";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * My Snags — the self-raised slice of the `punch_items` store, migrated onto
 * the kit view engine (NormalizedList: search + View Options / Share & Export
 * drawers + typed quick-filter pills + list/table/board views). Shares Punch's
 * schema/FieldDefs (this is the self-scoped twin). Rows open the record at
 * /m/punch/[id] (there is no /m/snags/[id] detail route — the punch detail is
 * org-scoped, so a self-raised snag resolves there). Photos are signed
 * server-side and threaded per item.
 */
export type SnagItem = {
  id: string;
  code: string;
  title: string;
  item_state: string;
  priority: string;
  projectName: string | null;
  createdLabel: string;
  photos: StripPhoto[];
};

/** Tones keyed by the RAW state/priority — the display label is locale-dependent. */
const STATE_TONE: Record<string, string> = {
  open: "info",
  in_progress: "warning",
  ready_for_review: "warning",
  complete: "success",
  void: "text-3",
};
const PRIORITY_TONE: Record<string, string> = { low: "text-3", normal: "text-3", high: "warning", urgent: "danger" };
const RAW_STATE_ORDER = ["open", "in_progress", "ready_for_review", "complete", "void"];
const RAW_PRIORITY_ORDER = ["urgent", "high", "normal", "low"];

function Badge({ tone, children }: { tone: string; children: React.ReactNode }) {
  // Tone → class mapping is the kit's toneToBadge SSOT (was a per-surface ternary).
  return <span className={toneToBadge(tone)}>{children}</span>;
}

export function SnagsListView({ items }: { items: SnagItem[] }) {
  const t = useT();
  const router = useRouter();

  const stateLabel: Record<string, string> = {
    open: t("m.snags.state.open", undefined, "Open"),
    in_progress: t("m.snags.state.inProgress", undefined, "In Progress"),
    ready_for_review: t("m.snags.state.readyForReview", undefined, "Ready For Review"),
    complete: t("m.snags.state.complete", undefined, "Complete"),
    void: t("m.snags.state.void", undefined, "Void"),
  };
  const priorityLabel: Record<string, string> = {
    low: t("m.snags.priority.low", undefined, "Low"),
    normal: t("m.snags.priority.normal", undefined, "Normal"),
    high: t("m.snags.priority.high", undefined, "High"),
    urgent: t("m.snags.priority.urgent", undefined, "Urgent"),
  };
  const stateOf = (x: SnagItem) => stateLabel[x.item_state] ?? x.item_state;
  const prioOf = (x: SnagItem) => priorityLabel[x.priority] ?? x.priority;

  // Board columns + tones keyed by the TRANSLATED label the field emits —
  // keying them by the English label broke both in any other locale.
  const STATE_ORDER = RAW_STATE_ORDER.map((s) => stateLabel[s] ?? s);
  const boardTone: Record<string, string> = Object.fromEntries(
    RAW_STATE_ORDER.map((s) => [stateLabel[s] ?? s, STATE_TONE[s] ?? "text-3"]),
  );

  const fields: FieldDef<SnagItem>[] = [
    { id: "title", label: t("m.snags.col.item", undefined, "Item"), type: "text", get: (x) => x.title },
    { id: "code", label: t("m.snags.col.code", undefined, "Code"), type: "text", get: (x) => x.code },
    { id: "item_state", label: t("m.snags.col.status", undefined, "Status"), type: "select", options: STATE_ORDER, get: stateOf },
    { id: "priority", label: t("m.snags.col.priority", undefined, "Priority"), type: "select", options: RAW_PRIORITY_ORDER.map((p) => priorityLabel[p] ?? p), get: prioOf },
    { id: "project", label: t("m.snags.col.project", undefined, "Project"), type: "select", get: (x) => x.projectName ?? "" },
  ];

  const open = (x: SnagItem) => router.push(`/m/punch/${x.id}`);

  const row = (x: SnagItem, compact?: boolean) => (
    <div
      className="item tap"
      key={x.id}
      role="button"
      tabIndex={0}
      style={{ display: "block" }}
      onClick={() => open(x)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(x); } }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t">{x.title}</div>
          <div className="s">
            {x.code}
            {x.projectName ? ` · ${x.projectName}` : ""}
            {` · ${x.createdLabel}`}
          </div>
        </div>
        <div style={{ textAlign: "right", flex: "none", display: "grid", gap: 4, justifyItems: "end" }}>
          <Badge tone={STATE_TONE[x.item_state] ?? "neutral"}>{stateOf(x)}</Badge>
          {(x.priority === "high" || x.priority === "urgent") && <Badge tone={PRIORITY_TONE[x.priority] ?? "neutral"}>{prioOf(x)}</Badge>}
        </div>
      </div>
      {!compact && <PhotoStrip photos={x.photos} label={x.title} />}
    </div>
  );

  return (
    <NormalizedList
      k="snags"
      items={items}
      fields={fields}
      search={(x) => `${x.title} ${x.code} ${x.projectName ?? ""}`}
      searchPlaceholder={t("m.snags.search", undefined, "Search my snags…")}
      renderRow={row}
      onRow={open}
      views={["list", "table", "board"]}
      statusField="item_state"
      statusOrder={STATE_ORDER}
      boardTone={boardTone}
      pill={{ get: (x) => x.projectName ?? "—" }}
      empty={{
        cols: [
          t("m.snags.col.item", undefined, "Item"),
          t("m.snags.col.status", undefined, "Status"),
          t("m.snags.col.priority", undefined, "Priority"),
        ],
        title: t("m.snags.empty.title", undefined, "No Snags Yet"),
        hint: t("m.snags.empty.body", undefined, "Spot something broken, unsafe or unfinished? Photograph it and it lands on the punch list."),
      }}
    />
  );
}
