import { notFound } from "next/navigation";
import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import type { Proposal, ProposalShareLink } from "@/lib/supabase/types";
import { ProposalEditor } from "./ProposalEditor";
import { ShareLinkPanel } from "./ShareLinkPanel";
import { SAMPLE_PROPOSAL_BLOCKS } from "./sample";

export const dynamic = "force-dynamic";

export default async function ProposalEditPage({ params }: { params: Promise<{ proposalId: string }> }) {
  const { proposalId } = await params;
  if (!hasSupabase) notFound();
  const session = await requireSession();
  const supabase = await createClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("*")
    .eq("org_id", session.orgId)
    .eq("id", proposalId)
    .maybeSingle();
  if (!proposal) notFound();

  const { data: links } = await supabase
    .from("proposal_share_links")
    .select("*")
    .eq("proposal_id", proposalId)
    .order("created_at", { ascending: false });

  const existingBlocks = (proposal.blocks ?? []) as unknown[];
  const blocks = existingBlocks.length > 0 ? existingBlocks : SAMPLE_PROPOSAL_BLOCKS;

  return (
    <>
      <ModuleHeader
        eyebrow="Proposal"
        title={`Edit · ${proposal.title}`}
        subtitle={`v${proposal.version} · ${proposal.status}`}
        action={
          <div className="flex items-center gap-2">
            <Link href={`/console/proposals/${proposalId}`} className="btn btn-ghost btn-sm">Back to detail</Link>
          </div>
        }
      />
      <div className="page-content max-w-6xl space-y-6">
        <ProposalEditor
          proposalId={proposalId}
          defaults={{
            title: proposal.title,
            doc_number: proposal.doc_number ?? "",
            currency: proposal.currency ?? "USD",
            deposit_percent: proposal.deposit_percent ?? 25,
            theme: proposal.theme as { primary: string; secondary: string } ?? { primary: "#D4782A", secondary: "#6D4A2A" },
            blocks,
          }}
        />

        <section className="surface-raised">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] p-5">
            <div>
              <div className="text-sm font-semibold">Share links</div>
              <div className="text-xs text-[var(--text-muted)]">Signed URLs clients use to view and sign this proposal.</div>
            </div>
          </div>
          <div className="p-5">
            <ShareLinkPanel proposalId={proposalId} />
            {links && links.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {(links as ProposalShareLink[]).map((l) => {
                  const url = `/proposals/${l.token}`;
                  const revoked = !!l.revoked_at;
                  return (
                    <li key={l.id} className="surface-inset flex flex-wrap items-center justify-between gap-2 p-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {revoked ? <Badge variant="muted">Revoked</Badge> : <Badge variant="success">Active</Badge>}
                          {l.audience && <Badge variant="brand">{l.audience}</Badge>}
                          <span className="text-xs text-[var(--text-muted)]">· {l.view_count} views</span>
                          {l.last_viewed_at && <span className="text-xs text-[var(--text-muted)]">· last seen {timeAgo(l.last_viewed_at)}</span>}
                        </div>
                        <a href={url} target="_blank" rel="noreferrer" className="mt-1 block break-all font-mono text-xs text-[var(--org-primary)]">
                          {url}
                        </a>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-[var(--text-muted)]">No share links yet — generate one to send the proposal to a client.</p>
            )}
          </div>
        </section>

        <ProposalPreviewLink proposal={proposal as Proposal} />
      </div>
    </>
  );
}

function ProposalPreviewLink({ proposal }: { proposal: Proposal }) {
  return (
    <div className="surface p-4 text-xs text-[var(--text-muted)]">
      Tip · Save, then open a share link to view the fully rendered proposal (including scroll-spy nav, phase accordions, and signature capture).
      <span className="ml-2 font-mono">{proposal.id.slice(0, 8)}</span>
    </div>
  );
}
