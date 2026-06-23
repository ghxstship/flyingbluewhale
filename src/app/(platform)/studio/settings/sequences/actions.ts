"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const UpsertSchema = z.object({
  scope: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9_]+$/, "Lowercase letters, digits, underscore only"),
  format: z.string().trim().min(1).max(128),
  seed_val: z.coerce.number().int().min(0).max(9_999_999_999).optional(),
});

export async function upsertSequence(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = UpsertSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;

  const supabase = await createClient();
  // PK is (org_id, scope) so an upsert resolves to either an insert with
  // the seeded counter, or an update that swaps the format string. We
  // preserve the existing current_val unless an explicit seed was given —
  // operators usually want to change the *format* mid-stream without
  // resetting the counter.
  const existing = await supabase
    .from("org_sequences")
    .select("current_val")
    .eq("org_id", session.orgId)
    .eq("scope", parsed.data.scope)
    .maybeSingle();

  const current_val = parsed.data.seed_val ?? (existing.data?.current_val as number | undefined) ?? 0;

  const { error } = await supabase.from("org_sequences").upsert(
    {
      org_id: session.orgId,
      scope: parsed.data.scope,
      format: parsed.data.format,
      current_val,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "org_id,scope" },
  );
  if (error) throw new Error(`Could not save org sequence: ${error.message}`);

  revalidatePath("/studio/settings/sequences");
}

export async function resetSequence(scope: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  if (!/^[a-z0-9_]+$/.test(scope) || scope.length > 64) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("org_sequences")
    .update({ current_val: 0, updated_at: new Date().toISOString() })
    .eq("org_id", session.orgId)
    .eq("scope", scope);
  if (error) throw new Error(`Could not update org sequence: ${error.message}`);

  revalidatePath("/studio/settings/sequences");
}
