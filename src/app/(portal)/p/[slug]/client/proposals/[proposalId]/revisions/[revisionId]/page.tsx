import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { resolveProposalContext, getRevisionRound } from "@/lib/proposals/portal/queries";
import { REV_STATE_LABEL, REV_STATE_VARIANT } from "@/lib/proposals/portal/types";
import { timeAgo } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { RevisionDecision } from "./RevisionDecision";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; proposalId: string; revisionId: string }>;
}) {
  const { slug, proposalId, revisionId } = await params;
  const ctx = await resolveProposalContext(slug, proposalId);
  if (!ctx) notFound();
  const data = await getRevisionRound(revisionId);
  if (!data || data.round.proposal_id !== proposalId) notFound();
  const { round, revisions } = data;
  const { t } = await getRequestT();

  const base = `/p/${slug}/client/proposals/${proposalId}/revisions`;
  const decidable = round.state === "open" || round.state === "client_review";

  return (
    <div className="space-y-4 p-6">
      <Link href={base} className="text-xs text-[var(--p-text-2)] hover:text-[var(--p-text-1)]">
        {t("p.client.revisions.backToList", undefined, "← All revision rounds")}
      </Link>

      <header className="surface p-6">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-[var(--p-text-2)]">
            {t("p.client.revisions.round", { num: round.round_num }, `Round ${round.round_num}`)}
          </span>
          <Badge variant={REV_STATE_VARIANT[round.state]}>{REV_STATE_LABEL[round.state]}</Badge>
        </div>
        <h1 className="mt-2">{round.title}</h1>
        {round.summary && <p className="mt-2 text-sm text-[var(--p-text-2)]">{round.summary}</p>}
        <div className="mt-3 text-xs text-[var(--p-text-2)]">
          {t("p.client.revisions.opened", { when: timeAgo(round.created_at) }, `Opened ${timeAgo(round.created_at)}`)}
          {round.decided_at &&
            ` ${t("p.client.revisions.decidedSuffix", { when: timeAgo(round.decided_at) }, `· Decided ${timeAgo(round.decided_at)}`)}`}
        </div>
      </header>

      <section className="surface p-6">
        <div className="eyebrow mb-3 text-xs text-[var(--p-text-2)]">
          {t("p.client.revisions.proofsHeader", undefined, "Proofs in this round")}
        </div>
        {revisions.length === 0 ? (
          <p className="text-sm text-[var(--p-text-2)]">
            {t("p.client.revisions.noProofs", undefined, "No proofs uploaded yet.")}
          </p>
        ) : (
          <ol className="grid gap-3 md:grid-cols-3">
            {revisions.map((r) => (
              <li key={r.id} className="rounded border border-[var(--p-border)] bg-[var(--p-surface)] p-4">
                <div className="flex aspect-[4/3] items-center justify-center rounded bg-[var(--p-surface-2)] text-xs text-[var(--p-text-2)]">
                  {r.preview_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.preview_url} alt={r.label} className="h-full w-full rounded object-cover" />
                  ) : (
                    <span>{t("p.client.revisions.previewPlaceholder", undefined, "Preview placeholder")}</span>
                  )}
                </div>
                <div className="mt-3 text-sm font-semibold">{r.label}</div>
                {r.note && <p className="mt-1 text-xs text-[var(--p-text-2)]">{r.note}</p>}
              </li>
            ))}
          </ol>
        )}
      </section>

      {round.decision_note && (
        <section className="surface p-6">
          <div className="eyebrow mb-2 text-xs text-[var(--p-text-2)]">
            {t("p.client.revisions.decisionNote", undefined, "Decision note")}
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{round.decision_note}</p>
        </section>
      )}

      {decidable && <RevisionDecision slug={slug} proposalId={proposalId} roundId={revisionId} />}
    </div>
  );
}
