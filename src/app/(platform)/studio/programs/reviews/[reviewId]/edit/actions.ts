"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({
  title: z.string().min(1).max(200),
  scheduled_at: z.string().optional().or(z.literal("")),
  notes: z.string().max(4000).optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateProgramReview(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("program_reviews", session.orgId, id, expectedUpdatedAt, {
    title: parsed.data.title,
    scheduled_at: parsed.data.scheduled_at,
    notes: parsed.data.notes || null,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : actionErrorMessage("not-found.program-review", "Program Review not found.") };
  }
  revalidatePath(`/studio/programs/reviews/${id}`);
  revalidatePath("/studio/programs/reviews");
  redirect(`/studio/programs/reviews/${id}`);
}

export async function deleteProgramReview(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.from("program_reviews").delete().eq("id", id).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete program review: ${error.message}`);
  revalidatePath("/studio/programs/reviews");
  redirect("/studio/programs/reviews");
}
