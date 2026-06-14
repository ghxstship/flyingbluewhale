"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dollarsToCents, generateNumber } from "@/lib/format";
import { moneyDollarsString } from "@/lib/zod/money";
import { actionFail, formFail } from "@/lib/forms/fail";
import { BEO_LINE_SECTIONS, BEO_STATES, canTransitionBeo, type BeoState } from "@/lib/beos";

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

// ── Create BEO header ────────────────────────────────────────────────
const CreateSchema = z.object({
  event_name: z.string().min(1).max(200),
  client_id: z.string().uuid().optional().or(z.literal("")),
  project_id: z.string().uuid().optional().or(z.literal("")),
  event_date: z.string().date().optional().or(z.literal("")),
  start_time: z.string().optional().or(z.literal("")),
  end_time: z.string().optional().or(z.literal("")),
  space: z.string().max(160).optional(),
  headcount: z.coerce.number().int().min(0).max(1_000_000).optional(),
  contact_name: z.string().max(160).optional(),
  contact_email: z.string().email().optional().or(z.literal("")),
  contact_phone: z.string().max(40).optional(),
  notes: z.string().max(4000).optional(),
});

export async function createBeoAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can create BEOs" };
  const parsed = CreateSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  const supabase = await createClient();

  // Cross-tenant FK guards — a dangling client/project corrupts the pipeline.
  const clientId = parsed.data.client_id || null;
  const projectId = parsed.data.project_id || null;
  if (clientId) {
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!client) return { error: "Client not found in your organization" };
  }
  if (projectId) {
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!project) return { error: "Project not found in your organization" };
  }

  const { data, error } = await supabase
    .from("beos")
    .insert({
      org_id: session.orgId,
      beo_number: generateNumber("BEO"),
      event_name: parsed.data.event_name,
      client_id: clientId,
      project_id: projectId,
      event_date: parsed.data.event_date || null,
      start_time: parsed.data.start_time || null,
      end_time: parsed.data.end_time || null,
      space: parsed.data.space || null,
      headcount: parsed.data.headcount ?? 0,
      contact_name: parsed.data.contact_name || null,
      contact_email: parsed.data.contact_email || null,
      contact_phone: parsed.data.contact_phone || null,
      notes: parsed.data.notes || null,
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath("/console/sales/beos");
  redirect(`/console/sales/beos/${data.id}`);
}

// ── Add a line item ──────────────────────────────────────────────────
const LineSchema = z.object({
  beo_id: z.string().uuid(),
  section: z.enum(BEO_LINE_SECTIONS),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  quantity: z.coerce.number().min(0).max(1_000_000),
  unit_price: moneyDollarsString({ allowEmpty: true }),
});

export async function addBeoLineAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can edit BEOs" };
  const parsed = LineSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  const supabase = await createClient();
  // Confirm the BEO belongs to the caller's org before adding a child.
  const { data: beo } = await supabase
    .from("beos")
    .select("id")
    .eq("id", parsed.data.beo_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!beo) return { error: "BEO not found in your organization" };

  const { error } = await supabase.from("beo_line_items").insert({
    org_id: session.orgId,
    beo_id: parsed.data.beo_id,
    section: parsed.data.section,
    name: parsed.data.name,
    description: parsed.data.description || null,
    quantity: parsed.data.quantity,
    unit_price_cents: parsed.data.unit_price ? dollarsToCents(parsed.data.unit_price) : 0,
  });
  if (error) return actionFail(error.message, fd);
  revalidatePath(`/console/sales/beos/${parsed.data.beo_id}`);
  return { ok: true as const };
}

// ── Delete a line item ───────────────────────────────────────────────
export async function deleteBeoLineAction(lineId: string, beoId: string) {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can edit BEOs" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("beo_line_items")
    .delete()
    .eq("id", lineId)
    .eq("beo_id", beoId)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/sales/beos/${beoId}`);
  return { ok: true as const };
}

// ── BEO FSM transition ───────────────────────────────────────────────
export async function setBeoStateAction(id: string, next: BeoState) {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can change BEO status" };
  if (!BEO_STATES.includes(next)) return { error: "Invalid state" };
  const supabase = await createClient();

  const { data: before } = await supabase
    .from("beos")
    .select("beo_state, revision")
    .eq("org_id", session.orgId)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!before) return { error: "BEO not found" };
  const current = before.beo_state as BeoState;
  if (!canTransitionBeo(current, next)) {
    return { error: `Cannot move ${current} → ${next}` };
  }

  const patch: { beo_state: BeoState; sent_at?: string; signed_at?: string; revision?: number } = {
    beo_state: next,
  };
  if (next === "sent") patch.sent_at = new Date().toISOString();
  if (next === "signed") patch.signed_at = new Date().toISOString();
  // Re-opening for revision bumps the revision counter so re-sends are tracked.
  if (next === "revised") patch.revision = (before.revision ?? 1) + 1;

  // Conditional update on the observed state closes the TOCTOU between the
  // SELECT above and the write so concurrent transitions can't double-fire.
  const { data: updated, error } = await supabase
    .from("beos")
    .update(patch)
    .eq("org_id", session.orgId)
    .eq("id", id)
    .eq("beo_state", current)
    .select("id");
  if (error) return { error: error.message };
  if (!updated || updated.length === 0) return { error: "BEO changed concurrently — refresh and retry" };

  revalidatePath(`/console/sales/beos/${id}`);
  revalidatePath("/console/sales/beos");
  return { ok: true as const };
}
