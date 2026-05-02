import Link from "next/link";
import { notFound } from "next/navigation";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/i18n/format";
import { timeAgo } from "@/lib/format";
import {
  resolveProposalContext,
  getProposalSummary,
  listPhasesWithGates,
  listChangeOrders,
  listRevisionRounds,
  listApprovals,
  listActivity,
} from "@/lib/proposals/portal/queries";
import {
  PHASE_STATUS_LABEL,
  PHASE_STATUS_TONE,
  CO_STATE_LABEL,
  CO_STATE_VARIANT,
  REV_STATE_LABEL,
  REV_STATE_VARIANT,
  APPROVAL_STATE_LABEL,
  APPROVAL_STATE_VARIANT,
} from "@/lib/proposals/portal/types";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string; proposalId: string }> }) {
  const { slug, proposalId } = await params;
  const ctx = await resolveProposalContext(slug, proposalId);
  if (!ctx) notFound();

  const baseAmount = ctx.proposal.amount_cents ?? 0;
  const [summary, phases, changeOrders, rounds, approvals, activity] = await Promise.all([
    getProposalSummary(proposalId, baseAmount),
    listPhasesWithGates(proposalId),
    listChangeOrders(proposalId),
    listRevisionRounds(proposalId),
    listApprovals(proposalId),
    listActivity(proposalId, 10),
  ]);

  const phasePct = summary.totalPhases > 0 ? Math.round((summary.completedPhases / summary.totalPhases) * 100) : 0;

  const base = `/p/${slug}/client/proposals/${proposalId}`;

  return (
    <div className="space-y-8 p-6">
      {/* Top metrics */}
      <div className="metric-grid">
        <MetricCard label="Lifecycle Progress" value={`${summary.completedPhases} / ${summary.totalPhases}`} accent />
        <MetricCard
          label="Active Phase"
          value={
            summary.activePhase
              ? `${String(summary.activePhase.phase_num).padStart(2, "0")} ${summary.activePhase.phase_name}`
              : "—"
          }
        />
        <MetricCard label="Pending Approvals" value={summary.pendingApprovals} />
        <MetricCard
          label="Total Contracted"
          value={formatMoney(summary.totalContractedCents)}
          delta={
            summary.approvedChangeCents > 0
              ? { value: `+${formatMoney(summary.approvedChangeCents)}`, positive: true }
              : undefined
          }
        />
      </div>

      {/* Lifecycle preview */}
      <section className="surface p-6">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <div className="eyebrow text-xs text-[var(--text-muted)]">Lifecycle</div>
            <h2 className="text-lg font-semibold">8-phase production progress</h2>
          </div>
          <Button href={`${base}/lifecycle`} variant="secondary" size="sm">
            View lifecycle →
          </Button>
        </div>
        <ProgressBar value={phasePct} showLabel aria-label="Lifecycle progress" />
        <ol className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {phases.map((p) => (
            <li key={p.id} className="rounded border border-[var(--border-color)] bg-[var(--surface)] p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[var(--text-muted)]">
                  {String(p.phase_num).padStart(2, "0")}
                </span>
                <Badge
                  variant={
                    PHASE_STATUS_TONE[p.status] === "muted"
                      ? "muted"
                      : PHASE_STATUS_TONE[p.status] === "info"
                        ? "info"
                        : PHASE_STATUS_TONE[p.status] === "warning"
                          ? "warning"
                          : "success"
                  }
                >
                  {PHASE_STATUS_LABEL[p.status]}
                </Badge>
              </div>
              <div className="mt-1 text-sm leading-tight font-medium">{p.phase_name}</div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">
                {p.gateItems.filter((g) => g.is_done).length}/{p.gateItems.length} gates
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Three-column open-items grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Pending approvals */}
        <section className="surface p-5">
          <header className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Approvals</h3>
            <Link
              href={`${base}/approvals`}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              All →
            </Link>
          </header>
          {approvals.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No approvals pending.</p>
          ) : (
            <ul className="space-y-2">
              {approvals.slice(0, 4).map((a) => (
                <li key={a.id}>
                  <Link
                    href={`${base}/approvals/${a.id}`}
                    className="hover-lift block rounded border border-[var(--border-color)] p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="line-clamp-1 text-sm font-medium">{a.title}</span>
                      <Badge variant={APPROVAL_STATE_VARIANT[a.state]}>{APPROVAL_STATE_LABEL[a.state]}</Badge>
                    </div>
                    {a.due_at && <div className="mt-1 text-xs text-[var(--text-muted)]">Due {timeAgo(a.due_at)}</div>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Open change orders */}
        <section className="surface p-5">
          <header className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Change Orders</h3>
            <Link
              href={`${base}/change-orders`}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              All →
            </Link>
          </header>
          {changeOrders.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No change orders.</p>
          ) : (
            <ul className="space-y-2">
              {changeOrders.slice(0, 4).map((co) => (
                <li key={co.id}>
                  <Link
                    href={`${base}/change-orders/${co.id}`}
                    className="hover-lift block rounded border border-[var(--border-color)] p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="line-clamp-1 text-sm font-medium">
                        #{co.number} · {co.title}
                      </span>
                      <Badge variant={CO_STATE_VARIANT[co.state]}>{CO_STATE_LABEL[co.state]}</Badge>
                    </div>
                    <div className="mt-1 font-mono text-xs text-[var(--text-muted)]">
                      Δ {formatMoney(co.delta_cents ?? 0)}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Open revisions */}
        <section className="surface p-5">
          <header className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Revisions</h3>
            <Link
              href={`${base}/revisions`}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              All →
            </Link>
          </header>
          {rounds.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No revision rounds.</p>
          ) : (
            <ul className="space-y-2">
              {rounds.slice(0, 4).map((r) => (
                <li key={r.id}>
                  <Link
                    href={`${base}/revisions/${r.id}`}
                    className="hover-lift block rounded border border-[var(--border-color)] p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="line-clamp-1 text-sm font-medium">
                        Round {r.round_num} · {r.title}
                      </span>
                      <Badge variant={REV_STATE_VARIANT[r.state]}>{REV_STATE_LABEL[r.state]}</Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Activity */}
      <section className="surface p-6">
        <header className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Recent Activity</h3>
          <Link href={`${base}/activity`} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            All →
          </Link>
        </header>
        {activity.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No activity yet.</p>
        ) : (
          <ul className="space-y-2">
            {activity.map((e) => (
              <li
                key={e.id}
                className="flex items-start gap-3 rounded border border-[var(--border-color)] bg-[var(--surface)] p-3"
              >
                <span
                  className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full bg-[var(--org-primary)]"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm">{e.summary}</div>
                  <div className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {e.actor_label ?? "—"} · {timeAgo(e.occurred_at)}
                  </div>
                </div>
                <span className="font-mono text-[10px] tracking-wider text-[var(--text-muted)] uppercase">
                  {e.kind}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
