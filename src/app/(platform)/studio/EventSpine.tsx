import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getRequestT } from "@/lib/i18n/request";

/**
 * Event Spine — the Sell → Settle lifecycle checklist rendered as the Home
 * hero (v7.8 zero-training layer, design_handoff_console_rebuild README
 * §"THE ZERO-TRAINING LAYER" #1). The spine IS the training: 8 phases, each
 * with 2–3 gate steps, every step deep-links to its route. Phase state is
 * derived from the active production's `xpms_phase` (the XPMS v08 8-gate
 * lifecycle) via SPINE_PHASE_MAP — done = green check, current = accent,
 * next = muted. Steps inside a completed phase render checked; per-step
 * completion signals are NOT fabricated (honest-coverage rule).
 */

/** XPMS project macro-phase → spine index (kit ConsoleDashboard SPINE_PHASE_MAP). */
const SPINE_PHASE_MAP: Record<string, number> = {
  Discovery: 1,
  Design: 1,
  Advance: 2,
  Procurement: 2,
  Build: 3,
  Install: 3,
  Operate: 5,
  Close: 7,
};

type SpineStep = { key: string; label: string; href: string };
type SpinePhase = { key: string; label: string; href: string; steps: SpineStep[] };

function spinePhases(projectId: string | null): SpinePhase[] {
  const advancingHref = projectId ? `/studio/projects/${projectId}/advancing/assignments` : "/studio/projects";
  return [
    {
      key: "sell",
      label: "Sell",
      href: "/studio/crm",
      steps: [
        { key: "dealWon", label: "Deal Won", href: "/studio/crm" },
        { key: "proposalSigned", label: "Proposal Signed", href: "/studio/proposals" },
      ],
    },
    {
      key: "plan",
      label: "Plan",
      href: "/studio/projects",
      steps: [
        { key: "eventCreated", label: "Event Created", href: "/studio/projects" },
        { key: "budgetApproved", label: "Budget Approved", href: "/studio/finance/budgets" },
        { key: "datesConfirmed", label: "Dates Confirmed", href: "/studio/operations/reservations" },
      ],
    },
    {
      key: "source",
      label: "Source",
      href: "/studio/procurement/requisitions",
      steps: [
        { key: "requisitionsConverted", label: "Requisitions Converted", href: "/studio/procurement/requisitions" },
        { key: "posIssued", label: "POs Issued", href: "/studio/procurement/purchase-orders" },
        { key: "advancingFulfilled", label: "Advancing Fulfilled", href: advancingHref },
      ],
    },
    {
      key: "build",
      label: "Build",
      href: "/studio/production/fabrication",
      steps: [
        { key: "fabricationQc", label: "Fabrication Through QC", href: "/studio/production/fabrication" },
        { key: "punchCleared", label: "Punch List Cleared", href: "/studio/punch" },
      ],
    },
    {
      key: "crew",
      label: "Crew",
      href: "/studio/workforce/deployment",
      steps: [
        { key: "shiftsPublished", label: "Shifts Published", href: "/studio/workforce/deployment" },
        { key: "credentialsIssued", label: "Credentials Issued", href: "/studio/people/credentials" },
      ],
    },
    {
      key: "run",
      label: "Run",
      href: "/studio/production/ros",
      steps: [
        { key: "rosLocked", label: "Run Of Show Locked", href: "/studio/production/ros" },
        { key: "dailyLogSigned", label: "Daily Log Signed", href: "/studio/operations/daily-log" },
      ],
    },
    {
      key: "protect",
      label: "Protect",
      href: "/studio/safety",
      steps: [
        { key: "permitsCleared", label: "Permits Cleared", href: "/studio/compliance/permits" },
        { key: "inspectionsPassed", label: "Inspections Passed", href: "/studio/inspections" },
      ],
    },
    {
      key: "settle",
      label: "Settle",
      href: "/studio/finance/wip",
      steps: [
        { key: "settlementDrafted", label: "Settlement Drafted", href: "/studio/finance/wip" },
        { key: "eventClosed", label: "Event Closed", href: "/studio/finance/periods" },
      ],
    },
  ];
}

