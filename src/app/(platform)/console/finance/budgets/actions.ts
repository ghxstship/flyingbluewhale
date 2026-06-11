"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { centsOrNull, moneyCentsString } from "@/app/(platform)/console/finance/money";
import {
  XPMS_DEPARTMENTS,
  XPMS_DISCIPLINES,
  XPMS_LINE_TYPES,
  XPMS_PHASES,
  XPMS_TIERS,
  XPMS_XYZ,
} from "@/lib/finance/xpms-budget";
import { actionFail, formFail } from "@/lib/forms/fail";

// ADR-1 — XPMS Universal Budget Template v08 fields, mirrors migration
// 0070. All XPMS columns optional except line_type (defaults to Scope).
const Schema = z.object({
  name: z.string().min(1).max(120),
  // Integer cents from MoneyInput's hidden field — never dollar strings.
  amount_cents: moneyCentsString(),
  project_id: z.string().uuid().optional().or(z.literal("")),
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
  rate_cents: moneyCentsString({ allowEmpty: true }),
  vendor: z.string().max(160).optional().or(z.literal("")),
  budget_status: z.string().max(80).optional().or(z.literal("")),
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

export async function createBudgetAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can create budgets" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const data = parsed.data;

  // Cross-tenant FK guard on project_id.
  if (data.project_id) {
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", data.project_id)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!project) return { error: "Project not found in your organization" };
  }

  // Quantity is a plain number; rate/amount arrive as integer cents
  // from MoneyInput. The DB trigger will compute
  // estimate_cents = quantity * rate_cents.
  const quantity = data.quantity ? Number(data.quantity) : null;
  const rate_cents = centsOrNull(data.rate_cents);

  const insert: Record<string, unknown> = {
    org_id: session.orgId,
    name: data.name,
    amount_cents: Number(data.amount_cents),
    project_id: data.project_id || null,
    department: data.department || null,
    team: data.team || null,
    class: data.class || null,
    item: data.item || null,
    discipline: data.discipline || null,
    xpms_phase: data.xpms_phase || null,
    tier: data.tier || null,
    xyz: data.xyz || null,
    line_type: data.line_type,
    quantity,
    rate_cents,
    vendor: data.vendor || null,
    budget_status: data.budget_status || null,
    event: data.event || null,
    location: data.location || null,
    activation: data.activation || null,
    external_notes: data.external_notes || null,
    internal_notes: data.internal_notes || null,
  };

  // Cast to LooseSupabase — the typed client's `budgets` schema doesn't
  // yet include the XPMS columns added in migration 0070 until
  // `npm run gen:types` is run. Same documented pattern marketplace
  // queries use.
  const { error } = await (supabase as unknown as LooseSupabase).from("budgets").insert(insert);
  if (error) return actionFail(error.message, fd);
  revalidatePath("/console/finance/budgets");
  redirect("/console/finance/budgets");
}
