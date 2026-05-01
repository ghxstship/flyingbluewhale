import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { resolveProposalContext, getRevisionRound } from "@/lib/proposals/portal/queries";
import { REV_STATE_LABEL, REV_STATE_VARIANT } from "@/lib/proposals/portal/types";
import { timeAgo } from "@/lib/format";
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

  const base = `/p/${slug}/client/proposals/${proposalId}/revisions`;
  const decidable = round.state === "open" || round.state === "client_review";

  return (
    <div className="space-y-4 p-6">
      <Link href={base} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">
        ← All revision rounds
      </Link>

      <header className="surface-raised p-6">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-[var(--text-muted)]">Round {round.round_num}</span>
          <Badge variant={REV_STATE_VARIANT[round.state]}>{REV_STATE_LABEL[round.state]}</Badge>
        </div>
        <h1 className="mt-2 text-xl font-semibold">{round.title}</h1>
        {round.summary && <p className="mt-2 text-sm text-[var(--text-muted)]">{round.summary}</p>}
        <div className="mt-3 text-xs text-[var(--text-muted)]">
          Opened {timeAgo(round.created_at)}
          {round.decided_at && ` · Decided ${timeAgo(round.decided_at)}`}
        </div>
      </header>

      <section className="surface-raised p-6">
        <div className="eyebrow mb-3 text-xs text-[var(--text-muted)]">Proofs in this round</div>
        {revisions.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No proofs uploaded yet.</p>
        ) : (
          <ol className="grid gap-3 md:grid-cols-3">
            {revisions.map((r) => (
              <li key={r.id} className="rounded border border-[var(--border-color)] bg-[var(--surface)] p-4">
                <div className="flex aspect-[4/3] items-center justify-center rounded bg-[var(--surface-inset)] text-xs text-[var(--text-muted)]">
                  {r.preview_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.preview_url} alt={r.label} className="h-full w-full rounded object-cover" />
                  ) : (
                    <span>Preview placeholder</span>
                  )}
                </div>
                <div className="mt-3 text-sm font-semibold">{r.label}</div>
                {r.note && <p className="mt-1 text-xs text-[var(--text-muted)]">{r.note}</p>}
              </li>
            ))}
          </ol>
        )}
      </section>

      {round.decision_note && (
        <section className="surface-raised p-6">
          <div className="eyebrow mb-2 text-xs text-[var(--text-muted)]">Decision note</div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{round.decision_note}</p>
        </section>
      )}

      {decidable && <RevisionDecision slug={slug} proposalId={proposalId} roundId={revisionId} />}
    </div>
  );
}