export async function EventSpine({ orgId }: { orgId: string }) {
  const [{ t }, supabase] = await Promise.all([getRequestT(), createClient()]);

  // The most recent active production drives phase state; fall back to the
  // newest project of any state so a fresh workspace still sees the map.
  const { data: active } = await supabase
    .from("projects")
    .select("id, name, xpms_phase, project_state, start_date")
    .eq("org_id", orgId)
    .eq("project_state", "active")
    .is("deleted_at", null)
    .order("start_date", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  const project = active ?? null;
  // No active production → nothing is done yet; the spine renders as the
  // route map with phase 0 current (teach the path, promise the lights).
  const current = project ? (SPINE_PHASE_MAP[project.xpms_phase] ?? 0) : 0;
  const phases = spinePhases(project?.id ?? null);

  return (
    <section className="surface p-4" aria-label={t("console.spine.aria", undefined, "Event Spine lifecycle checklist")}>
      <div className="flex flex-wrap items-center gap-2 pb-3">
        <span className="font-mono text-[11px] font-bold tracking-[0.14em] text-[var(--p-text-3)] uppercase">
          {t("console.spine.eyebrow", undefined, "Event Spine · Sell → Settle")}
        </span>
        <span className="flex-1" />
        <span className="truncate font-mono text-[11px] tracking-[0.08em] text-[var(--p-text-3)] uppercase">
          {project
            ? t(
                "console.spine.activeProduction",
                { name: project.name, phase: project.xpms_phase },
                `${project.name} · ${project.xpms_phase}`,
              )
            : t("console.spine.noActive", undefined, "No Active Production · The Spine Lights Up When One Goes Active")}
        </span>
      </div>
      <ol className="flex flex-wrap gap-2">
        {phases.map((ph, i) => {
          const state = i < current ? "done" : i === current ? "current" : "next";
          return (
            <li
              key={ph.key}
              data-state={state}
              className={`min-w-[118px] flex-1 rounded-[var(--p-r-md)] border bg-[var(--p-bg)] p-2.5 ${
                state === "current" ? "border-[var(--p-accent)]/50" : "border-[var(--p-border)]"
              }`}
            >
              <Link href={ph.href} className="flex items-center gap-2 hover:text-[var(--p-text-1)]">
                <span
                  aria-hidden
                  className={`grid h-5 w-5 flex-none place-items-center rounded-full text-[11px] font-bold ${
                    state === "done"
                      ? "bg-[var(--p-success)] text-white"
                      : state === "current"
                        ? "bg-[var(--p-accent)] text-[var(--p-accent-contrast)]"
                        : "bg-[var(--p-surface-2)] text-[var(--p-text-3)]"
                  }`}
                >
                  {state === "done" ? "✓" : i + 1}
                </span>
                {/* Hanken 700 (Anton ceiling — Anton is display/h1/h2 only;
                    a 13px label set in Anton over-shouts, v7.0 rule B). */}
                <span className="text-[13px] font-bold tracking-wide uppercase">
                  {t(`console.spine.phase.${ph.key}`, undefined, ph.label)}
                </span>
              </Link>
              <ul className="mt-1.5 space-y-1">
                {ph.steps.map((st) => {
                  const done = state === "done";
                  return (
                    <li key={st.key}>
                      <Link
                        href={st.href}
                        className="flex items-center gap-1.5 text-[11px] leading-tight text-[var(--p-text-2)] hover:text-[var(--p-text-1)]"
                      >
                        <span
                          aria-hidden
                          className={`flex-none text-[11px] ${done ? "text-[var(--p-success)]" : "text-[var(--p-text-3)]"}`}
                        >
                          {done ? "✓" : "○"}
                        </span>
                        {t(`console.spine.step.${st.key}`, undefined, st.label)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
