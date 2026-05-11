"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({ announcementId: z.string().uuid() });

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
  revalidatePath("/m/feed");
}
