"use client";

import { HubChrome } from "@/components/mobile/HubChrome";
import { Block, ListRow, MeterRow, MetricGrid } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { ProjectMilestone } from "@/lib/mobile/project-xpms";

/**
 * Timeline — the field slice of the ATLVS Coordinate Matrix: the 4 field phases
 * (Advance → Load-Out) with progress derived from their milestone rollup, plus
 * the project's current XPMS gate. Composed from the shared layout blocks (no
 * bespoke per-screen markup).
 */
const FIELD_PHASES = ["Advance", "Load-In", "Show Days", "Load-Out"] as const;
const STATUS_TONE: Record<string, string> = { Done: "success", "At Risk": "danger", "On Track": "info", Upcoming: "text-3" };

export function ProjectTimelineView({
  milestones,
  projectName,
  xpmsPhase,
  canManage,
}: {
  milestones: ProjectMilestone[];
  projectName: string | null;
  xpmsPhase: string | null;
  canManage: boolean;
}) {
  const t = useT();
  const byPhase = (p: string) => milestones.filter((m) => m.phase === p);
  const done = milestones.filter((m) => m.status === "Done").length;
  const atRisk = milestones.filter((m) => m.status === "At Risk").length;

  return (
    <div className="screen screen-anim">
      <HubChrome hubKey="projects" active="timeline" canManage={canManage} />

      <MetricGrid
        cells={[
          { k: t("m.projects.tl.project", undefined, "Project"), v: projectName ?? "—" },
          { k: t("m.projects.tl.gate", undefined, "XPMS Gate"), v: xpmsPhase ?? "—" },
          { k: t("m.projects.tl.done", undefined, "Milestones Done"), v: `${done}/${milestones.length}` },
          { k: t("m.projects.tl.atRisk", undefined, "At Risk"), v: atRisk, color: atRisk ? "var(--p-danger)" : undefined },
        ]}
      />

      {FIELD_PHASES.map((phase) => {
        const ms = byPhase(phase);
        const total = ms.length;
        const completed = ms.filter((m) => m.status === "Done").length;
        const pct = total ? Math.round((completed / total) * 100) : 0;
        const tone = ms.some((m) => m.status === "At Risk") ? "danger" : pct === 100 ? "success" : pct > 0 ? "accent" : "text-3";
        return (
          <Block
            key={phase}
            title={phase}
            meta={
              total
                ? t("m.projects.tl.phaseDone", { completed, total }, `${completed}/${total} done`)
                : t("m.projects.tl.phaseEmpty", undefined, "No milestones")
            }
          >
            <MeterRow label={phase} pct={pct} tone={tone} />
            {ms.map((m) => (
              <ListRow
                key={m.id}
                icon="Flag"
                iconColor={`var(--p-${STATUS_TONE[m.status] ?? "text-3"})`}
                title={m.title}
                sub={`${m.milestone_date} · ${m.owner ?? "—"}`}
                right={
                  <span style={{ fontSize: 11, fontWeight: 700, color: `var(--p-${STATUS_TONE[m.status] ?? "text-2"})`, whiteSpace: "nowrap" }}>
                    {m.status}
                  </span>
                }
              />
            ))}
          </Block>
        );
      })}
    </div>
  );
}
