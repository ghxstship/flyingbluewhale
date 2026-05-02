import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { resolveProposalContext, listPhasesWithGates } from "@/lib/proposals/portal/queries";
import { PHASE_STATUS_LABEL, PHASE_STATUS_TONE } from "@/lib/proposals/portal/types";
import { timeAgo } from "@/lib/format";
import { PhaseGateForm } from "./PhaseGateForm";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string; proposalId: string }> }) {
  const { slug, proposalId } = await params;
  const ctx = await resolveProposalContext(slug, proposalId);
  if (!ctx) notFound();
  const phases = await listPhasesWithGates(proposalId);

  return (
    <div className="space-y-4 p-6">
      <header className="surface p-5">
        <div className="eyebrow text-xs text-[var(--text-muted)]">Production lifecycle</div>
        <h1 className="text-lg font-semibold">8-phase progression with milestone gates</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Each phase advances when every gate item is checked. Phases unlock left-to-right; approving a phase
          auto-starts the next one.
        </p>
      </header>

      <ol className="space-y-4">
        {phases.map((p) => {
          const total = p.gateItems.length;
          const done = p.gateItems.filter((g) => g.is_done).length;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          const tone = PHASE_STATUS_TONE[p.status];
          const variantMap = { muted: "muted", info: "info", warning: "warning", success: "success" } as const;
          const isLocked = p.status === "locked";
          const canApprove = p.status === "in_review" || p.status === "active";

          return (
            <li key={p.id} className="surface p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="font-mono text-2xl text-[var(--text-muted)]">
                    {String(p.phase_num).padStart(2, "0")}
                  </div>
                  <div>
                    <h2 className="text-lg leading-tight font-semibold">{p.phase_name}</h2>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                      <Badge variant={variantMap[tone]}>{PHASE_STATUS_LABEL[p.status]}</Badge>
                      {p.started_at && <span>Started {timeAgo(p.started_at)}</span>}
                      {p.approved_at && <span>· Approved {timeAgo(p.approved_at)}</span>}
                    </div>
                  </div>
                </div>
                <div className="w-40">
                  <ProgressBar value={pct} showLabel aria-label={`${p.phase_name} progress`} />
                </div>
              </div>

              {!isLocked && p.gateItems.length > 0 && (
                <div className="mt-4">
                  <div className="eyebrow mb-2 text-xs text-[var(--text-muted)]">Milestone gates</div>
                  <PhaseGateForm
                    phaseStateId={p.id}
                    slug={slug}
                    proposalId={proposalId}
                    gateItems={p.gateItems.map((g) => ({ id: g.id, label: g.label, is_done: g.is_done }))}
                    canApprove={canApprove}
                  />
                </div>
              )}
              {isLocked && p.gateItems.length > 0 && (
                <div className="mt-4 rounded border border-dashed border-[var(--border-color)] bg-[var(--surface-inset)] p-4 text-sm text-[var(--text-muted)]">
                  This phase will unlock when Phase {String(p.phase_num - 1).padStart(2, "0")} is approved.
                  <ul className="mt-2 space-y-1 text-xs">
                    {p.gateItems.map((g) => (
                      <li key={g.id}>▢ {g.label}</li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
