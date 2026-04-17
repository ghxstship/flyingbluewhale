"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

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
  try { blocks = JSON.parse(parsed.data.blocks || "[]") as import("@/lib/supabase/database.types").Json; }
  catch { return { error: "Blocks JSON is invalid" }; }

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("proposals")
    .select("version,blocks,theme")
    .eq("org_id", session.orgId)
    .eq("id", proposalId)
    .maybeSingle();
  if (!current) return { error: "Not found" };

  // Snapshot the previous version before overwriting.
  await supabase.from("proposal_versions").insert({
    proposal_id: proposalId,
    version: current.version ?? 1,
    blocks: current.blocks,
    theme: current.theme,
    changed_by: session.userId,
  });

  const { error } = await supabase
    .from("proposals")
    .update({
      title: parsed.data.title,
      doc_number: parsed.data.doc_number || null,
      currency: parsed.data.currency?.toUpperCase() || "USD",
      deposit_percent: parsed.data.deposit_percent ? parseInt(parsed.data.deposit_percent) : 25,
      theme: { primary: parsed.data.theme_primary || "#D4782A", secondary: parsed.data.theme_secondary || "#6D4A2A" },
      blocks,
      version: (current.version ?? 1) + 1,
    })
    .eq("org_id", session.orgId)
    .eq("id", proposalId);
  if (error) return { error: error.message };

  revalidatePath(`/console/proposals/${proposalId}/edit`);
  revalidatePath(`/console/proposals/${proposalId}`);
  return { ok: true };
}

export async function createShareLinkAction(proposalId: string, audience: string | null, recipientEmail?: string | null) {
  const session = await requireSession();
  const supabase = await createClient();
  const token = Array.from(crypto.getRandomValues(new Uint8Array(24))).map((b) => b.toString(16).padStart(2, "0")).join("");
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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    await sendProposalShareEmail({
      to: recipientEmail,
      proposalTitle: p?.title ?? "Proposal",
      url: `${appUrl}/proposals/${data.token}`,
      senderName: session.email,
    });
  }

  revalidatePath(`/console/proposals/${proposalId}/edit`);
  return { ok: { token: data.token, url: `/proposals/${data.token}`, expires: data.expires_at } };
}

export async function revokeShareLinkAction(linkId: string, proposalId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("proposal_share_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", linkId);
  if (error) return { error: error.message };
  revalidatePath(`/console/proposals/${proposalId}/edit`);
  return { ok: true as const };
}
