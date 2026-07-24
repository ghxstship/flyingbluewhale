"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { actionFail, formFail } from "@/lib/forms/fail";

/**
 * Cost-center CRUD (Finance Codes pillar, hub-native — the cost_centers
 * table has NO console surface; this is its only UI).
 *
 * Schema notes: `cost_centers` carries a UNIQUE (org_id, code), a NOT NULL
 * `scope` (org/project/department/xtc_class — the hub authors org-level
 * codes, so scope is pinned to 'org'), and an `active` facet flag (no
 * `deleted_at`; deactivate is the archive). RLS `ulg_cc_org` reads for org
 * members and gates writes to owner/admin/manager, so every write reads the
 * row back to keep an RLS-refused write honest (positions pattern).
 *
 * The code stays immutable after creation: budget lines, requisitions, and
 * XPMS coordinates reference cost centers, and the 10 XPMS classes
 * (0000-9000) are canon. Rename touches `name` only.
 */

const CreateSchema = z.object({
  code: z
    .string()
    .regex(/^\d{4}$/, "Code must be 4 digits on the XPMS canon (e.g. 5000, or a sub-code like 5100)"),
  name: z.string().min(1, "Name is required").max(120),
});

const RenameSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createCostCenterAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can create cost centers" };
  const parsed = CreateSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await db
    .from("cost_centers")
    .insert({
      org_id: session.orgId,
      code: parsed.data.code,
      name: parsed.data.name,
      scope: "org",
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") {
      return actionFail("A cost center with this code already exists", fd);
    }
    return actionFail(error.message, fd);
  }
  if (!data?.id) return actionFail("The cost center was not created. Your role may not allow this.", fd);
  revalidatePath("/legend/hub/finance-codes");
  revalidatePath("/legend/hub");
  redirect(`/legend/hub/finance-codes/${data.id}`);
}

export async function renameCostCenterAction(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can edit cost centers" };
  const parsed = RenameSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await db
    .from("cost_centers")
    .update({ name: parsed.data.name })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .select("id");
  if (error) return actionFail(error.message, fd);
  if (!data || data.length === 0) {
    return actionFail("Nothing was saved. The cost center may be gone, or your role may not allow edits.", fd);
  }
  revalidatePath("/legend/hub/finance-codes");
  revalidatePath(`/legend/hub/finance-codes/${id}`);
  redirect(`/legend/hub/finance-codes/${id}`);
}

export async function setCostCenterActiveAction(id: string, active: boolean): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) throw new Error("Only manager+ can activate or deactivate cost centers");
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await db
    .from("cost_centers")
    .update({ active })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .select("id");
  if (error) throw new Error(`Could not update cost center: ${error.message}`);
  if (!data || data.length === 0) {
    throw new Error("Nothing was updated. The cost center may be gone, or your role may not allow this.");
  }
  revalidatePath("/legend/hub/finance-codes");
  revalidatePath(`/legend/hub/finance-codes/${id}`);
  revalidatePath("/legend/hub");
}
