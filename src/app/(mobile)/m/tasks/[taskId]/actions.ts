"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const StatusSchema = z.enum(["todo", "in_progress", "blocked", "review", "done"]);

export async function setTaskStatus(taskId: string, fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsedStatus = StatusSchema.safeParse(fd.get("status"));
  if (!parsedStatus.success) throw new Error(parsedStatus.error.issues[0]?.message ?? "Invalid input");
  const status = parsedStatus.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ task_state: status })
    .eq("id", taskId)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not update task: ${error.message}`);
  revalidatePath(`/m/tasks/${taskId}`);
  revalidatePath("/m/tasks");
}
