"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { dollarsToCents } from "@/lib/format";
import { centsOrNull, moneyCentsString } from "@/app/(platform)/studio/finance/money";
import {
  XPMS_DEPARTMENTS,
  XPMS_DISCIPLINES,
  XPMS_LINE_TYPES,
  XPMS_PHASES,
  XPMS_TIERS,
  XPMS_XYZ,
} from "@/lib/finance/xpms-budget";
import { formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

// ADR-1 — XPMS Universal Budget Template v08 fields. Edit path mirrors
// the create schema; all XPMS columns optional, line_type defaults to
// Scope. The form posts integer cents via MoneyInput (`amount_cents`,
// `rate_cents`); the dollar-string `amount`/`rate` fields are kept as
// legacy fallbacks for pre-XPMS callers.
const Schema = z.object({
  name: z.string().min(1).max(200),
  amount: z.string().optional().or(z.literal("")),
  amount_cents: moneyCentsString({ allowEmpty: true }).optional(),
  // XPMS taxonomy
  department: z.enum(XPMS_DEPARTMENTS).optional().or(z.literal("")),
  team: z.string().max(120).optional().or(z.literal("")),
  class: z.string().max(120).optional().or(z.literal("")),
  item: z.string().max(120).optional().or(z.literal("")),
  discipline: z.enum(XPMS_DISCIPLINES).optional().or(z.literal("")),
  xpms_phase: z.enum(XPMS_PHASES).optional().or(z.literal("")),
  tier: z.enum(XPMS_TIERS).optional().or(z.literal("")),
  xyz: z.enum(XPMS_XYZ).optional().or(z.literal("")),
  line_type: z.enum(XPMS_LINE_TYPES).default("Scope"),
  quantity: z.string().optional().or(z.literal("")),
  rate: z.string().optional().or(z.literal("")),
  rate_cents: moneyCentsString({ allowEmpty: true }).optional(),
  vendor: z.string().max(160).optional().or(z.literal("")),
  budget_state: z.string().max(80).optional().or(z.literal("")),
  event: z.string().max(160).optional().or(z.literal("")),
  location: z.string().max(160).optional().or(z.literal("")),
  activation: z.string().max(160).optional().or(z.literal("")),
  external_notes: z.string().max(4000).optional().or(z.literal("")),
  internal_notes: z.string().max(4000).optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateBudget(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const data = parsed.data;

  // Amount: prefer the integer-cents `amount_cents` posted by
  // MoneyInput; fall back to the legacy dollar-string `amount`.
  let amount_cents: number;
  if (data.amount_cents) {
    amount_cents = Number(data.amount_cents);
  } else if (data.amount) {
    amount_cents = dollarsToCents(data.amount);
  } else {
    amount_cents = 0;
  }

  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const patch: Record<string, unknown> = {
    name: data.name,
    // `category` is retired on budgets (superseded by XPMS department/discipline;
    // the legacy text column is dropped by staged migration M3). The edit form
    // never carried a category field, so writing it here silently NULLed the
    // column on every save — removed. See docs/schema/enum-ui-enrichment-2026-07-18.md.
    amount_cents,
    department: data.department || null,
    team: data.team || null,
    class: data.class || null,
    item: data.item || null,
    discipline: data.discipline || null,
    xpms_phase: data.xpms_phase || null,
    tier: data.tier || null,
    xyz: data.xyz || null,
    line_type: data.line_type,
    quantity: data.quantity ? Number(data.quantity) : null,
    // Prefer integer cents from MoneyInput; legacy dollar-string `rate`
    // as fallback.
    rate_cents: data.rate_cents ? centsOrNull(data.rate_cents) : data.rate ? dollarsToCents(data.rate) : null,
    vendor: data.vendor || null,
    budget_state: data.budget_state || null,
    event: data.event || null,
    location: data.location || null,
    activation: data.activation || null,
    external_notes: data.external_notes || null,
    internal_notes: data.internal_notes || null,
  };

  const result = await updateOrgScopedWithCheck("budgets", session.orgId, id, expectedUpdatedAt, patch);
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : actionErrorMessage("not-found.budget", "Budget not found.") };
  }
  revalidatePath(`/studio/finance/budgets/${id}`);
  revalidatePath("/studio/finance/budgets");
  redirect(`/studio/finance/budgets/${id}`);
}

export async function deleteBudget(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.from("budgets").delete().eq("id", id).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete budget: ${error.message}`);
  revalidatePath("/studio/finance/budgets");
  redirect("/studio/finance/budgets");
}
