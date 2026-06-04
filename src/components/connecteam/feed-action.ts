"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Shared `markAnnouncementRead` action (ADR-0008 Move 1).
 *
 * Extracted from `src/app/(mobile)/m/feed/actions.ts` so both shells
 * (mobile + portal crew) can mount the same FeedSurface component
 * without duplicating the action's RLS guard and the announcement-read
 * upsert pattern.
 *
 * Callers pass a `revalidate` hidden form field with the path that
 * should re-render after the upsert — so /m/feed revalidates /m/feed
 * and /p/[slug]/crew/feed revalidates that specific portal path.
 */
const Schema = z.object({
  announcementId: z.string().uuid(),
  revalidate: z.string().min(1).max(200),
});

export async function markAnnouncementRead(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = Schema.parse(Object.fromEntries(fd));
  const supabase = await createClient();

  // Cross-tenant guard — confirm the announcement belongs to this org.
  const { data: ann } = await supabase
    .from("announcements")
    .select("id")
    .eq("id", parsed.announcementId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!ann) return;

  await supabase
    .from("announcement_reads")
    .upsert(
      { announcement_id: parsed.announcementId, user_id: session.userId, read_at: new Date().toISOString() },
      { onConflict: "announcement_id,user_id" },
    );
  revalidatePath(parsed.revalidate);
}
