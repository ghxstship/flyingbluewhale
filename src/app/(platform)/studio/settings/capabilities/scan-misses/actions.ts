"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { emitAudit } from "@/lib/audit";

export type State = { error?: string; ok?: true } | null;

const ResolveSchema = z.object({ id: z.string().uuid() });

/**
 * Close a scan miss (backlog P1.3). A miss is RESOLVED, never deleted — the
 * table's DELETE privilege is revoked on purpose, because the queue is the
 * measurement instrument for the external-product-database decision (P4) and
 * an erased miss corrupts the one number it exists to produce.
 *
 * Manager+ per the table's own contract ("Manager+ resolves them"): marking
 * a code handled is an operational judgement, usually made after adding the
 * item to the catalog.
 */
export async function resolveScanMiss(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "You need manager access to resolve scan misses" };
  const parsed = ResolveSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request" };

  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("scan_unknowns")
    .update({ resolved_at: new Date().toISOString(), resolved_by: session.userId })
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId)
    .is("resolved_at", null)
    .select("code, seen_count");
  if (error) return { error: error.message };
  if (!updated || updated.length === 0) return { error: "Miss not found, or already resolved" };

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "scan_miss.resolved",
    targetTable: "scan_unknowns",
    targetId: parsed.data.id,
    metadata: {
      code: (updated[0] as { code: string }).code,
      seenCount: (updated[0] as { seen_count: number }).seen_count,
    },
  });

  revalidatePath("/studio/settings/capabilities/scan-misses");
  return { ok: true };
}
