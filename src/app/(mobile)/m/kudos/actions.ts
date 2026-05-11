"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  to_user_id: z.string().uuid(),
  message: z.string().min(1).max(500),
  value_tag: z.string().max(40).optional().or(z.literal("")),
});

export async function createKudos(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = Schema.parse(Object.fromEntries(fd));
  if (parsed.to_user_id === session.userId) return;
  const supabase = await createClient();

  // Recipient must be an active org member. Without this any user could
  // hand kudos to someone outside the org by guessing their UUID.
  const { data: member } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("org_id", session.orgId)
    .eq("user_id", parsed.to_user_id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!member) return;

  await supabase.from("recognition_posts").insert({
    org_id: session.orgId,
    from_user_id: session.userId,
    to_user_id: parsed.to_user_id,
    message: parsed.message,
    value_tag: parsed.value_tag || null,
    points: 0,
    visibility_state: "public",
  });

  revalidatePath("/m/kudos");
}
