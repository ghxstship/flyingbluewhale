"use client";

import { NormalizedList, type FieldDef, toneToBadge } from "@/components/mobile/kit";
import { PhotoStrip, type StripPhoto } from "@/components/media/PhotoStrip";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Shift Handover — the org-wide end-of-shift report queue, migrated onto the
 * kit view engine (NormalizedList: search + View Options / Share & Export
 * drawers + typed quick-filter pills + list/table/board views). The board
 * groups by `post_state` (All Clear / Watch Items / Issues).
 *
 * `post_state` IS status, so it is NEVER the quick-filter pill (repo canon:
 * pills carry meaningful context, never status). The pill is the author of the
 * handover — who handed the post off. Photos are signed server-side and
 * threaded per item. Handover has no detail route, so rows are not tappable
 * (unchanged from the pre-migration surface).
 */
export type HandoverItem = {
  id: string;
  summary: string;
  post_state: string;
  authorName: string | null;
  reliefLabel: string | null;
  openItems: string | null;
  assetsPassed: string | null;
  createdLabel: string;
  photos: StripPhoto[];
};

/** Tone keyed by the RAW state — the display label is locale-dependent. */
const STATE_TONE: Record<string, string> = {
  all_clear: "success",
  watch_items: "warning",
  issues: "danger",
};
const RAW_STATE_ORDER = ["issues", "watch_items", "all_clear"];

const TONE_VAR: Record<string, string> = {
  success: "var(--p-success)",
  warning: "var(--p-warning)",
  danger: "var(--p-danger)",
};

function Badge({ tone, children }: { tone: string; children: React.ReactNode }) {
  // Tone → class mapping is the kit's toneToBadge SSOT (was a per-surface ternary).
  return <span className={toneToBadge(tone)}>{children}</span>;
}

export function HandoverListView({ items }: { items: HandoverItem[] }) {
  const t = useT();

  const stateLabel: Record<string, string> = {
    all_clear: t("m.handover.state.allClear", undefined, "All Clear"),
    watch_items: t("m.handover.state.watchItems", undefined, "Watch Items"),
    issues: t("m.handover.state.issues", undefined, "Issues"),
  };
  const stateOf = (x: HandoverItem) => stateLabel[x.post_state] ?? x.post_state;

  // Board columns + tones keyed by the TRANSLATED label the field emits —
  // keying them by the English label broke both in any other locale.
  const STATE_ORDER = RAW_STATE_ORDER.map((s) => stateLabel[s] ?? s);
  const boardTone: Record<string, string> = Object.fromEntries(
    RAW_STATE_ORDER.map((s) => [stateLabel[s] ?? s, STATE_TONE[s] ?? "text-3"]),
  );

  const fields: FieldDef<HandoverItem>[] = [
    { id: "summary", label: t("m.handover.col.summary", undefined, "Summary"), type: "text", get: (x) => x.summary },
    { id: "post_state", label: t("m.handover.col.status", undefined, "Status"), type: "select", options: STATE_ORDER, get: stateOf },
    { id: "author", label: t("m.handover.col.author", undefined, "From"), type: "text", get: (x) => x.authorName ?? "" },
  ];

  const row = (x: HandoverItem, compact?: boolean) => {
    const tone = STATE_TONE[x.post_state] ?? "neutral";
    const relief = x.reliefLabel
      ? t("m.handover.handedTo", { relief: x.reliefLabel }, `Handed To ${x.reliefLabel}`)
      : "";
    const meta = [x.authorName ?? "", relief, x.createdLabel].filter(Boolean).join(" · ");
    return (
      <div className="item" key={x.id} style={{ alignItems: "flex-start" }}>
        <span className="bar" style={{ background: TONE_VAR[tone] ?? "var(--p-accent)" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t" style={{ whiteSpace: "pre-wrap" }}>{x.summary}</div>
          {x.openItems ? (
            <div className="s" style={{ whiteSpace: "pre-wrap", marginTop: 2 }}>
              {t("m.handover.openItems", undefined, "Open Items")}: {x.openItems}
            </div>
          ) : null}
          {x.assetsPassed ? (
            <div className="s" style={{ whiteSpace: "pre-wrap", marginTop: 2 }}>
              {t("m.handover.assets", undefined, "Assets / Keys")}: {x.assetsPassed}
            </div>
          ) : null}
          {!compact && (
            <PhotoStrip photos={x.photos} label={t("m.handover.photoAlt", undefined, "Handover photo")} />
          )}
          <div className="hint" style={{ marginTop: 4 }}>{meta}</div>
        </div>
        <Badge tone={tone}>{stateOf(x)}</Badge>
      </div>
    );
  };

  return (
    <NormalizedList
      k="handover"
      items={items}
      fields={fields}
      search={(x) => `${x.summary} ${x.authorName ?? ""} ${x.openItems ?? ""} ${x.assetsPassed ?? ""}`}
      searchPlaceholder={t("m.handover.search", undefined, "Search handovers…")}
      renderRow={row}
      views={["list", "table", "board"]}
      statusField="post_state"
      statusOrder={STATE_ORDER}
      boardTone={boardTone}
      pill={{ get: (x) => x.authorName ?? "—" }}
      empty={{
        cols: [
          t("m.handover.col.summary", undefined, "Summary"),
          t("m.handover.col.status", undefined, "Status"),
          t("m.handover.col.author", undefined, "From"),
        ],
        title: t("m.handover.emptyTitle", undefined, "No Handovers"),
        hint: t("m.handover.emptyBody", undefined, "Submit an end-of-shift handover to start the trail."),
      }}
    />
  );
}
