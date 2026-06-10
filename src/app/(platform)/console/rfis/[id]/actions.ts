"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const AnswerSchema = z.object({ official_answer: z.string().min(1).max(10_000) });

// RFI FSM: open → answered → closed (or open → void). Answer/close
// guarded against invalid source states so a stale UI can't reopen
// closed RFIs or "answer" a void one. Errors throw so Next's error
// boundary surfaces them rather than silently no-op'ing.

export async function answerRfi(id: string, fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = AnswerSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rfis")
    .update({
      official_answer: parsed.data.official_answer,
      answered_by: session.userId,
      answered_at: new Date().toISOString(),
      rfi_state: "answered",
    } as never)
    .eq("org_id", session.orgId)
    .eq("id", id)
    .eq("rfi_state", "open")
    .select("id");
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("Only an open RFI can be answered");
  revalidatePath(`/console/rfis/${id}`);
  revalidatePath("/console/rfis");
}

export async function closeRfi(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rfis")
    .update({ rfi_state: "closed", closed_at: new Date().toISOString() } as never)
    .eq("org_id", session.orgId)
    .eq("id", id)
    .in("rfi_state", ["answered", "open"])
    .select("id");
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("RFI is already closed or voided");
  revalidatePath(`/console/rfis/${id}`);
  revalidatePath("/console/rfis");
}
