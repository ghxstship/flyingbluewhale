import { notFound } from "next/navigation";
import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { timeAgo, toTitle } from "@/lib/format";
import type { Proposal, ProposalShareLink } from "@/lib/supabase/types";
import { mintProposalShareUrlToken } from "@/lib/proposals/share";
import { getRequestT } from "@/lib/i18n/request";
import { BRAND_FALLBACK } from "@/lib/branding";
import { resolveDepositPct, PROPOSAL_DEPOSIT_PCT_DEFAULT } from "@/lib/payment-terms";
import { getOrgPaymentDefaults } from "@/lib/payment-terms-server";
import { ProposalEditor } from "./ProposalEditor";
import { ShareLinkPanel } from "./ShareLinkPanel";
import { SAMPLE_PROPOSAL_BLOCKS } from "./sample";

export const dynamic = "force-dynamic";

export default async function ProposalEditPage({ params }: { params: Promise<{ proposalId: string }> }) {
  const { proposalId } = await params;
  if (!hasSupabase) notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("*")
    .eq("org_id", session.orgId)
    .eq("id", proposalId)
    .maybeSingle();
  if (!proposal) notFound();

  // Canonical deposit %: per-instance → org template → system default (50).
  const orgPaymentDefaults = await getOrgPaymentDefaults(supabase, session.orgId);

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
        eyebrow={t("console.proposals.edit.eyebrow", undefined, "Proposal")}
        title={t("console.proposals.edit.title", { title: proposal.title }, `Edit · ${proposal.title}`)}
        subtitle={`v${proposal.version} · ${proposal.proposal_state}`}
        action={
          <div className="flex items-center gap-2">
            <Link href={`/studio/proposals/${proposalId}`} className="ps-btn ps-btn--ghost ps-btn--sm">
              {t("console.proposals.edit.backToDetail", undefined, "Back to detail")}
            </Link>
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
            deposit_percent: resolveDepositPct(
              proposal.deposit_percent,
              orgPaymentDefaults.depositPct,
              PROPOSAL_DEPOSIT_PCT_DEFAULT,
            ),
            theme: (proposal.theme as { primary: string; secondary: string }) ?? {
              primary: BRAND_FALLBACK.accent,
              secondary: BRAND_FALLBACK.secondary,
            },
            blocks,
          }}
        />

        <section className="surface">
          <div className="flex items-center justify-between border-b border-[var(--p-border)] p-5">
            <div>
              <div className="text-sm font-semibold">
                {t("console.proposals.edit.shareLinks", undefined, "Share links")}
              </div>
              <div className="text-xs text-[var(--p-text-2)]">
                {t(
                  "console.proposals.edit.shareLinksDescription",
                  undefined,
                  "Signed URLs clients use to view and sign this proposal.",
                )}
              </div>
            </div>
          </div>
          <div className="p-5">
            <ShareLinkPanel proposalId={proposalId} />
            {links && links.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {(links as ProposalShareLink[]).map((l) => {
                  // Always render the HMAC-signed URL for active links so
                  // operators copying from this panel hand out the secure
                  // form, not the legacy raw token. The resolver still
                  // accepts the raw token for outstanding emailed links.
                  // SHARE_LINK_SECRET env may be absent in some envs; guard.
                  const urlToken = process.env.SHARE_LINK_SECRET
                    ? mintProposalShareUrlToken({
                        linkId: l.id,
                        expiresAt: l.expires_at ? new Date(l.expires_at) : null,
                      })
                    : l.token;
                  const url = `/proposals/${urlToken}`;
                  const revoked = !!l.revoked_at;
                  return (
                    <li key={l.id} className="surface-inset flex flex-wrap items-center justify-between gap-2 p-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {revoked ? (
                            <Badge variant="muted">{t("console.proposals.edit.revoked", undefined, "Revoked")}</Badge>
                          ) : (
                            <Badge variant="success">{t("console.proposals.edit.active", undefined, "Active")}</Badge>
                          )}
                          {l.audience && <Badge variant="brand">{toTitle(l.audience)}</Badge>}
                          <span className="text-xs text-[var(--p-text-2)]">
                            · {t("console.proposals.edit.viewsCount", { count: l.view_count }, `${l.view_count} views`)}
                          </span>
                          {l.last_viewed_at && (
                            <span className="text-xs text-[var(--p-text-2)]">
                              ·{" "}
                              {t(
                                "console.proposals.edit.lastSeen",
                                { time: timeAgo(l.last_viewed_at) },
                                `last seen ${timeAgo(l.last_viewed_at)}`,
                              )}
                            </span>
                          )}
                        </div>
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 block font-mono text-xs break-all text-[var(--p-accent)]"
                        >
                          {url}
                        </a>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-[var(--p-text-2)]">
                {t(
                  "console.proposals.edit.noShareLinks",
                  undefined,
                  "No share links yet. Generate one to send the proposal to a client.",
                )}
              </p>
            )}
          </div>
        </section>

        <ProposalPreviewLink
          proposal={proposal as unknown as Proposal}
          tip={t(
            "console.proposals.edit.previewTip",
            undefined,
            "Tip · Save, then open a share link to view the fully rendered proposal (including scroll-spy nav, phase accordions, and signature capture).",
          )}
        />
      </div>
    </>
  );
}

function ProposalPreviewLink({ proposal, tip }: { proposal: Proposal; tip: string }) {
  return (
    <div className="surface p-4 text-xs text-[var(--p-text-2)]">
      {tip}
      <span className="ms-2 font-mono">{proposal.id.slice(0, 8)}</span>
    </div>
  );
}
