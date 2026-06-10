"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const PctSchema = z.object({ pct: z.string() });

/**
 * Update the % complete on a single line and recompute the line totals
 * (this period $, retention $) plus the parent application totals so the
 * header always matches the lines (SSOT — totals are derived).
 */
export async function updatePayAppLine(appId: string, lineId: string, fd: FormData): Promise<void> {
  const session = await requireSession();
  // % complete on pay-app lines drives draw-down totals — manager+ only.
  if (!isManagerPlus(session)) return;
  const parsed = PctSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  const newPct = Math.max(0, Math.min(100, Number(parsed.data.pct) || 0));
  const supabase = await createClient();

  const { data: line } = await supabase
    .from("payment_application_lines")
    .select("scheduled_value_cents, pct_complete_to_date, completed_to_date_cents")
    .eq("org_id", session.orgId)
    .eq("id", lineId)
    .maybeSingle();
  if (!line) return;

  const { data: app } = await supabase
    .from("payment_applications")
    .select("retention_pct")
    .eq("org_id", session.orgId)
    .eq("id", appId)
    .maybeSingle();
  if (!app) return;

  const scheduled = Number(line.scheduled_value_cents);
  const newCompleted = Math.round(scheduled * (newPct / 100));
  const priorCompleted = Number(line.completed_to_date_cents);
  const thisPeriod = Math.max(0, newCompleted - priorCompleted);
  const retention = Math.round(newCompleted * (Number(app.retention_pct) / 100));
  const pctThisPeriod = scheduled === 0 ? 0 : (thisPeriod / scheduled) * 100;

  const { error: lineErr } = await supabase
    .from("payment_application_lines")
    .update({
      pct_complete_to_date: newPct,
      pct_complete_this_period: pctThisPeriod,
      completed_to_date_cents: newCompleted,
      this_period_cents: thisPeriod,
      retention_cents: retention,
    } as never)
    .eq("org_id", session.orgId)
    .eq("id", lineId);
  if (lineErr) throw new Error(`Could not update pay-app line: ${lineErr.message}`);

  // Roll up totals on the parent application.
  const { data: allLines } = await supabase
    .from("payment_application_lines")
    .select("completed_to_date_cents, retention_cents, this_period_cents")
    .eq("payment_application_id", appId);
  const totals = (allLines ?? []).reduce(
    (acc, l) => ({
      completed: acc.completed + Number(l.completed_to_date_cents),
      retention: acc.retention + Number(l.retention_cents),
      thisPeriod: acc.thisPeriod + Number(l.this_period_cents),
    }),
    { completed: 0, retention: 0, thisPeriod: 0 },
  );
  const { error: totalsErr } = await supabase
    .from("payment_applications")
    .update({
      total_completed_cents: totals.completed,
      total_retention_cents: totals.retention,
      total_due_cents: totals.thisPeriod - totals.retention,
    } as never)
    .eq("org_id", session.orgId)
    .eq("id", appId);
  if (totalsErr) throw new Error(`Could not update pay-app totals: ${totalsErr.message}`);

  revalidatePath(`/console/finance/pay-apps/${appId}`);
}

type PayAppStatus = "draft" | "submitted" | "approved" | "rejected" | "paid";

// AIA G702 / pay-app FSM: draft → submitted → approved → paid (or
// rejected from submitted, which sends it back to draft for revisions).
// Rejected stays open for resubmission; paid is terminal. Without a
// guard a stale "Mark Paid" click could reset paid_at on a duplicate
// click and silently double-stamp the payment timestamp.
const PAYAPP_TRANSITIONS: Record<PayAppStatus, readonly PayAppStatus[]> = {
  draft: ["submitted"],
  submitted: ["approved", "rejected"],
  rejected: ["draft", "submitted"],
  approved: ["paid", "rejected"],
  paid: [],
};

export async function transitionPayApp(id: string, to: "submitted" | "approved" | "rejected" | "paid"): Promise<void> {
  const session = await requireSession();
  // Pay-app FSM transitions (especially → paid) move money — manager+
  // only. Without this an authenticated lower-priv user could mark a
  // pay app paid via a crafted POST.
  if (!isManagerPlus(session)) throw new Error("Only manager+ can transition pay applications");
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("payment_applications")
    .select("application_state")
    .eq("org_id", session.orgId)
    .eq("id", id)
    .maybeSingle();
  if (!row) throw new Error("Pay app not found");
  const current = (row as { application_state: PayAppStatus }).application_state;
  const allowed = PAYAPP_TRANSITIONS[current] ?? [];
  if (!allowed.includes(to)) {
    throw new Error(`Cannot move ${current} → ${to}. Allowed: ${allowed.join(", ") || "(terminal)"}`);
  }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { application_state: to };
  if (to === "submitted") patch.submitted_at = now;
  if (to === "approved") {
    patch.approved_at = now;
    patch.approved_by = session.userId;
  }
  if (to === "paid") patch.paid_at = now;
  const { data: updated, error } = await supabase
    .from("payment_applications")
    .update(patch as never)
    .eq("org_id", session.orgId)
    .eq("id", id)
    .eq("application_state", current as "draft")
    .select("id");
  if (error) throw new Error(error.message);
  if (!updated || updated.length === 0) {
    throw new Error("Pay app status changed concurrently — refresh and retry");
  }
  revalidatePath(`/console/finance/pay-apps/${id}`);
  revalidatePath("/console/finance/pay-apps");
}
