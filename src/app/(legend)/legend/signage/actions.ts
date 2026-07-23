"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { actionFail, formFail } from "@/lib/forms/fail";
import { SIGNAGE_STANDARDS, SIGNAGE_CATEGORIES, SIGN_STATES, PLACEMENT_STATES } from "@/lib/legend_signage";

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

const SignSchema = z.object({
  code: z.string().min(1, "Code is required").max(60),
  name: z.string().min(1, "Name is required").max(160),
  standard: z.enum(SIGNAGE_STANDARDS),
  category: z.enum(SIGNAGE_CATEGORIES),
  pictogram_key: z.string().min(1, "Pictogram key is required").max(120),
  colorway: z.string().max(80).optional().or(z.literal("")),
  sign_state: z.enum(SIGN_STATES),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export async function createSignAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can create signs" };
  const parsed = SignSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await db
    .from("signage_signs")
    .insert({
      org_id: session.orgId,
      code: parsed.data.code,
      name: parsed.data.name,
      standard: parsed.data.standard,
      category: parsed.data.category,
      pictogram_key: parsed.data.pictogram_key,
      colorway: parsed.data.colorway || null,
      sign_state: parsed.data.sign_state,
      notes: parsed.data.notes || null,
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath("/legend/signage");
  redirect(`/legend/signage/${(data as { id: string }).id}`);
}

export async function updateSignAction(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can edit signs" };
  const parsed = SignSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const db = (await createClient()) as unknown as LooseSupabase;
  const { error } = await db
    .from("signage_signs")
    .update({
      code: parsed.data.code,
      name: parsed.data.name,
      standard: parsed.data.standard,
      category: parsed.data.category,
      pictogram_key: parsed.data.pictogram_key,
      colorway: parsed.data.colorway || null,
      sign_state: parsed.data.sign_state,
      notes: parsed.data.notes || null,
    })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (error) return actionFail(error.message, fd);
  revalidatePath("/legend/signage");
  revalidatePath(`/legend/signage/${id}`);
  redirect(`/legend/signage/${id}`);
}

export async function deleteSign(id: string): Promise<void> {
  const session = await requireSession();
  // Same authoring band as create/update — the delete was the one signage
  // write missing its manager gate (L-P6d).
  if (!isManagerPlus(session)) throw new Error("Only manager+ can delete signs");
  const db = (await createClient()) as unknown as LooseSupabase;
  const { error } = await db
    .from("signage_signs")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (error) throw new Error(`Could not delete sign: ${error.message}`);
  revalidatePath("/legend/signage");
}

const PlacementSchema = z.object({
  sign_id: z.string().uuid(),
  project_id: z.string().uuid().optional().or(z.literal("")),
  location: z.string().min(1, "Location is required").max(200),
  quantity: z.coerce.number().int().min(0).max(100000),
  placement_state: z.enum(PLACEMENT_STATES),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export async function createPlacementAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can record placements" };
  const parsed = PlacementSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const db = (await createClient()) as unknown as LooseSupabase;
  // Confirm the parent sign belongs to this org before writing the child.
  const { data: sign } = await db
    .from("signage_signs")
    .select("id")
    .eq("id", parsed.data.sign_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!sign) return actionFail("Sign not found.", fd);
  const { error } = await db.from("signage_placements").insert({
    org_id: session.orgId,
    sign_id: parsed.data.sign_id,
    project_id: parsed.data.project_id || null,
    location: parsed.data.location,
    quantity: parsed.data.quantity,
    placement_state: parsed.data.placement_state,
    notes: parsed.data.notes || null,
    created_by: session.userId,
  });
  if (error) return actionFail(error.message, fd);
  revalidatePath(`/legend/signage/${parsed.data.sign_id}`);
  redirect(`/legend/signage/${parsed.data.sign_id}`);
}
