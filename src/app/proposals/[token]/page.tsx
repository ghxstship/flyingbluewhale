import { notFound } from "next/navigation";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { ProposalBlockRenderer } from "@/components/proposals/ProposalBlockRenderer";
import { SignatureBlock } from "./SignatureBlock";
import { ProposalTopBar } from "./ProposalTopBar";
import type { ProposalBlock } from "@/lib/proposals/types";
import type { Proposal } from "@/lib/supabase/types";
import { resolveProposalShareLink } from "@/lib/proposals/share";

export const dynamic = "force-dynamic";

export default async function PublicProposalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!hasSupabase) notFound();
  if (!isServiceClientAvailable()) notFound();

  // HMAC-verify the token + atomic-consume the share-link row in one call.
  // Falls back to a legacy plain-text token lookup for outstanding links
  // minted before migration 0064 (those are rate-limited at the upstream
  // action layer; for the read-only page view we don't have a per-action
  // limiter, but the page view itself doesn't change any secret state).
  const resolved = await resolveProposalShareLink({ token, allowLegacyTokenFallback: true });
  if (!resolved.ok) notFound();

  // Reads use the service-role too — the public viewer has no Supabase
  // session and proposals RLS gates on `is_org_member`. The share-link
  // resolution above is the authorization for this proposal_id; service-
  // role reads it past RLS.
  const svc = createServiceClient();
  const { data: proposal } = await svc.from("proposals").select("*").eq("id", resolved.link.proposal_id).maybeSingle();
  if (!proposal) notFound();

  // Best-effort view event. The consume RPC already bumped view_count
  // atomically; this gives the proposal_events timeline a row for
  // analytics. Wrap in a no-throw so any insert failure can't 500 the
  // public page.
  void svc.from("proposal_events").insert({
    proposal_id: resolved.link.proposal_id,
    share_token: token,
    event_type: "viewed",
  });

  const blocks = (proposal.blocks ?? []) as ProposalBlock[];
  const theme = (proposal.theme as { primary: string; secondary: string }) ?? {
    primary: "#D4782A",
    secondary: "#6D4A2A",
  };
  const signatureBlock = blocks.find((b) => b.type === "signature_block") as
    | Extract<ProposalBlock, { type: "signature_block" }>
    | undefined;

  return (
    <div className="proposal-doc bg-[var(--background)] text-[var(--foreground)]" data-theme="light">
      <ProposalTopBar proposal={proposal as unknown as Proposal} blocks={blocks} />
      <main>
        <ProposalBlockRenderer blocks={blocks} theme={theme} currency={proposal.currency ?? "USD"} />
        {signatureBlock && (
          <SignatureBlock
            proposalId={proposal.id}
            token={token}
            parties={signatureBlock.parties}
            instructions={signatureBlock.instructions}
            alreadySigned={!!proposal.signed_at}
            signerName={proposal.signer_name}
            signedAt={proposal.signed_at}
          />
        )}
      </main>
      {/* Document endorsement footer — v4 logo-kit canon for formal
          client-facing PDFs. Waypoint mark + spaced "A T L V S" wordmark
          on the left, GHXSTSHIP skull + parent attribution on the right,
          doc number + version inline. */}
      <footer className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 border-t border-[var(--border-color)] px-8 py-10 text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/atlvs-mark.svg" alt="" width={18} height={18} aria-hidden="true" />
          <span className="font-semibold tracking-[0.18em] text-[var(--text-secondary)] uppercase">A T L V S</span>
          <span>· Technologies</span>
        </div>
        <div className="font-mono">
          {proposal.doc_number ?? proposal.id.slice(0, 8)} · v{proposal.version}
        </div>
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-ghostship-skull.svg" alt="" width={14} height={14} aria-hidden="true" />
          <span className="tracking-[0.14em] uppercase">a G H X S T S H I P Industries company</span>
        </div>
      </footer>
    </div>
  );
}
