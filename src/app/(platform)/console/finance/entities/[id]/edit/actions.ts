"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { actionFail, formFail } from "@/lib/forms/fail";

// Edit for a legal/ledger entity (workflow audit confirm-intent pass). The
// detail was create+read only; these fields (tax_id, currency, ownership,
// consolidation, effective dates) genuinely change post-creation. Mirrors
// new/actions.ts createOrgEntity.
const Schema = z.object({
  legal_name: z.string().min(1).max(200),
  short_code: z.string().min(1).max(20),
  base_currency: z
    .string()
    .length(3)
    .regex(/^[A-Za-z]{3}$/),
  jurisdiction: z.string().max(20).optional().or(z.literal("")),
  tax_id: z.string().max(40).optional().or(z.literal("")),
  parent_entity_id: z.string().uuid().optional().or(z.literal("")),
  ownership_pct: z.string().optional(),
  consolidation_method: z.enum(["full", "equity", "proportional", "none"]).default("full"),
  consolidation_state: z.enum(["active", "pending", "dormant", "divested"]).default("active"),
  effective_from: z.string().optional().or(z.literal("")),
  effective_to: z.string().optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateOrgEntity(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  const supabase = (await createClient()) as unknown as LooseSupabase;

  // An entity may not be its own / a descendant's parent; cheap self-check
  // here (full cycle detection is out of scope), plus parent-in-org.
  if (parsed.data.parent_entity_id) {
    if (parsed.data.parent_entity_id === id) return { error: "An entity can't consolidate into itself" };
    const { data: parent } = await supabase
      .from("org_entities")
      .select("id")
      .eq("id", parsed.data.parent_entity_id)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!parent) return { error: "Parent entity not found in your organization" };
  }

  const ownership = parsed.data.ownership_pct ? Number(parsed.data.ownership_pct) : 100;
  if (Number.isNaN(ownership) || ownership < 0 || ownership > 100) {
    return { error: "Ownership % must be between 0 and 100" };
  }

  const { error } = await supabase
    .from("org_entities")
    .update({
      parent_entity_id: parsed.data.parent_entity_id || null,
      legal_name: parsed.data.legal_name,
      short_code: parsed.data.short_code,
      base_currency: parsed.data.base_currency.toUpperCase(),
      jurisdiction: parsed.data.jurisdiction || null,
      tax_id: parsed.data.tax_id || null,
      consolidation_method: parsed.data.consolidation_method,
      ownership_pct: ownership,
      consolidation_state: parsed.data.consolidation_state,
      effective_from: parsed.data.effective_from || null,
      effective_to: parsed.data.effective_to || null,
    })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (error) return actionFail(error.message, fd);

  revalidatePath("/console/finance/entities");
  revalidatePath(`/console/finance/entities/${id}`);
  redirect(`/console/finance/entities/${id}`);
}
