"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { formFail } from "@/lib/forms/fail";

const Schema = z.object({
  kind: z.string().min(1).max(80),
  change_state: z.string(),
  note: z.string().max(2000).optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateAccreditationChange(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("accreditation_changes", session.orgId, id, expectedUpdatedAt, {
    kind: parsed.data.kind,
    change_state: parsed.data.change_state,
    note: parsed.data.note || null,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Accreditation Change not found." };
  }
  revalidatePath(`/studio/accreditation/changes/${id}`);
  revalidatePath("/studio/accreditation/changes");
  redirect(`/studio/accreditation/changes/${id}`);
}

export async function deleteAccreditationChange(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.from("accreditation_changes").delete().eq("id", id).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete accreditation change: ${error.message}`);
  revalidatePath("/studio/accreditation/changes");
  redirect("/studio/accreditation/changes");
}
