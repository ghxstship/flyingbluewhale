"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

const Schema = z.object({
  label: z.string().min(2).max(200),
  body: z.string().max(2000).optional(),
  project_id: z.string().uuid(),
});

export async function createSnapshot(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) redirect("/m/snapshot/new?error=invalid");

  const supabase = (await createClient()) as unknown as LooseSupabase;

  await supabase.from("event_snapshots").insert({
    org_id: session.orgId,
    project_id: parsed.data!.project_id,
    user_id: session.userId,
    label: parsed.data!.label,
    body: parsed.data!.body ?? null,
    pinned_at: new Date().toISOString(),
  });

  revalidatePath("/m/snapshot");
  redirect("/m/snapshot?saved=1");
}
