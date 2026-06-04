"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { randomBytes, createHash } from "node:crypto";
import { isAdmin, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { emitAudit } from "@/lib/audit";

const CreateSchema = z.object({
  name: z.string().min(1).max(120),
  scopes: z.string().optional(),
});

export type CreateState =
  | { error?: string; secret?: undefined; prefix?: undefined }
  | { error?: undefined; secret: string; prefix: string }
  | null;

/**
 * createApiKeyAction — generates a 256-bit random secret, stores the SHA-256
 * hash, and returns the plaintext to the caller exactly once. The plaintext
 * is never persisted; an operator who loses it must rotate.
 */
export async function createApiKeyAction(_: CreateState, fd: FormData): Promise<CreateState> {
  const session = await requireSession();
  // API keys grant programmatic org access — owner/admin only.
  if (!isAdmin(session)) return { error: "Only owners and admins can mint API keys" };
  const parsed = CreateSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const raw = randomBytes(32).toString("base64url"); // ~43 chars
  const prefix = `sk_${raw.slice(0, 8)}`;
  const fullSecret = `${prefix}_${raw.slice(8)}`;
  const hashed = createHash("sha256").update(fullSecret).digest("hex");
  const scopes = (parsed.data.scopes ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const { data: minted, error } = await supabase
    .from("api_keys")
    .insert({
      org_id: session.orgId,
      name: parsed.data.name,
      prefix,
      hashed_secret: hashed,
      scopes,
      created_by: session.userId,
    })
    .select("id")
    .maybeSingle();
  if (error) return { error: error.message };
  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "auth.api_key.minted",
    targetTable: "api_keys",
    targetId: (minted as { id: string } | null)?.id ?? null,
    metadata: { name: parsed.data.name, prefix, scopes },
  });
  revalidatePath("/console/settings/api");
  return { prefix, secret: fullSecret };
}

export async function revokeApiKeyAction(formData: FormData) {
  const session = await requireSession();
  if (!isAdmin(session)) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  // .is("revoked_at", null) — don't re-stamp revoked_at on an already-
  // revoked key (would change the audit timestamp from the original
  // revocation to "now").
  const { data: revoked } = await supabase
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("revoked_at", null)
    .select("id")
    .maybeSingle();
  if (revoked) {
    await emitAudit({
      actorId: session.userId,
      orgId: session.orgId,
      actorEmail: session.email,
      action: "auth.api_key.revoked",
      targetTable: "api_keys",
      targetId: id,
    });
  }
  revalidatePath("/console/settings/api");
}
