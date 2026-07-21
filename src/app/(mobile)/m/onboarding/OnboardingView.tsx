"use client";

import { useRouter } from "next/navigation";
import { NormalizedList, KIcon, type FieldDef } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Onboarding — the caller's new-hire journeys, migrated onto the kit view
 * engine (NormalizedList: search + View Options / Share & Export drawers +
 * list/table/board by phase). Rows still open the `[assignmentId]` detail. The
 * live-packet banner stays OUTSIDE this list (it's a one-off, not a row).
 */
export type OnboardingItem = {
  id: string;
  phase: string; // raw assignment_phase
  flowName: string | null;
  flowDescription: string | null;
  assignedLabel: string;
  assignedIso: string | null;
};

const PHASE_TONE: Record<string, string> = {
  assigned: "warn",
  in_progress: "info",
  completed: "ok",
  abandoned: "neutral",
};

const TONE_VAR: Record<string, string> = {
  warn: "var(--p-warning)",
  info: "var(--p-info)",
  ok: "var(--p-success)",
  neutral: "var(--p-border)",
};

// Board column dot tones (p-token suffixes), keyed off the same phase.
const BOARD_TONE_BY_PHASE: Record<string, string> = {
  assigned: "warning",
  in_progress: "info",
  completed: "success",
  abandoned: "text-3",
};

export function OnboardingView({ items }: { items: OnboardingItem[] }) {
  const t = useT();
  const router = useRouter();

  const phaseLabel: Record<string, string> = {
    assigned: t("m.onboarding.phase.assigned", undefined, "To Do"),
    in_progress: t("m.onboarding.phase.inProgress", undefined, "In Progress"),
    completed: t("m.onboarding.phase.completed", undefined, "Done"),
    abandoned: t("m.onboarding.phase.abandoned", undefined, "Abandoned"),
  };
  const PHASE_ORDER = ["assigned", "in_progress", "completed", "abandoned"];
  const phaseOf = (x: OnboardingItem) => phaseLabel[x.phase] ?? x.phase;
  const statusOrder = PHASE_ORDER.map((p) => phaseLabel[p] ?? p);
  const boardTone: Record<string, string> = Object.fromEntries(
    PHASE_ORDER.map((p) => [phaseLabel[p], BOARD_TONE_BY_PHASE[p] ?? "text-3"]),
  );

  const fields: FieldDef<OnboardingItem>[] = [
    { id: "flow", label: t("m.onboarding.col.flow", undefined, "Journey"), type: "text", get: (x) => x.flowName ?? "" },
    {
      id: "assignment_phase",
      label: t("m.onboarding.col.status", undefined, "Status"),
      type: "select",
      options: statusOrder,
      get: phaseOf,
    },
    {
      id: "assigned",
      label: t("m.onboarding.col.assigned", undefined, "Assigned"),
      type: "date",
      get: (x) => x.assignedLabel,
      iso: (x) => x.assignedIso,
    },
  ];

  const open = (x: OnboardingItem) => router.push(`/m/onboarding/${x.id}`);

  const row = (x: OnboardingItem) => {
    const tone = PHASE_TONE[x.phase] ?? "neutral";
    return (
      <div
        className="item tap"
        key={x.id}
        role="button"
        tabIndex={0}
        onClick={() => open(x)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open(x);
          }
        }}
      >
        <span className="bar" style={{ background: TONE_VAR[tone] ?? "var(--p-accent)" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t">{x.flowName ?? t("m.onboarding.untitled", undefined, "Onboarding")}</div>
          {x.flowDescription && <div className="s">{x.flowDescription}</div>}
          {x.assignedLabel && <div className="s">{x.assignedLabel}</div>}
        </div>
        <span className={`ps-badge ps-badge--${tone}`} style={{ flex: "none" }}>
          {phaseOf(x)}
        </span>
        <KIcon name="ChevronRight" size={16} style={{ color: "var(--p-text-3)", flex: "none" }} />
      </div>
    );
  };

  return (
    <NormalizedList
      k="onboarding"
      items={items}
      fields={fields}
      search={(x) => `${x.flowName ?? ""} ${x.flowDescription ?? ""}`}
      searchPlaceholder={t("m.onboarding.search", undefined, "Search onboarding…")}
      renderRow={row}
      onRow={open}
      views={["list", "table", "board"]}
      statusField="assignment_phase"
      statusOrder={statusOrder}
      boardTone={boardTone}
      empty={{
        cols: [
          t("m.onboarding.col.flow", undefined, "Journey"),
          t("m.onboarding.col.status", undefined, "Status"),
        ],
        title: t("m.onboarding.emptyTitle", undefined, "All Caught Up"),
        hint: t("m.onboarding.emptyBody", undefined, "New-hire journeys assigned to you appear here."),
      }}
    />
  );
}
