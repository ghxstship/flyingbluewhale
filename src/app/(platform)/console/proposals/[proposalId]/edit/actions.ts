"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { urlFor } from "@/lib/urls";

const UpdateSchema = z.object({
  title: z.string().min(1).max(200),
  doc_number: z.string().max(40).optional().or(z.literal("")),
  deposit_percent: z.string().optional(),
  currency: z.string().min(3).max(3).optional(),
  theme_primary: z.string().optional(),
  theme_secondary: z.string().optional(),
  blocks: z.string(),
});

export type EditState = { error?: string; ok?: true } | null;

export async function saveProposalAction(proposalId: string, _: EditState, fd: FormData): Promise<EditState> {
  const session = await requireSession();
  const parsed = UpdateSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  let blocks: import("@/lib/supabase/database.types").Json;
  try {
    blocks = JSON.parse(parsed.data.blocks || "[]") as import("@/lib/supabase/database.types").Json;
  } catch {
    return { error: "Blocks JSON is invalid" };
  }

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("proposals")
    .select("version,blocks,theme")
    .eq("org_id", session.orgId)
    .eq("id", proposalId)
    .maybeSingle();
  if (!current) return { error: "Not found" };
  const currentVersion = current.version ?? 1;

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
      deposit_percent: parsed.data.deposit_percent ? parseInt(parsed.data.deposit_percent, 10) : 25,
      theme: { primary: parsed.data.theme_primary || "#D4782A", secondary: parsed.data.theme_secondary || "#6D4A2A" },
      blocks,
      version: currentVersion + 1,
    })
    .eq("org_id", session.orgId)
    .eq("id", proposalId)
    .eq("version", currentVersion)
    .select("id");
  if (error) return { error: error.message };
  if (!updated || updated.length === 0) {
    return {
      error:
        "Someone else saved this proposal while you were editing. Reload to see their changes, then re-apply yours.",
    };
  }

  // Snapshot the previous version AFTER the conditional update lands.
  // If we'd snapshotted first and the update was rejected as stale,
  // we'd leave a duplicate version row pointing at the same blocks.
  await supabase.from("proposal_versions").insert({
    proposal_id: proposalId,
    version: currentVersion,
    blocks: current.blocks,
    theme: current.theme,
    changed_by: session.userId,
  });

  revalidatePath(`/console/proposals/${proposalId}/edit`);
  revalidatePath(`/console/proposals/${proposalId}`);
  return { ok: true };
}

export async function createShareLinkAction(
  proposalId: string,
  audience: string | null,
  recipientEmail?: string | null,
) {
  const session = await requireSession();
  const supabase = await createClient();
  const token = Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);

  const { data, error } = await supabase
    .from("proposal_share_links")
    .insert({
      proposal_id: proposalId,
      token,
      audience,
      created_by: session.userId,
      expires_at: expires.toISOString(),
    })
    .select()
    .single();
  if (error) return { error: error.message };

  if (recipientEmail) {
    const { sendProposalShareEmail } = await import("@/lib/email");
    const { data: p } = await supabase.from("proposals").select("title").eq("id", proposalId).maybeSingle();
    // Public proposal-share URL is unauthenticated and lives on the apex
    // marketing host so the recipient never lands on an auth-walled subdomain.
    await sendProposalShareEmail({
      to: recipientEmail,
      proposalTitle: p?.title ?? "Proposal",
      url: urlFor("marketing", `/proposals/${data.token}`),
      senderName: session.email,
    });
  }

  revalidatePath(`/console/proposals/${proposalId}/edit`);
  return { ok: { token: data.token, url: `/proposals/${data.token}`, expires: data.expires_at } };
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
  if (!link || ownerOrgId !== session.orgId) return { error: "Share link not found" };

  const { error } = await supabase
    .from("proposal_share_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", linkId)
    .is("revoked_at", null);
  if (error) return { error: error.message };
  revalidatePath(`/console/proposals/${proposalId}/edit`);
  return { ok: true as const };
}
