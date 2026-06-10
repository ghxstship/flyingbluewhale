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
  nationality: z.string().max(120).optional().or(z.literal("")),
  passport_no: z.string().max(80).optional().or(z.literal("")),
  case_state: z.string(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateVisaCase(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("visa_cases", session.orgId, id, expectedUpdatedAt, {
    person_name: parsed.data.person_name,
    nationality: parsed.data.nationality || null,
    passport_no: parsed.data.passport_no || null,
    case_state: parsed.data.case_state,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Visa Case not found." };
  }
  revalidatePath(`/console/participants/visa/${id}`);
  revalidatePath("/console/participants/visa");
  redirect(`/console/participants/visa/${id}`);
}

export async function deleteVisaCase(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.from("visa_cases").delete().eq("id", id).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete visa cas: ${error.message}`);
  revalidatePath("/console/participants/visa");
  redirect("/console/participants/visa");
}
