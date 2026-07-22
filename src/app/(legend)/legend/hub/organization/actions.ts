"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { actionFail, formFail } from "@/lib/forms/fail";

/**
 * Position library CRUD (Organization pillar, hub-native — not a mirror).
 *
 * RLS on `positions`: org members read; owner/admin/manager insert/update;
 * owner/admin delete. Archive is the `active` facet flip, not a delete
 * (the table carries no `deleted_at`). Every write reads the row back:
 * an RLS-refused UPDATE returns no error and zero rows, so the read-back
 * is what makes the failure honest.
 */

const PositionSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  department_code: z
    .string()
    .regex(/^\d000$/, "Department code must be one of the XPMS classes (0000-9000)")
    .optional()
    .or(z.literal("")),
  summary: z.string().max(2000).optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createPositionAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can create positions" };
  const parsed = PositionSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const d = parsed.data;
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await db
    .from("positions")
    .insert({
      org_id: session.orgId,
      title: d.title,
      department_code: d.department_code || null,
      summary: d.summary || null,
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") {
      return actionFail("A position with this title already exists", fd);
    }
    return actionFail(error.message, fd);
  }
  if (!data?.id) return actionFail("The position was not created. Your role may not allow this.", fd);
  revalidatePath("/legend/hub/organization");
  revalidatePath("/legend/hub");
  redirect(`/legend/hub/organization/${data.id}`);
}

export async function updatePositionAction(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can edit positions" };
  const parsed = PositionSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const d = parsed.data;
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await db
    .from("positions")
    .update({
      title: d.title,
      department_code: d.department_code || null,
      summary: d.summary || null,
    })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .select("id");
  if (error) {
    if (error.code === "23505") {
      return actionFail("A position with this title already exists", fd);
    }
    return actionFail(error.message, fd);
  }
  if (!data || data.length === 0) {
    return actionFail("Nothing was saved. The position may be gone, or your role may not allow edits.", fd);
  }
  revalidatePath("/legend/hub/organization");
  revalidatePath(`/legend/hub/organization/${id}`);
  redirect(`/legend/hub/organization/${id}`);
}

export async function setPositionActiveAction(id: string, active: boolean): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) throw new Error("Only manager+ can archive or restore positions");
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await db
    .from("positions")
    .update({ active })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .select("id");
  if (error) throw new Error(`Could not update position: ${error.message}`);
  if (!data || data.length === 0) {
    throw new Error("Nothing was updated. The position may be gone, or your role may not allow this.");
  }
  revalidatePath("/legend/hub/organization");
  revalidatePath(`/legend/hub/organization/${id}`);
  revalidatePath("/legend/hub");
}
