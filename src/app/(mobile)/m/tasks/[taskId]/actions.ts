"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const StatusSchema = z.enum(["todo", "in_progress", "blocked", "review", "done"]);

export async function setTaskStatus(taskId: string, fd: FormData): Promise<void> {
  const session = await requireSession();
  const status = StatusSchema.parse(fd.get("status"));
  const supabase = await createClient();
  await supabase.from("tasks").update({ status }).eq("id", taskId).eq("org_id", session.orgId);
  revalidatePath(`/m/tasks/${taskId}`);
  revalidatePath("/m/tasks");
}
