"use client";

import { useRouter } from "next/navigation";
import { NormalizedList, type FieldDef, toneToBadge } from "@/components/mobile/kit";
import { PhotoStrip, type StripPhoto } from "@/components/media/PhotoStrip";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Punch List — the org-wide inspection queue, migrated onto the kit view engine
 * (NormalizedList: search + View Options / Share & Export drawers + typed
 * quick-filter pills + list/table/board views). Rows still open the record at
 * /m/punch/[id]. Photos are signed server-side and threaded per item.
 */
export type PunchItem = {
  id: string;
  code: string;
  title: string;
  item_state: string;
  priority: string;
  projectName: string | null;
  assigneeName: string | null;
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

export function PunchListView({ items }: { items: PunchItem[] }) {
  const t = useT();
  const router = useRouter();

  const stateLabel: Record<string, string> = {
    open: t("m.punchList.state.open", undefined, "Open"),
    in_progress: t("m.punchList.state.inProgress", undefined, "In Progress"),
    ready_for_review: t("m.punchList.state.readyForReview", undefined, "In Review"),
    complete: t("m.punchList.state.complete", undefined, "Closed"),
    void: t("m.punchList.state.void", undefined, "Void"),
  };
  const priorityLabel: Record<string, string> = {
    low: t("m.punchList.priority.low", undefined, "Low"),
    normal: t("m.punchList.priority.normal", undefined, "Normal"),
    high: t("m.punchList.priority.high", undefined, "High"),
    urgent: t("m.punchList.priority.urgent", undefined, "Urgent"),
  };
  const stateOf = (x: PunchItem) => stateLabel[x.item_state] ?? x.item_state;
  const prioOf = (x: PunchItem) => priorityLabel[x.priority] ?? x.priority;

  // Board columns + tones keyed by the TRANSLATED label the field emits —
  // keying them by the English label broke both in any other locale.
  const STATE_ORDER = RAW_STATE_ORDER.map((s) => stateLabel[s] ?? s);
  const boardTone: Record<string, string> = Object.fromEntries(
    RAW_STATE_ORDER.map((s) => [stateLabel[s] ?? s, STATE_TONE[s] ?? "text-3"]),
  );

  const fields: FieldDef<PunchItem>[] = [
    { id: "title", label: t("m.punchList.col.item", undefined, "Item"), type: "text", get: (x) => x.title },
    { id: "code", label: t("m.punchList.col.code", undefined, "Code"), type: "text", get: (x) => x.code },
    { id: "item_state", label: t("m.punchList.col.status", undefined, "Status"), type: "select", options: STATE_ORDER, get: stateOf },
    { id: "priority", label: t("m.punchList.col.priority", undefined, "Priority"), type: "select", options: RAW_PRIORITY_ORDER.map((p) => priorityLabel[p] ?? p), get: prioOf },
    { id: "project", label: t("m.punchList.col.project", undefined, "Project"), type: "select", get: (x) => x.projectName ?? "" },
    { id: "assignee", label: t("m.punchList.col.assignee", undefined, "Assignee"), type: "text", get: (x) => x.assigneeName ?? "" },
  ];

  const open = (x: PunchItem) => router.push(`/m/punch/${x.id}`);

  const row = (x: PunchItem, compact?: boolean) => (
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
          <div className="s">
            {x.assigneeName
              ? t("m.punchList.assignedTo", { name: x.assigneeName }, `Assigned · ${x.assigneeName}`)
              : t("m.punchList.unassigned", undefined, "Unassigned")}
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
      k="punch"
      items={items}
      fields={fields}
      search={(x) => `${x.title} ${x.code} ${x.assigneeName ?? ""} ${x.projectName ?? ""}`}
      searchPlaceholder={t("m.punchList.search", undefined, "Search punch list…")}
      renderRow={row}
      onRow={open}
      views={["list", "table", "board"]}
      statusField="item_state"
      statusOrder={STATE_ORDER}
      boardTone={boardTone}
      pill={{ get: (x) => x.projectName ?? "—" }}
      empty={{
        cols: [
          t("m.punchList.col.item", undefined, "Item"),
          t("m.punchList.col.status", undefined, "Status"),
          t("m.punchList.col.priority", undefined, "Priority"),
        ],
        title: t("m.punchList.empty.title", undefined, "Nothing On The List"),
        hint: t("m.punchList.empty.body", undefined, "Inspection items land here as they are raised."),
      }}
    />
  );
}
