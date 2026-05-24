import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { resolveProposalContext, listApprovals } from "@/lib/proposals/portal/queries";
import { APPROVAL_STATE_LABEL, APPROVAL_STATE_VARIANT } from "@/lib/proposals/portal/types";
import { timeAgo } from "@/lib/format";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string; proposalId: string }> }) {
  const { slug, proposalId } = await params;
  const ctx = await resolveProposalContext(slug, proposalId);
  if (!ctx) notFound();
  const approvals = await listApprovals(proposalId);
  const base = `/p/${slug}/client/proposals/${proposalId}/approvals`;

  return (
    <div className="space-y-4 p-6">
      <header className="surface p-5">
        <div className="eyebrow text-xs text-[var(--text-muted)]">Approvals</div>
        <h1 className="text-lg font-semibold">Signatures, sign-offs, and decisions</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--text-muted)]">
          Phase gate sign-offs, SOW counter-signatures, and any other binding approvals on this proposal.
        </p>
      </header>

      {approvals.length === 0 ? (
        <div className="surface p-12 text-center text-[var(--text-muted)]">No approvals on file.</div>
      ) : (
        <ul className="space-y-3">
          {approvals.map((a) => (
            <li key={a.id}>
              <Link href={`${base}/${a.id}`} className="surface hover-lift block p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] tracking-wider text-[var(--text-muted)] uppercase">
                        {toTitle(a.kind)}
                      </span>
                      <Badge variant={APPROVAL_STATE_VARIANT[a.state]}>{APPROVAL_STATE_LABEL[a.state]}</Badge>
                    </div>
                    <h2 className="mt-1 text-base font-semibold">{a.title}</h2>
                    {a.body && <p className="mt-1 line-clamp-2 text-sm text-[var(--text-muted)]">{a.body}</p>}
                  </div>
                  <div className="shrink-0 text-right text-xs text-[var(--text-muted)]">
                    {a.signed_at
                      ? `Signed ${timeAgo(a.signed_at)} by ${a.signed_label ?? "—"}`
                      : a.due_at
                        ? `Due ${timeAgo(a.due_at)}`
                        : `Opened ${timeAgo(a.created_at)}`}
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
