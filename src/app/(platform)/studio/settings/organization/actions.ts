"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdmin as sessionIsAdmin, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { clampDepositPct } from "@/lib/payment-terms";

const Schema = z.object({ name: z.string().min(2).max(120) });

export async function updateOrgName(fd: FormData) {
  const session = await requireSession();
  if (!sessionIsAdmin(session)) throw new Error("Only owners + admins can rename the organization");

  const parsed = Schema.safeParse({ name: fd.get("name") });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid name");

  const supabase = await createClient();
  const { error } = await supabase
    .from("orgs")
    .update({ name: parsed.data.name, updated_at: new Date().toISOString() })
    .eq("id", session.orgId);
  if (error) throw new Error(error.message);

  revalidatePath("/studio/settings/organization");
  revalidatePath("/studio/people");
}

const PaymentDefaultsSchema = z.object({
  default_deposit_pct: z.string().optional(),
  default_balance_terms: z.string().max(64).optional(),
});

/**
 * Set the org-level payment-terms TEMPLATE defaults (plumb-line DUP-1/DUP-6).
 * Blank values clear the template (stored NULL) so the system default in
 * src/lib/payment-terms.ts applies; per-proposal overrides are unaffected.
 */
export async function updateOrgPaymentDefaults(fd: FormData) {
  const session = await requireSession();
  if (!sessionIsAdmin(session)) throw new Error("Only owners + admins can change payment defaults");

  const parsed = PaymentDefaultsSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");

  const raw = parsed.data.default_deposit_pct?.trim();
  const depositPct = raw ? clampDepositPct(parseInt(raw, 10)) : null;
  const balanceTerms = parsed.data.default_balance_terms?.trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("orgs")
    .update({
      default_deposit_pct: depositPct,
      default_balance_terms: balanceTerms,
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.orgId);
  if (error) throw new Error(error.message);

  revalidatePath("/studio/settings/organization");
}
