"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

/**
 * Org atom-overlay writes (XPMS Catalog pillar, LEG3ND P4).
 *
 * The master catalog (xpms_catalog) is the immutable SSOT — these actions
 * only ever upsert into `org_xpms_atom_settings` (unique org × atom), the
 * settings-over-catalog overlay. RLS gates writes to owner/admin/manager,
 * so every write reads the row back to keep an RLS-refused write honest
 * (finance-codes pattern).
 */

const AtomIdSchema = z
  .string()
  .regex(/^\d{4}\.\d{2}\.\d{2}-\d+$/, "Not a valid XPMS atom id ({URID}-{SEQ})");

const LabelSchema = z.object({
  org_label: z.string().max(200).transform((v) => v.trim()),
});

export type State = { error?: string; ok?: true } | null;

export async function setAtomEnabledAction(atomId: string, enabled: boolean): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can enable or disable atoms" };
  const parsedId = AtomIdSchema.safeParse(atomId);
  if (!parsedId.success) return { error: parsedId.error.issues[0]?.message ?? "Invalid atom id" };
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await db
    .from("org_xpms_atom_settings")
    .upsert(
      { org_id: session.orgId, xpms_atom_id: parsedId.data, enabled },
      { onConflict: "org_id,xpms_atom_id" },
    )
    .select("id");
  if (error) return { error: `Could not update the atom setting: ${error.message}` };
  if (!data || data.length === 0) {
    return { error: "Nothing was saved. Your role may not allow this." };
  }
  revalidatePath("/legend/hub/xpms");
  revalidatePath("/legend/hub");
  return { ok: true };
}

export async function setAtomOrgLabelAction(atomId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can set org labels" };
  const parsedId = AtomIdSchema.safeParse(atomId);
  if (!parsedId.success) return { error: parsedId.error.issues[0]?.message ?? "Invalid atom id" };
  const parsed = LabelSchema.safeParse({ org_label: String(fd.get("org_label") ?? "") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid label" };
  // Empty submit clears the override back to the canonical catalog name.
  const orgLabel = parsed.data.org_label === "" ? null : parsed.data.org_label;
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await db
    .from("org_xpms_atom_settings")
    .upsert(
      { org_id: session.orgId, xpms_atom_id: parsedId.data, org_label: orgLabel },
      { onConflict: "org_id,xpms_atom_id" },
    )
    .select("id");
  if (error) return { error: `Could not save the label: ${error.message}` };
  if (!data || data.length === 0) {
    return { error: "Nothing was saved. Your role may not allow this." };
  }
  revalidatePath("/legend/hub/xpms");
  return { ok: true };
}
