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
  narrative: z.string().min(1).max(8000),
  subject_ref: z.string().max(200).optional().or(z.literal("")),
  report_state: z.string(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateSafeguardingReport(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("safeguarding_reports", session.orgId, id, expectedUpdatedAt, {
    narrative: parsed.data.narrative,
    subject_ref: parsed.data.subject_ref || null,
    report_state: parsed.data.report_state,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : actionErrorMessage("not-found.safeguarding-report", "Safeguarding Report not found.") };
  }
  revalidatePath(`/studio/safety/safeguarding/${id}`);
  revalidatePath("/studio/safety/safeguarding");
  redirect(`/studio/safety/safeguarding/${id}`);
}

export async function deleteSafeguardingReport(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.from("safeguarding_reports").delete().eq("id", id).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete safeguarding report: ${error.message}`);
  revalidatePath("/studio/safety/safeguarding");
  redirect("/studio/safety/safeguarding");
}
