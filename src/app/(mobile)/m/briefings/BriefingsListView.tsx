"use client";

import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { NormalizedList, type FieldDef } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Safety Briefings — the org-wide toolbox-talk queue for the current 8-day
 * window, migrated onto the kit view engine (NormalizedList: search + View
 * Options / Share & Export drawers + typed quick-filter pills + list/table/
 * board/calendar views). The calendar view (driven by `scheduled_for`)
 * replaces the old hand-rolled Today / This-Week grouping. Rows still open the
 * record at /m/briefings/[briefingId].
 */
export type BriefingItem = {
  id: string;
  topic: string;
  briefing_state: string;
  scheduledLabel: string;
  scheduledIso: string;
  projectName: string | null;
};

const STATE_TONE: Record<string, string> = {
  Scheduled: "info",
  Conducted: "success",
  Cancelled: "text-3",
};
const STATE_ORDER = ["Scheduled", "Conducted", "Cancelled"];

function Badge({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <span
      className={`ps-badge ps-badge--${tone === "warning" ? "warn" : tone === "text-3" ? "neutral" : tone === "success" ? "ok" : tone}`}
    >
      {children}
    </span>
  );
}

export function BriefingsListView({ items }: { items: BriefingItem[] }) {
  const t = useT();
  const router = useRouter();

  const stateLabel: Record<string, string> = {
    scheduled: t("m.briefings.state.scheduled", undefined, "Scheduled"),
    conducted: t("m.briefings.state.conducted", undefined, "Conducted"),
    cancelled: t("m.briefings.state.cancelled", undefined, "Cancelled"),
  };
  const stateOf = (x: BriefingItem) => stateLabel[x.briefing_state] ?? x.briefing_state;

  const fields: FieldDef<BriefingItem>[] = [
    { id: "topic", label: t("m.briefings.col.topic", undefined, "Topic"), type: "text", get: (x) => x.topic },
    { id: "briefing_state", label: t("m.briefings.col.status", undefined, "Status"), type: "select", options: STATE_ORDER, get: stateOf },
    { id: "project", label: t("m.briefings.col.project", undefined, "Project"), type: "select", get: (x) => x.projectName ?? "" },
    {
      id: "scheduled_for",
      label: t("m.briefings.col.scheduled", undefined, "Scheduled"),
      type: "date",
      get: (x) => x.scheduledLabel,
      iso: (x) => x.scheduledIso || null,
    },
  ];

  const open = (x: BriefingItem) => router.push(`/m/briefings/${x.id}`);

  const row = (x: BriefingItem) => (
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
        <ShieldCheck size={18} aria-hidden="true" style={{ color: "var(--p-text-2)", flex: "none", marginTop: 2 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t">{x.topic}</div>
          <div className="s">
            {x.scheduledLabel}
            {x.projectName ? ` · ${x.projectName}` : ""}
          </div>
        </div>
        <div style={{ flex: "none" }}>
          <Badge tone={STATE_TONE[stateOf(x)] ?? "neutral"}>{stateOf(x)}</Badge>
        </div>
      </div>
    </div>
  );

  return (
    <NormalizedList
      k="briefings"
      items={items}
      fields={fields}
      search={(x) => `${x.topic} ${x.projectName ?? ""}`}
      searchPlaceholder={t("m.briefings.search", undefined, "Search briefings…")}
      renderRow={row}
      onRow={open}
      views={["list", "table", "board", "calendar"]}
      statusField="briefing_state"
      statusOrder={STATE_ORDER}
      boardTone={STATE_TONE}
      dateField="scheduled_for"
      pill={{ get: (x) => x.projectName ?? "—" }}
      empty={{
        cols: ["Topic", "Status", "Scheduled"],
        title: t("m.briefings.empty.title", undefined, "No Briefings This Week"),
        hint: t(
          "m.briefings.empty.body",
          undefined,
          "Toolbox talks scheduled for your org show up here. Crew sign in from this screen when the talk runs.",
        ),
      }}
    />
  );
}
