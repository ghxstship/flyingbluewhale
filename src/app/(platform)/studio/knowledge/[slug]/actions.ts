"use server";

import { revalidatePath } from "next/cache";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { emitAudit } from "@/lib/audit";

/**
 * Mark a KB article verified (kit 21 W7, Guru canon) — stamps verified_at /
 * verified_by so it reads "Verified" until the review interval lapses. Toggle
 * off clears the stamp. Manager+ only; every flip writes an audit entry.
 */
export async function toggleArticleVerified(articleId: string, slug: string, verify: boolean): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const supabase = await createClient();

  const { error } = await supabase
    .from("kb_articles")
    .update(
      verify
        ? { verified_at: new Date().toISOString(), verified_by: session.userId }
        : { verified_at: null, verified_by: null },
    )
    .eq("id", articleId)
    .eq("org_id", session.orgId);
  if (error) return;

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: verify ? "kb.article.verified" : "kb.article.unverified",
    targetTable: "kb_articles",
    targetId: articleId,
  });

  revalidatePath(`/studio/knowledge/${slug}`);
  revalidatePath("/studio/knowledge");
}
