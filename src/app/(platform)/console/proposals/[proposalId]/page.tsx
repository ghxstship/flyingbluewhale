import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { timeAgo } from "@/lib/format";
import { ProposalStatusControls } from "./ProposalStatusControls";

export const dynamic = "force-dynamic";

export default async function ProposalDetail({ params }: { params: Promise<{ proposalId: string }> }) {
  const { proposalId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const proposal = await getOrgScoped("proposals", session.orgId, proposalId);
  if (!proposal) notFound();

  return (
    <>
      <ModuleHeader
        eyebrow={`Proposal · ${proposal.doc_number ?? proposal.id.slice(0, 8)}`}
        title={proposal.title}
        subtitle={`${formatMoney(proposal.amount_cents ?? 0)} · v${proposal.version} · created ${timeAgo(proposal.created_at)}`}
        action={
          <div className="flex items-center gap-2">
            <Link href={`/console/proposals/${proposal.id}/edit`} className="btn btn-secondary btn-sm">Edit document</Link>
            <ProposalStatusControls id={proposal.id} status={proposal.status} />
          </div>
        }
      />
      <div className="page-content space-y-6">
        <div className="metric-grid">
          <Field label="Status"><StatusBadge status={proposal.status} /></Field>
          <Field label="Amount">{formatMoney(proposal.amount_cents ?? 0)}</Field>
          <Field label="Sent">{proposal.sent_at ? timeAgo(proposal.sent_at) : "—"}</Field>
          <Field label="Signed">{proposal.signed_at ? timeAgo(proposal.signed_at) : "—"}</Field>
        </div>
        {proposal.notes && (
          <div className="surface p-5">
            <h3 className="text-sm font-semibold">Scope</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text-secondary)]">{proposal.notes}</p>
          </div>
        )}
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="surface-raised p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{label}</div>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}
