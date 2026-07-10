"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { emitAudit } from "@/lib/audit";

export type State = { error?: string; ok?: true } | null;

const Schema = z.object({ org_id: z.string().uuid() });

/**
 * Set the active workspace from /me/organizations (AUDIT C-28 — the rows
 * were inert despite the "Memberships and switcher" promise). Mirrors the
 * console switcher's PATCH /api/v1/me/workspaces: membership check first,
 * then flip `user_preferences.last_org_id`, which `getSession` reads to
 * resolve the tenant on the next navigation.
 */
export async function setActiveWorkspaceAction(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Missing organization." };
  const orgId = parsed.data.org_id;

  const supabase = await createClient();
  // Confirm live membership before flipping the pointer — RLS would block
  // silently, but a clear failure mode matters; and .is("deleted_at", null)
  // keeps an offboarded user from re-activating themselves into the org.
  const { data: member } = await supabase
    .from("memberships")
    .select("org_id")
    .eq("user_id", session.userId)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!member) return { error: "You are not a member of that workspace." };

  const { error } = await (
    supabase.from("user_preferences") as unknown as {
      upsert: (
        p: Record<string, unknown>,
        opts?: Record<string, unknown>,
      ) => Promise<{ error: { message: string } | null }>;
    }
  ).upsert({ user_id: session.userId, last_org_id: orgId }, { onConflict: "user_id" });
  if (error) return { error: error.message };

  if (orgId !== session.orgId) {
    await emitAudit({
      actorId: session.userId,
      orgId,
      actorEmail: session.email,
      action: "auth.org.switched",
      metadata: { from: session.orgId, to: orgId, via: "/me/organizations" },
    });
  }

  revalidatePath("/me/organizations");
  revalidatePath("/me");
  return { ok: true };
}
