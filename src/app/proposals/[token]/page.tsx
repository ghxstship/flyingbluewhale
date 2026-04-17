import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { ProposalBlockRenderer } from "@/components/proposals/ProposalBlockRenderer";
import { SignatureBlock } from "./SignatureBlock";
import { ProposalTopBar } from "./ProposalTopBar";
import type { ProposalBlock } from "@/lib/proposals/types";
import type { Proposal } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

async function recordView(proposalId: string, token: string) {
  const supabase = await createClient();
  await supabase.from("proposal_events").insert({ proposal_id: proposalId, share_token: token, event_type: "viewed" });
  await supabase.rpc;
  // best-effort: bump view count
  const { data: existing } = await supabase
    .from("proposal_share_links")
    .select("view_count")
    .eq("token", token)
    .maybeSingle();
  const next = (existing?.view_count ?? 0) + 1;
  await supabase.from("proposal_share_links").update({
    view_count: next,
    last_viewed_at: new Date().toISOString(),
  }).eq("token", token);
}

export default async function PublicProposalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!hasSupabase) notFound();
  const supabase = await createClient();

  const { data: link } = await supabase
    .from("proposal_share_links")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  if (!link || link.revoked_at || (link.expires_at && new Date(link.expires_at) < new Date())) notFound();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", link.proposal_id)
    .maybeSingle();
  if (!proposal) notFound();

  recordView(proposal.id, token).catch(() => {});

  const blocks = (proposal.blocks ?? []) as ProposalBlock[];
  const theme = (proposal.theme as { primary: string; secondary: string }) ?? { primary: "#D4782A", secondary: "#6D4A2A" };
  const signatureBlock = blocks.find((b) => b.type === "signature_block") as Extract<ProposalBlock, { type: "signature_block" }> | undefined;

  return (
    <div className="proposal-doc bg-[var(--background)] text-[var(--foreground)]" data-theme="light">
      <ProposalTopBar proposal={proposal as Proposal} blocks={blocks} />
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
        Prepared by flyingbluewhale · {proposal.doc_number ?? proposal.id.slice(0, 8)} · v{proposal.version}
      </footer>
    </div>
  );
}
