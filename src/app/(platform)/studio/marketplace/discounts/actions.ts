"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { actionFail, formFail } from "@/lib/forms/fail";
import { DISCOUNT_KINDS, DISCOUNT_STATES, normalizeCode } from "@/lib/discounts_promoters";

const CreateSchema = z.object({
  code: z.string().min(1, "Code is required").max(60),
  kind: z.enum(DISCOUNT_KINDS),
  // percent: bps (1000 = 10%); fixed: cents off. Integer >= 0.
  value: z.coerce.number().int().min(0),
  max_redemptions: z.coerce.number().int().min(0).optional().or(z.literal("")),
  discount_state: z.enum(DISCOUNT_STATES).default("active"),
  starts_at: z.string().optional().or(z.literal("")),
  ends_at: z.string().optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createDiscountAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can create discount codes" };
  const parsed = CreateSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const d = parsed.data;
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await db
    .from("discount_codes")
    .insert({
      org_id: session.orgId,
      code: normalizeCode(d.code),
      kind: d.kind,
      value: d.value,
      max_redemptions: d.max_redemptions === "" || d.max_redemptions === undefined ? null : d.max_redemptions,
      discount_state: d.discount_state,
      starts_at: d.starts_at || null,
      ends_at: d.ends_at || null,
      notes: d.notes || null,
      created_by: session.userId,
    })
    .select()
    .single();
  if (error) {
    if (error.code === "23505") return actionFail("A code with that name already exists.", fd);
    return actionFail(error.message, fd);
  }
  revalidatePath("/studio/marketplace/discounts");
  redirect(`/studio/marketplace/discounts/${data.id}`);
}

const StateSchema = z.enum(DISCOUNT_STATES);

export async function setDiscountStateAction(id: string, next: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) throw new Error("Only manager+ can change discount state");
  const parsed = StateSchema.safeParse(next);
  if (!parsed.success) throw new Error("Invalid discount state");
  const db = (await createClient()) as unknown as LooseSupabase;
  const { error } = await db
    .from("discount_codes")
    .update({ discount_state: parsed.data })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (error) throw new Error(`Could not update discount: ${error.message}`);
  revalidatePath(`/studio/marketplace/discounts/${id}`);
  revalidatePath("/studio/marketplace/discounts");
}

export async function deleteDiscountAction(id: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) throw new Error("Only manager+ can delete discount codes");
  const db = (await createClient()) as unknown as LooseSupabase;
  const { error } = await db
    .from("discount_codes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (error) throw new Error(`Could not delete discount: ${error.message}`);
  revalidatePath("/studio/marketplace/discounts");
  // No redirect — DeleteForm's undo flow navigates client-side after
  // showing the "Deleted" toast with its Undo action (REC-14).
}
