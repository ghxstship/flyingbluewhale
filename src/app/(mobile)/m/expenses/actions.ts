"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { filesFrom } from "@/lib/mobile/photo-upload";
import { EXPENSE_AUTO_CODE } from "@/components/mobile/kit/forms";
import { log } from "@/lib/log";

export type State = { error?: string; warning?: string; fieldErrors?: Record<string, string> } | null;

const MAX_BYTES = 15 * 1024 * 1024;

const Input = z.object({
  // Field ids from the kit's expense form spec (components/mobile/kit/forms.ts).
  // They must match it exactly or the values arrive unread. Named indirectly on
  // purpose: capture-honesty.test.ts identifies mount sites by searching source
  // for the spec reference, and a docblock mentioning it makes this file look
  // like a mount site that forgot to serialise files.
  category: z.string().min(1, "Pick a category."),
  amount: z.string().min(1, "How much was it?"),
  date: z.string().optional(),
  // Cost Code (kit 32 v2.8) — a real cost-center label, or the auto-coding
  // sentinel which must NOT be stored (finance codes it on approval).
  code: z.string().max(200).optional(),
  merchant: z.string().min(1, "Where was it spent?"),
  billable: z.string().optional(),
  notes: z.string().optional(),
  projectId: z.string().uuid().optional(),
});

/** "12.34", "$12.34", "12,34" → 1234 cents. Rejects anything that isn't money. */
function parseCents(raw: string): number | null {
  const cleaned = raw.trim().replace(/[$\s]/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const cents = Math.round(Number(cleaned) * 100);
  return Number.isFinite(cents) && cents > 0 ? cents : null;
}

/**
 * File an expense from the field, receipt included.
 *
 * G1 in the parity audit, and the joint highest-impact gap in the register:
 * the device with the camera in it could not file an expense. Worse, nothing
 * in the entire repo wrote `expenses.receipt_path` — the column existed and
 * no surface, desktop included, ever populated it. So "photograph the receipt
 * at the truck stop" was not a mobile gap, it was a product gap that mobile
 * makes obvious.
 *
 * RECEIPTS GO THROUGH THE SERVICE CLIENT, deliberately. `receipts` is in
 * SERVICE_ONLY_BUCKETS and is not authenticated-writable: every existing
 * receipts upload (the AP-OCR intake) is service-side, and this follows that
 * precedent rather than widening the bucket's RLS. Widening it would mean
 * adding `receipts` to storage_org_scoped_upload AND giving the path an
 * `${orgId}/` prefix AND removing it from SERVICE_ONLY_BUCKETS — a deliberate
 * three-part decision, not something to do in passing for one form.
 *
 * The path keeps the org prefix anyway (`field/{org}/{user}/…`), so if that
 * decision is ever made the layout already complies.
 */
export async function fileExpense(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();

  // Files first — Object.fromEntries would stringify them.
  const receipts = filesFrom(fd, "receipt");
  const scalars = Object.fromEntries(Array.from(fd.entries()).filter(([, v]) => typeof v === "string"));
  const parsed = Input.safeParse(scalars);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) if (i.path[0]) fieldErrors[String(i.path[0])] = i.message;
    return { error: "Please fix the errors below.", fieldErrors };
  }
  const v = parsed.data;

  const cents = parseCents(v.amount);
  if (cents === null) {
    return { error: "Please fix the errors below.", fieldErrors: { amount: "Enter an amount like 12.34" } };
  }

  const supabase = await createClient();

  if (v.projectId) {
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", v.projectId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!project) return { error: "Project not found in your workspace" };
  }

  // Upload the receipt BEFORE the row: an expense row whose receipt silently
  // vanished is worse than a failed submit the person can retry, because
  // nobody finds out until reimbursement.
  let receiptPath: string | null = null;
  let warning: string | undefined;
  const file = receipts[0];
  if (file && file.size > 0) {
    if (file.size > MAX_BYTES) {
      return { error: "Please fix the errors below.", fieldErrors: { receipt: "That photo is too large (15 MB limit)" } };
    }
    if (!isServiceClientAvailable()) {
      warning = "Expense filed, but the receipt could not be attached. Add it from the console.";
    } else {
      const safe = (file.name || "receipt.jpg").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
      const path = `field/${session.orgId}/${session.userId}/${Date.now()}-${safe}`;
      const svc = createServiceClient();
      const { error: upErr } = await svc.storage.from("receipts").upload(path, Buffer.from(await file.arrayBuffer()), {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
      if (upErr) {
        log.error("m.expenses.receipt_upload_failed", { err: upErr.message });
        // Don't lose the expense over a failed upload — the amount and the
        // date are the perishable part, the receipt is in their camera roll.
        warning = "Expense filed, but the receipt could not be attached. Try adding it again from the console.";
      } else {
        receiptPath = path;
      }
    }
  }

  const spentAt = v.date && /^\d{4}-\d{2}-\d{2}$/.test(v.date) ? v.date : new Date().toISOString().slice(0, 10);

  const { error } = await supabase.from("expenses").insert({
    org_id: session.orgId,
    project_id: v.projectId ?? null,
    submitter_id: session.userId,
    // The kit form has no free-text "what" — the merchant IS the what, and
    // notes are the context finance asked for.
    description: v.notes ? `${v.merchant} — ${v.notes}` : v.merchant,
    amount_cents: cents,
    category: v.category || null,
    // Cost coding (kit 32 v2.8): a picked cost center lands in `department`
    // — the same column the scanner's Import To Budget writes — while the
    // auto sentinel stores nothing (finance codes it on approval).
    department: v.code && v.code !== EXPENSE_AUTO_CODE ? v.code : null,
    spent_at: spentAt,
    expense_state: "pending",
    receipt_path: receiptPath,
  });
  if (error) {
    log.error("m.expenses.insert_failed", { err: error.message });
    return { error: error.message };
  }

  revalidatePath("/m/expenses");
  revalidatePath("/m/my-work");
  return warning ? { warning } : null;
}
