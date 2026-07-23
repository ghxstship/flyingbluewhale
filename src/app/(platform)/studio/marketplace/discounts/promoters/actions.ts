"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { actionFail, formFail } from "@/lib/forms/fail";
import { PROMOTER_STATES, normalizeCode } from "@/lib/discounts_promoters";
import { actionErrorMessage } from "@/lib/errors";

const CreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(160),
  email: z.string().email().optional().or(z.literal("")),
  commission_bps: z.coerce.number().int().min(0).max(10000),
  ref_code: z.string().max(60).optional().or(z.literal("")),
  promoter_state: z.enum(PROMOTER_STATES).default("active"),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createPromoterAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.create-promoters", "Only manager+ can create promoters") };
  const parsed = CreateSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const d = parsed.data;
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await db
    .from("promoters")
    .insert({
      org_id: session.orgId,
      name: d.name,
      email: d.email || null,
      commission_bps: d.commission_bps,
      ref_code: d.ref_code ? normalizeCode(d.ref_code) : null,
      promoter_state: d.promoter_state,
      notes: d.notes || null,
      created_by: session.userId,
    })
    .select()
    .single();
  if (error) {
    if (error.code === "23505") return actionFail(actionErrorMessage("a-promoter-with-that-ref-code-already-exists", "A promoter with that ref code already exists."), fd);
    return actionFail(error.message, fd);
  }
  revalidatePath("/studio/marketplace/discounts/promoters");
  redirect(`/studio/marketplace/discounts/promoters/${data.id}`);
}

const StateSchema = z.enum(PROMOTER_STATES);

export async function setPromoterStateAction(id: string, next: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) throw new Error("Only manager+ can change promoter state");
  const parsed = StateSchema.safeParse(next);
  if (!parsed.success) throw new Error("Invalid promoter state");
  const db = (await createClient()) as unknown as LooseSupabase;
  const { error } = await db
    .from("promoters")
    .update({ promoter_state: parsed.data })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (error) throw new Error(`Could not update promoter: ${error.message}`);
  revalidatePath(`/studio/marketplace/discounts/promoters/${id}`);
  revalidatePath("/studio/marketplace/discounts/promoters");
}

export async function deletePromoterAction(id: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) throw new Error("Only manager+ can delete promoters");
  const db = (await createClient()) as unknown as LooseSupabase;
  const { error } = await db
    .from("promoters")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (error) throw new Error(`Could not delete promoter: ${error.message}`);
  revalidatePath("/studio/marketplace/discounts/promoters");
  // No redirect — DeleteForm's undo flow navigates client-side after
  // showing the "Deleted" toast with its Undo action (REC-14).
}

const AttributionSchema = z.object({
  transaction_ref: z.string().min(1, "Transaction reference is required").max(200),
  amount_cents: z.coerce.number().int().min(0),
  discount_code_id: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export async function createAttributionAction(promoterId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.record-attributions", "Only manager+ can record attributions") };
  const parsed = AttributionSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const d = parsed.data;
  const db = (await createClient()) as unknown as LooseSupabase;

  // Capture the promoter's current bps and compute the commission at
  // attribution time so a later rate change doesn't rewrite history.
  const { data: promoter, error: pErr } = await db
    .from("promoters")
    .select("commission_bps")
    .eq("id", promoterId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (pErr) return actionFail(pErr.message, fd);
  if (!promoter) return { error: actionErrorMessage("not-found.promoter", "Promoter not found.") };

  const commission = Math.round((d.amount_cents * (promoter.commission_bps as number)) / 10000);
  const { error } = await db.from("promoter_attributions").insert({
    org_id: session.orgId,
    promoter_id: promoterId,
    discount_code_id: d.discount_code_id || null,
    transaction_ref: d.transaction_ref,
    amount_cents: d.amount_cents,
    commission_cents: commission,
    notes: d.notes || null,
    created_by: session.userId,
  });
  if (error) return actionFail(error.message, fd);
  revalidatePath(`/studio/marketplace/discounts/promoters/${promoterId}`);
  return { ok: true };
}
