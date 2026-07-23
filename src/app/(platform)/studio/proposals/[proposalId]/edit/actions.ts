"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { validateBlocks } from "@/lib/proposals/validate";
import { emitAudit } from "@/lib/audit";
import { urlFor } from "@/lib/urls";
import { actionFail, formFail } from "@/lib/forms/fail";
import { BRAND_FALLBACK } from "@/lib/branding";
import { resolveDepositPct, PROPOSAL_DEPOSIT_PCT_DEFAULT } from "@/lib/payment-terms";
import { getOrgPaymentDefaults } from "@/lib/payment-terms-server";
import { actionErrorMessage } from "@/lib/errors";

const UpdateSchema = z.object({
  title: z.string().min(1).max(200),
  doc_number: z.string().max(40).optional().or(z.literal("")),
  deposit_percent: z.string().optional(),
  currency: z.string().min(3).max(3).optional(),
  theme_primary: z.string().optional(),
  theme_secondary: z.string().optional(),
  blocks: z.string(),
});

export type EditState = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function saveProposalAction(proposalId: string, _: EditState, fd: FormData): Promise<EditState> {
  const session = await requireSession();
  const parsed = UpdateSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  let parsedBlocks: unknown;
  try {
    parsedBlocks = JSON.parse(parsed.data.blocks || "[]");
  } catch {
    return { error: actionErrorMessage("blocks-json-is-invalid", "Blocks JSON is invalid") };
  }
  // Boundary validation. The TS union in src/lib/proposals/types.ts is
  // the source of truth; the zod schema mirrors it so a single
  // malformed block is rejected at save time rather than discovered
  // mid-convert when the seeder iterates the array.
  const validation = validateBlocks(parsedBlocks);
  if (!validation.ok) return { error: `Block validation failed: ${validation.error}` };
  const blocks = validation.blocks as unknown as import("@/lib/supabase/database.types").Json;

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("proposals")
    .select("version,blocks,theme")
    .eq("org_id", session.orgId)
    .eq("id", proposalId)
    .maybeSingle();
  if (!current) return { error: actionErrorMessage("not-found.generic", "Not found") };
  const currentVersion = current.version ?? 1;

  // Resolve the deposit % through the canonical payment-terms seam
  // (per-instance → org template → system default 50). No literal here.
  const orgDefaults = await getOrgPaymentDefaults(supabase, session.orgId);
  const depositPct = resolveDepositPct(
    parsed.data.deposit_percent ? parseInt(parsed.data.deposit_percent, 10) : null,
    orgDefaults.depositPct,
    PROPOSAL_DEPOSIT_PCT_DEFAULT,
  );

  // Conditional update on observed version — without it two concurrent
  // saves both read v5, both write v6, and one operator's blocks
  // silently clobber the other. With it, only the racer that observed
  // v5 lands; the loser sees a stale-row error and reloads.
  const { data: updated, error } = await supabase
    .from("proposals")
    .update({
      title: parsed.data.title,
      doc_number: parsed.data.doc_number || null,
      currency: parsed.data.currency?.toUpperCase() || "USD",
      deposit_percent: depositPct,
      theme: {
        primary: parsed.data.theme_primary || BRAND_FALLBACK.accent,
        secondary: parsed.data.theme_secondary || BRAND_FALLBACK.secondary,
      },
      blocks,
      version: currentVersion + 1,
    })
    .eq("org_id", session.orgId)
    .eq("id", proposalId)
    .eq("version", currentVersion)
    .select("id");
  if (error) return actionFail(error.message, fd);
  if (!updated || updated.length === 0) {
    return {
      error:
        "Someone else saved this proposal while you were editing. Reload to see their changes, then re-apply yours.",
    };
  }

  // Snapshot the previous version AFTER the conditional update lands.
  // If we'd snapshotted first and the update was rejected as stale,
  // we'd leave a duplicate version row pointing at the same blocks.
  const { error: insertError } = await supabase.from("proposal_versions").insert({
    proposal_id: proposalId,
    version: currentVersion,
    blocks: current.blocks,
    theme: current.theme,
    changed_by: session.userId,
  });
  if (insertError) return actionFail(insertError.message, fd);

  revalidatePath(`/studio/proposals/${proposalId}/edit`);
  revalidatePath(`/studio/proposals/${proposalId}`);
  return { ok: true };
}

