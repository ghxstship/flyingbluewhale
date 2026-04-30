"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

const Schema = z.object({
  triage: z.enum(["green", "yellow", "red", "black"]),
  patient_ref: z.string().max(120).optional(),
  chief_complaint: z.string().min(1).max(2000),
  disposition: z.string().max(160).optional(),
  // Signature fields produced by <SignatureField name="signature">
  signature_kind: z.enum(["typed", "canvas"]).optional(),
  signature: z.string().max(200_000).optional(),
});

export type State = { error?: string } | null;

export async function logEncounter(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  // Clinician signature lives inside phi_encrypted (clinical record domain).
  // Storing kind + raw payload keeps the bytes scoped to the encounter row;
  // a future migration can move large canvas blobs to storage by path.
  const phi: Json = {
    clinician_signature: parsed.data.signature
      ? {
          kind: parsed.data.signature_kind ?? "typed",
          data: parsed.data.signature,
          captured_at: new Date().toISOString(),
        }
      : null,
  };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("medical_encounters")
    .insert({
      org_id: session.orgId,
      triage: parsed.data.triage,
      patient_ref: parsed.data.patient_ref || null,
      chief_complaint: parsed.data.chief_complaint,
      disposition: parsed.data.disposition || null,
      phi_encrypted: phi,
      clinician_id: session.userId,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/console/safety/medical/encounters");
  revalidatePath("/m/medic");
  redirect(`/console/safety/medical/encounters/${data.id}`);
}
