"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { formFail } from "@/lib/forms/fail";

const Schema = z.object({
  name: z.string().min(1).max(200),
  kind: z.string().min(1).max(80),
  scheduled_at: z.string().optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateReadinessExercise(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("readiness_exercises", session.orgId, id, expectedUpdatedAt, {
    name: parsed.data.name,
    kind: parsed.data.kind,
    scheduled_at: parsed.data.scheduled_at || null,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Readiness Exercise not found." };
  }
  revalidatePath(`/console/programs/readiness/${id}`);
  revalidatePath("/console/programs/readiness");
  redirect(`/console/programs/readiness/${id}`);
}

export async function deleteReadinessExercise(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.from("readiness_exercises").delete().eq("id", id).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete readiness exercis: ${error.message}`);
  revalidatePath("/console/programs/readiness");
  redirect("/console/programs/readiness");
}
