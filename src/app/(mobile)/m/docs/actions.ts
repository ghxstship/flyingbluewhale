"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { emitAudit } from "@/lib/audit";
import { urlFor } from "@/lib/urls";

export type State = { error?: string } | null;

export type ShareResult = { url: string; title: string; scope: string } | { error: string };

/**
 * Share a Knowledge doc/SOP from the field (kit 32 A7).
 *
 * The link deep-points at the doc's own route — it is NOT a public/anon link:
 * the destination re-checks org membership + `sop_state='published'` server
 * side, so sharing widens reach only within the RBAC scope that already
 * governs the doc. We resolve that scope here (org-scoped published SOPs are
 * "Organization", must-read ones note it) and write an `audit_log` row so the
 * share is attributable — who shared what, and the scope it respected.
 */
export async function shareDoc(sopId: string): Promise<ShareResult> {
  const session = await requireSession();
  const parsed = z.string().uuid().safeParse(sopId);
  if (!parsed.success) return { error: "Invalid request." };
  const supabase = await createClient();

  // Re-read under RLS: if the caller can't read it, they can't share it.
  const { data: sop } = await supabase
    .from("sops")
    .select("id, code, title, must_read")
    .eq("id", parsed.data)
    .eq("org_id", session.orgId)
    .eq("sop_state", "published")
    .is("deleted_at", null)
    .maybeSingle();
  if (!sop) return { error: "Article not found." };

  const row = sop as { id: string; code: string; title: string; must_read: boolean };
  // Org-scoped published SOP → the RBAC scope is the organization.
  const scope = row.must_read ? "org:must_read" : "org";
  const url = urlFor("mobile", `/docs/${row.id}`);

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email ?? null,
    action: "document.shared",
    targetTable: "sops",
    targetId: row.id,
    metadata: { scope, surface: "compvss.docs", code: row.code, title: row.title },
  });

  return { url, title: row.title, scope };
}

const Ack = z.object({ sopId: z.string().uuid() });

/**
 * Acknowledge a must-read SOP (kit 28 Knowledge: "Must-read articles require
 * acknowledgement").
 *
 * Append-only, one row per (sop, user) — `sop_acknowledgements`, migration
 * 20260716120000. RLS holds the real line (insert only as yourself, in your
 * org); a duplicate ack reads as success because the button was stale, not
 * because anything went wrong.
 */
export async function acknowledgeSop(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Ack.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request." };
  const supabase = await createClient();

  const { data: sop } = await supabase
    .from("sops")
    .select("id")
    .eq("id", parsed.data.sopId)
    .eq("org_id", session.orgId)
    .eq("sop_state", "published")
    .is("deleted_at", null)
    .maybeSingle();
  if (!sop) return { error: "Article not found." };

  const { error } = await supabase.from("sop_acknowledgements").insert({
    sop_id: parsed.data.sopId,
    user_id: session.userId,
    org_id: session.orgId,
  });
  if (error && !/duplicate key/i.test(error.message)) return { error: error.message };

  revalidatePath("/m/docs");
  revalidatePath(`/m/docs/${parsed.data.sopId}`);
  return null;
}
