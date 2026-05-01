"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const AnswerSchema = z.object({ official_answer: z.string().min(1).max(10_000) });

export async function answerRfi(id: string, fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = AnswerSchema.parse(Object.fromEntries(fd));
  const supabase = await createClient();
  await supabase
    .from("rfis")
    .update({
      official_answer: parsed.official_answer,
      answered_by: session.userId,
      answered_at: new Date().toISOString(),
      status: "answered",
    } as never)
    .eq("org_id", session.orgId)
    .eq("id", id);
  revalidatePath(`/console/rfis/${id}`);
  revalidatePath("/console/rfis");
}

export async function closeRfi(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase
    .from("rfis")
    .update({ status: "closed", closed_at: new Date().toISOString() } as never)
    .eq("org_id", session.orgId)
    .eq("id", id);
  revalidatePath(`/console/rfis/${id}`);
  revalidatePath("/console/rfis");
}
