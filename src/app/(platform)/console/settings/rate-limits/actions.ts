"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdmin, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const BUCKETS = ["ai", "scan", "webhook", "auth"] as const;

const UpsertSchema = z.object({
  bucket: z.enum(BUCKETS),
  limit_count: z.coerce.number().int().min(1).max(1_000_000),
  window_seconds: z.coerce.number().int().min(1).max(3600),
});

export async function upsertRateLimitOverride(fd: FormData): Promise<void> {
  const session = await requireSession();
  // Rate-limit changes affect security posture — owner/admin only.
  if (!isAdmin(session)) return;
  const parsed = UpsertSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;

  const supabase = await createClient();
  const window_ms = parsed.data.window_seconds * 1000;

  // No DB-level (org_id, bucket) unique constraint — enforce single
  // active override per bucket at the app layer so the rate-limiter
  // doesn't see two competing rows for the same bucket.
  const { data: existing } = await supabase
    .from("rate_limit_overrides")
    .select("id")
    .eq("org_id", session.orgId)
    .eq("bucket", parsed.data.bucket)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("rate_limit_overrides")
      .update({
        limit_count: parsed.data.limit_count,
        window_ms,
        updated_at: new Date().toISOString(),
      })
      .eq("id", (existing as { id: string }).id)
      .eq("org_id", session.orgId);
  } else {
    await supabase.from("rate_limit_overrides").insert({
      org_id: session.orgId,
      bucket: parsed.data.bucket,
      limit_count: parsed.data.limit_count,
      window_ms,
    });
  }

  revalidatePath("/console/settings/rate-limits");
}

export async function deleteRateLimitOverride(id: string): Promise<void> {
  const session = await requireSession();
  if (!isAdmin(session)) return;
  if (!/^[0-9a-f-]{36}$/.test(id)) return;

  const supabase = await createClient();
  await supabase.from("rate_limit_overrides").delete().eq("id", id).eq("org_id", session.orgId);

  revalidatePath("/console/settings/rate-limits");
}