export async function createShareLinkAction(
  proposalId: string,
  audience: string | null,
  recipientEmail?: string | null,
) {
  const session = await requireSession();
  const supabase = await createClient();
  // The DB still requires a non-null `token` (it's the legacy lookup column
  // for outstanding links minted before migration 0064). Keep a random
  // value there for back-compat reads, but the URL token we hand out is
  // HMAC-signed via `mintProposalShareUrlToken` so the row id + expiry
  // + nonce travel under a signature instead of just being raw entropy.
  const legacyDbToken = Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);

  const { data, error } = await supabase
    .from("proposal_share_links")
    .insert({
      proposal_id: proposalId,
      token: legacyDbToken,
      audience,
      created_by: session.userId,
      expires_at: expires.toISOString(),
    })
    .select()
    .single();
  if (error) return { error: error.message };

  const { mintProposalShareUrlToken } = await import("@/lib/proposals/share");
  const urlToken = mintProposalShareUrlToken({ linkId: data.id, expiresAt: expires });
  const url = urlFor("marketing", `/proposals/${urlToken}`);

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "auth.proposal_share.created",
    targetTable: "proposal_share_links",
    targetId: data.id,
    metadata: { proposal_id: proposalId, audience, expires_at: data.expires_at, sent_to: recipientEmail ?? null },
  });

  if (recipientEmail) {
    const { sendProposalShareEmail } = await import("@/lib/email");
    const { resolveBrandContext } = await import("@/lib/branding");
    const [{ data: p }, { data: org }] = await Promise.all([
      supabase.from("proposals").select("title").eq("id", proposalId).maybeSingle(),
      supabase.from("orgs").select("name, name_override, branding, logo_url").eq("id", session.orgId).maybeSingle(),
    ]);
    const ctx = resolveBrandContext({ org: org ?? { name: null, branding: {} } });
    await sendProposalShareEmail({
      to: recipientEmail,
      proposalTitle: p?.title ?? "Proposal",
      url,
      senderName: session.email,
      brand: { producerName: ctx.producer.name, producerLogoUrl: ctx.producer.logoUrl, accent: ctx.joint.accent },
      orgId: session.orgId,
    });
  }

  revalidatePath(`/studio/proposals/${proposalId}/edit`);
  return { ok: { token: urlToken, url: `/proposals/${urlToken}`, expires: data.expires_at } };
}

export async function revokeShareLinkAction(linkId: string, proposalId: string) {
  // Authorization: scope to the caller's org via the proposal_id linkage,
  // not just the linkId. Without the org check, anyone with a valid
  // share-link uuid (which leaks via the public /proposals/[token] page
  // events) could revoke any other tenant's share link.
  const session = await requireSession();
  const supabase = await createClient();
  const { data: link } = await supabase
    .from("proposal_share_links")
    .select("id, proposal_id, proposals!inner(org_id)")
    .eq("id", linkId)
    .eq("proposal_id", proposalId)
    .maybeSingle();
  const ownerOrgId = (link as unknown as { proposals?: { org_id?: string } } | null)?.proposals?.org_id;
  if (!link || ownerOrgId !== session.orgId) return { error: actionErrorMessage("not-found.share-link", "Share link not found") };

  const { data: revoked, error } = await supabase
    .from("proposal_share_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", linkId)
    .is("revoked_at", null)
    .select("id")
    .maybeSingle();
  if (error) return { error: error.message };
  if (revoked) {
    await emitAudit({
      actorId: session.userId,
      orgId: session.orgId,
      actorEmail: session.email,
      action: "auth.proposal_share.revoked",
      targetTable: "proposal_share_links",
      targetId: linkId,
      metadata: { proposal_id: proposalId },
    });
  }
  revalidatePath(`/studio/proposals/${proposalId}/edit`);
  return { ok: true as const };
}
