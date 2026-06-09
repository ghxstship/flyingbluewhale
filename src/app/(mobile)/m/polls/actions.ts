"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  poll_id: z.string().uuid(),
  option_id: z.string().uuid(),
});

export async function castVote(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  const supabase = await createClient();

  // Poll must be in caller's org AND live. Without this, anyone could
  // vote on draft / closed polls or polls from other tenants.
  const { data: poll } = await supabase
    .from("polls")
    .select("id, publish_state")
    .eq("id", parsed.data.poll_id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!poll || (poll as { publish_state: string }).publish_state !== "live") return;

  // Option must belong to the same poll.
  const { data: option } = await supabase
    .from("poll_options")
    .select("id, poll_id")
    .eq("id", parsed.data.option_id)
    .eq("poll_id", parsed.data.poll_id)
    .maybeSingle();
  if (!option) return;

  const { error } = await supabase.from("poll_votes").upsert(
    {
      poll_id: parsed.data.poll_id,
      option_id: parsed.data.option_id,
      voter_id: session.userId,
      voted_at: new Date().toISOString(),
    },
    { onConflict: "poll_id,voter_id" },
  );
  if (error) throw new Error(`Could not record vote: ${error.message}`);

  revalidatePath("/m/polls");
}
