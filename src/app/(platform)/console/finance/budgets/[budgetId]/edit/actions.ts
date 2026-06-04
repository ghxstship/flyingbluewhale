"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { dollarsToCents } from "@/lib/format";
import {
  XPMS_DEPARTMENTS,
  XPMS_DISCIPLINES,
  XPMS_LINE_TYPES,
  XPMS_PHASES,
  XPMS_TIERS,
  XPMS_XYZ,
} from "@/lib/finance/xpms-budget";

// ADR-1 — XPMS Universal Budget Template v08 fields. Edit path mirrors
// the create schema; all XPMS columns optional, line_type defaults to
// Scope. amount accepts dollar string (form) and cents string (legacy).
const Schema = z.object({
  name: z.string().min(1).max(200),
  amount: z.string().optional().or(z.literal("")),
  amount_cents: z.string().optional().or(z.literal("")),
  category: z.string().max(120).optional().or(z.literal("")),
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
  vendor: z.string().max(160).optional().or(z.literal("")),
  budget_status: z.string().max(80).optional().or(z.literal("")),
  event: z.string().max(160).optional().or(z.literal("")),
  location: z.string().max(160).optional().or(z.literal("")),
  activation: z.string().max(160).optional().or(z.literal("")),
  external_notes: z.string().max(4000).optional().or(z.literal("")),
  internal_notes: z.string().max(4000).optional().or(z.literal("")),
});

export type State = { error?: string } | null;

export async function updateBudget(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const data = parsed.data;

  // Amount: prefer the new dollar-string `amount` field; fall back to
  // legacy `amount_cents` for callers still using the pre-XPMS form.
  let amount_cents: number;
  if (data.amount) {
    amount_cents = dollarsToCents(data.amount);
  } else if (data.amount_cents) {
    amount_cents = Number(data.amount_cents);
  } else {
    amount_cents = 0;
  }

  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const patch: Record<string, unknown> = {
    name: data.name,
    category: data.category || null,
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
    rate_cents: data.rate ? dollarsToCents(data.rate) : null,
    vendor: data.vendor || null,
    budget_status: data.budget_status || null,
    event: data.event || null,
    location: data.location || null,
    activation: data.activation || null,
    external_notes: data.external_notes || null,
    internal_notes: data.internal_notes || null,
  };

  const result = await updateOrgScopedWithCheck("budgets", session.orgId, id, expectedUpdatedAt, patch);
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Budget not found." };
  }
  revalidatePath(`/console/finance/budgets/${id}`);
  revalidatePath("/console/finance/budgets");
  redirect(`/console/finance/budgets/${id}`);
}

export async function deleteBudget(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("budgets").delete().eq("id", id).eq("org_id", session.orgId);
  revalidatePath("/console/finance/budgets");
  redirect("/console/finance/budgets");
}
