import Link from "next/link";
import { notFound } from "next/navigation";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";
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
  const { t } = await getRequestT();
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
        <MetricCard
          label={t("p.client.proposals.detail.metrics.lifecycleProgress", undefined, "Lifecycle Progress")}
          value={`${summary.completedPhases} / ${summary.totalPhases}`}
          accent
        />
        <MetricCard
          label={t("p.client.proposals.detail.metrics.activePhase", undefined, "Active Phase")}
          value={
            summary.activePhase
              ? `${String(summary.activePhase.phase_num).padStart(2, "0")} ${summary.activePhase.phase_name}`
              : "—"
          }
        />
        <MetricCard
          label={t("p.client.proposals.detail.metrics.pendingApprovals", undefined, "Pending Approvals")}
          value={summary.pendingApprovals}
        />
        <MetricCard
          label={t("p.client.proposals.detail.metrics.totalContracted", undefined, "Total Contracted")}
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
            <div className="eyebrow text-xs text-[var(--p-text-2)]">
              {t("p.client.proposals.detail.lifecycle.eyebrow", undefined, "Lifecycle")}
            </div>
            <h2 className="text-lg font-semibold">
              {t("p.client.proposals.detail.lifecycle.title", undefined, "8-phase production progress")}
            </h2>
          </div>
          <Button href={`${base}/lifecycle`} variant="secondary" size="sm">
            {t("p.client.proposals.detail.lifecycle.viewAction", undefined, "View lifecycle →")}
          </Button>
        </div>
        <ProgressBar
          value={phasePct}
          showLabel
          aria-label={t("p.client.proposals.detail.lifecycle.progressAria", undefined, "Lifecycle progress")}
        />
        <ol className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {phases.map((p) => (
            <li key={p.id} className="rounded border border-[var(--p-border)] bg-[var(--p-surface)] p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[var(--p-text-2)]">{String(p.phase_num).padStart(2, "0")}</span>
                <Badge
                  variant={
                    PHASE_STATUS_TONE[p.phase_state] === "muted"
                      ? "muted"
                      : PHASE_STATUS_TONE[p.phase_state] === "info"
                        ? "info"
                        : PHASE_STATUS_TONE[p.phase_state] === "warning"
                          ? "warning"
                          : "success"
                  }
                >
                  {PHASE_STATUS_LABEL[p.phase_state]}
                </Badge>
              </div>
              <div className="mt-1 text-sm leading-tight font-medium">{p.phase_name}</div>
              <div className="mt-1 text-xs text-[var(--p-text-2)]">
                {t(
                  "p.client.proposals.detail.lifecycle.gatesCount",
                  { done: p.gateItems.filter((g) => g.is_done).length, total: p.gateItems.length },
                  `${p.gateItems.filter((g) => g.is_done).length}/${p.gateItems.length} gates`,
                )}
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
            <h3 className="text-sm font-semibold">
              {t("p.client.proposals.detail.approvals.title", undefined, "Approvals")}
            </h3>
            <Link href={`${base}/approvals`} className="text-xs text-[var(--p-text-2)] hover:text-[var(--p-text-1)]">
              {t("p.client.proposals.detail.approvals.allLink", undefined, "All →")}
            </Link>
          </header>
          {approvals.length === 0 ? (
            <p className="text-sm text-[var(--p-text-2)]">
              {t("p.client.proposals.detail.approvals.empty", undefined, "No approvals pending.")}
            </p>
          ) : (
            <ul className="space-y-2">
              {approvals.slice(0, 4).map((a) => (
                <li key={a.id}>
                  <Link
                    href={`${base}/approvals/${a.id}`}
                    className="hover-lift block rounded border border-[var(--p-border)] p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="line-clamp-1 text-sm font-medium">{a.title}</span>
                      <Badge variant={APPROVAL_STATE_VARIANT[a.state]}>{APPROVAL_STATE_LABEL[a.state]}</Badge>
                    </div>
                    {a.due_at && (
                      <div className="mt-1 text-xs text-[var(--p-text-2)]">
                        {t(
                          "p.client.proposals.detail.approvals.due",
                          { when: timeAgo(a.due_at) },
                          `Due ${timeAgo(a.due_at)}`,
                        )}
                      </div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Open change orders */}
        <section className="surface p-5">
          <header className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              {t("p.client.proposals.detail.changeOrders.title", undefined, "Change Orders")}
            </h3>
            <Link
              href={`${base}/change-orders`}
              className="text-xs text-[var(--p-text-2)] hover:text-[var(--p-text-1)]"
            >
              {t("p.client.proposals.detail.changeOrders.allLink", undefined, "All →")}
            </Link>
          </header>
          {changeOrders.length === 0 ? (
            <p className="text-sm text-[var(--p-text-2)]">
              {t("p.client.proposals.detail.changeOrders.empty", undefined, "No change orders.")}
            </p>
          ) : (
            <ul className="space-y-2">
              {changeOrders.slice(0, 4).map((co) => (
                <li key={co.id}>
                  <Link
                    href={`${base}/change-orders/${co.id}`}
                    className="hover-lift block rounded border border-[var(--p-border)] p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="line-clamp-1 text-sm font-medium">
                        #{co.number} · {co.title}
                      </span>
                      <Badge variant={CO_STATE_VARIANT[co.state]}>{CO_STATE_LABEL[co.state]}</Badge>
                    </div>
                    <div className="mt-1 font-mono text-xs text-[var(--p-text-2)]">
                      {t(
                        "p.client.proposals.detail.changeOrders.delta",
                        { amount: formatMoney(co.delta_cents ?? 0) },
                        `Δ ${formatMoney(co.delta_cents ?? 0)}`,
                      )}
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
            <h3 className="text-sm font-semibold">
              {t("p.client.proposals.detail.revisions.title", undefined, "Revisions")}
            </h3>
            <Link href={`${base}/revisions`} className="text-xs text-[var(--p-text-2)] hover:text-[var(--p-text-1)]">
              {t("p.client.proposals.detail.revisions.allLink", undefined, "All →")}
            </Link>
          </header>
          {rounds.length === 0 ? (
            <p className="text-sm text-[var(--p-text-2)]">
              {t("p.client.proposals.detail.revisions.empty", undefined, "No revision rounds.")}
            </p>
          ) : (
            <ul className="space-y-2">
              {rounds.slice(0, 4).map((r) => (
                <li key={r.id}>
                  <Link
                    href={`${base}/revisions/${r.id}`}
                    className="hover-lift block rounded border border-[var(--p-border)] p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="line-clamp-1 text-sm font-medium">
                        {t(
                          "p.client.proposals.detail.revisions.roundLabel",
                          { round: r.round_num, title: r.title },
                          `Round ${r.round_num} · ${r.title}`,
                        )}
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
          <h3 className="text-sm font-semibold">
            {t("p.client.proposals.detail.activity.title", undefined, "Recent Activity")}
          </h3>
          <Link href={`${base}/activity`} className="text-xs text-[var(--p-text-2)] hover:text-[var(--p-text-1)]">
            {t("p.client.proposals.detail.activity.allLink", undefined, "All →")}
          </Link>
        </header>
        {activity.length === 0 ? (
          <p className="text-sm text-[var(--p-text-2)]">
            {t("p.client.proposals.detail.activity.empty", undefined, "No activity yet.")}
          </p>
        ) : (
          <ul className="space-y-2">
            {activity.map((e) => (
              <li
                key={e.id}
                className="flex items-start gap-3 rounded border border-[var(--p-border)] bg-[var(--p-surface)] p-3"
              >
                <span
                  className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full bg-[var(--p-accent)]"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm">{e.summary}</div>
                  <div className="mt-0.5 text-xs text-[var(--p-text-2)]">
                    {e.actor_label ?? "—"} · {timeAgo(e.occurred_at)}
                  </div>
                </div>
                <span className="eyebrow">{e.kind}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
