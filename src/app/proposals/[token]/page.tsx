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
      <footer className="mx-auto max-w-4xl border-t border-[var(--border-color)] px-8 py-12 text-center text-xs text-[var(--text-muted)]">
        Prepared by ATLVS Technologies · {proposal.doc_number ?? proposal.id.slice(0, 8)} · v{proposal.version}
      </footer>
    </div>
  );
}
