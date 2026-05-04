"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";

const Schema = z.object({
  triage: z.string().max(40).optional(),
  chief_complaint: z.string().max(500).optional(),
  disposition: z.string().max(120).optional(),
  patient_ref: z.string().max(120).optional(),
});

export type State = { error?: string } | null;

export async function updateEncounter(encounterId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
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
  await supabase.from("medical_encounters").delete().eq("id", encounterId).eq("org_id", session.orgId);
  revalidatePath("/console/safety/medical/encounters");
  redirect("/console/safety/medical/encounters");
}
