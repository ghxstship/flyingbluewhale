"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  triage: z.string().max(40).optional(),
  chief_complaint: z.string().max(500).optional(),
  disposition: z.string().max(120).optional(),
  patient_ref: z.string().max(120).optional(),
});

export type State = { error?: string } | null;

export async function createEncounter(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("medical_encounters")
    .insert({
      org_id: session.orgId,
      triage: parsed.data.triage || null,
      chief_complaint: parsed.data.chief_complaint || null,
      disposition: parsed.data.disposition || null,
      patient_ref: parsed.data.patient_ref || null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/console/safety/medical/encounters");
  redirect(`/console/safety/medical/encounters/${data.id}`);
}
