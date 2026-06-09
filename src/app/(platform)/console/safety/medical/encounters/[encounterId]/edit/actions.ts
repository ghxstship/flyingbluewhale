"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { formFail } from "@/lib/forms/fail";

const Schema = z.object({
  triage: z.string().max(40).optional(),
  chief_complaint: z.string().max(500).optional(),
  disposition: z.string().max(120).optional(),
  patient_ref: z.string().max(120).optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateEncounter(encounterId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("medical_encounters", session.orgId, encounterId, expectedUpdatedAt, {
    triage: parsed.data.triage || null,
    chief_complaint: parsed.data.chief_complaint || null,
    disposition: parsed.data.disposition || null,
    patient_ref: parsed.data.patient_ref || null,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Medical Encounter not found." };
  }
  revalidatePath(`/console/safety/medical/encounters/${encounterId}`);
  revalidatePath("/console/safety/medical/encounters");
  redirect(`/console/safety/medical/encounters/${encounterId}`);
}

export async function deleteEncounter(encounterId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  // Hard delete — medical_encounters has no deleted_at column. The
  // earlier soft-delete attempt was based on a flawed grep that
  // misattributed deleted_at to this table; the schema confirms no
  // such column exists. Medical-record retention is a real concern
  // (HIPAA-adjacent), but the right fix is a migration to ADD
  // deleted_at first, then switch behavior — not a hopeful column
  // reference in app code.
  const { error } = await supabase
    .from("medical_encounters")
    .delete()
    .eq("id", encounterId)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete medical encounter: ${error.message}`);
  revalidatePath("/console/safety/medical/encounters");
  redirect("/console/safety/medical/encounters");
}
