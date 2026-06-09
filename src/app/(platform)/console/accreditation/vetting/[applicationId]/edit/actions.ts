"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { formFail } from "@/lib/forms/fail";

const Schema = z.object({
  person_name: z.string().min(1).max(200),
  person_email: z.string().email().optional().or(z.literal("")),
  vetting: z.string(),
  valid_from: z.string().optional().or(z.literal("")),
  valid_to: z.string().optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateVettingApp(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("accreditations", session.orgId, id, expectedUpdatedAt, {
    person_name: parsed.data.person_name,
    person_email: parsed.data.person_email || null,
    vetting: parsed.data.vetting as "pending" | "in_progress" | "clear" | "flagged" | "failed",
    valid_from: parsed.data.valid_from || null,
    valid_to: parsed.data.valid_to || null,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Accreditation not found." };
  }
  revalidatePath(`/console/accreditation/vetting/${id}`);
  revalidatePath("/console/accreditation/vetting");
  redirect(`/console/accreditation/vetting/${id}`);
}

export async function deleteVettingApp(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.from("accreditations").delete().eq("id", id).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete accreditation: ${error.message}`);
  revalidatePath("/console/accreditation/vetting");
  redirect("/console/accreditation/vetting");
}
