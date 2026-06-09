"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({ id: z.string().uuid() });

export async function closePoll(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  const { id } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("polls")
    .update({ publish_state: "closed" })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .eq("publish_state", "live");
  if (error) throw new Error(`Could not update poll: ${error.message}`);
  revalidatePath(`/console/comms/polls/${id}`);
  revalidatePath("/console/comms/polls");
}
