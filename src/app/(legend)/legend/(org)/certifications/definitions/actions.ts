"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { actionFail, formFail } from "@/lib/forms/fail";
import { CERTIFICATION_STATES } from "@/lib/legend_compliance";

/**
 * Certification-type definitions CRUD (L-P6b, blocker B-5). The credential
 * catalog (`legend_certifications`) was seed-only — an org could not define
 * the credentials it certifies. Manager+ band, matching the RLS write policy
 * (owner/admin/manager/controller after the 20260625 manager-grant sweep).
 *
 * Retire is a soft facet (`certification_state = 'archived'`) — never a hard
 * delete: `certification_holders` and `legend_courses.grants_certification_id`
 * reference these rows, and an archived credential must keep verifying.
 */
const DefinitionSchema = z.object({
  code: z.string().trim().min(1, "Code is required").max(64),
  name: z.string().trim().min(1, "Name is required").max(160),
  description: z.string().max(4000).optional().or(z.literal("")),
  // Empty string = never expires (validity_months null).
  validity_months: z
    .union([z.literal(""), z.coerce.number().int().min(1).max(600)])
    .optional(),
  recert_window_days: z.coerce.number().int().min(0).max(3650).default(30),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createCertificationAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can define certifications" };
  const parsed = DefinitionSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const d = parsed.data;
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await db
    .from("legend_certifications")
    .insert({
      org_id: session.orgId,
      code: d.code,
      name: d.name,
      description: d.description || null,
      validity_months: d.validity_months === "" || d.validity_months === undefined ? null : d.validity_months,
      recert_window_days: d.recert_window_days,
      certification_state: "active",
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath("/legend/certifications/definitions");
  revalidatePath("/legend/compliance");
  redirect(`/legend/certifications/definitions/${data.id}`);
}

export async function updateCertificationAction(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can edit certifications" };
  const parsed = DefinitionSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const d = parsed.data;
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await db
    .from("legend_certifications")
    .update({
      code: d.code,
      name: d.name,
      description: d.description || null,
      validity_months: d.validity_months === "" || d.validity_months === undefined ? null : d.validity_months,
      recert_window_days: d.recert_window_days,
    })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  if (error) return actionFail(error.message, fd);
  // RLS no-op writes return no error — read the row back (repo canon).
  if (!data) return actionFail("Certification not found or not editable", fd);
  revalidatePath("/legend/certifications/definitions");
  revalidatePath(`/legend/certifications/definitions/${id}`);
  revalidatePath("/legend/compliance");
  redirect(`/legend/certifications/definitions/${id}`);
}

const StateSchema = z.enum(CERTIFICATION_STATES);

/** Retire (archive) or restore a certification type — the soft facet. */
export async function setCertificationStateAction(id: string, next: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) throw new Error("Only manager+ can change certification state");
  const parsed = StateSchema.safeParse(next);
  if (!parsed.success) throw new Error("Invalid certification state");
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await db
    .from("legend_certifications")
    .update({ certification_state: parsed.data })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(`Could not update certification: ${error.message}`);
  if (!data) throw new Error("Certification not found");
  revalidatePath("/legend/certifications/definitions");
  revalidatePath(`/legend/certifications/definitions/${id}`);
  revalidatePath("/legend/compliance");
}
