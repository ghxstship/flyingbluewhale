"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({ id: z.string().uuid() });

export async function closePoll(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const { id } = Schema.parse(Object.fromEntries(fd));
  const supabase = await createClient();
  await supabase
    .from("polls")
    .update({ publish_state: "closed" })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .eq("publish_state", "live");
  revalidatePath(`/console/comms/polls/${id}`);
  revalidatePath("/console/comms/polls");
}
