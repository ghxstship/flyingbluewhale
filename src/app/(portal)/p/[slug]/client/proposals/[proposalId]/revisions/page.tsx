import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { resolveProposalContext, listRevisionRounds } from "@/lib/proposals/portal/queries";
import { REV_STATE_LABEL, REV_STATE_VARIANT } from "@/lib/proposals/portal/types";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string; proposalId: string }> }) {
  const { slug, proposalId } = await params;
  const ctx = await resolveProposalContext(slug, proposalId);
  if (!ctx) notFound();
  const rounds = await listRevisionRounds(proposalId);
  const base = `/p/${slug}/client/proposals/${proposalId}/revisions`;

  return (
    <div className="space-y-4 p-6">
      <header className="surface-raised flex items-end justify-between gap-4 p-5">
        <div>
          <div className="eyebrow text-xs text-[var(--text-muted)]">Revisions & proofing</div>
          <h1 className="text-lg font-semibold">Decide on Creative Deliverables</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--text-muted)]">
            Each round groups one or more proofs to review together. Approve, request changes, or reject.
          </p>
        </div>
        <Button href={`${base}/new`}>Open a Round</Button>
      </header>

      {rounds.length === 0 ? (
        <div className="surface-raised p-12 text-center text-[var(--text-muted)]">No revision rounds yet.</div>
      ) : (
        <ul className="space-y-3">
          {rounds.map((r) => (
            <li key={r.id}>
              <Link href={`${base}/${r.id}`} className="surface-raised hover-lift block p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[var(--text-muted)]">Round {r.round_num}</span>
                      <Badge variant={REV_STATE_VARIANT[r.state]}>{REV_STATE_LABEL[r.state]}</Badge>
                      <span className="font-mono text-[10px] tracking-wider text-[var(--text-muted)] uppercase">
                        {r.target_kind}
                      </span>
                    </div>
                    <h2 className="mt-1 text-base font-semibold">{r.title}</h2>
                    {r.summary && <p className="mt-1 line-clamp-2 text-sm text-[var(--text-muted)]">{r.summary}</p>}
                  </div>
                  <div className="shrink-0 text-right text-xs text-[var(--text-muted)]">
                    {r.decided_at ? `Decided ${timeAgo(r.decided_at)}` : `Opened ${timeAgo(r.created_at)}`}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
