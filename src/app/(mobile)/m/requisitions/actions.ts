"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { filesFrom } from "@/lib/mobile/photo-upload";
import { sendPushBulk } from "@/lib/push/send";
import { managerUserIds } from "@/lib/db/managers";
import { log } from "@/lib/log";

export type State = { error?: string; warning?: string; fieldErrors?: Record<string, string> } | null;

const MAX_BYTES = 15 * 1024 * 1024;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Kit 31 (live-test resolution #20) — the field PO Request (the kit `po`
 * form spec; named indirectly because capture-honesty.test.ts identifies
 * mount sites by searching source for the spec reference).
 *
 * Supersedes the four-field quick requisition: the store is unchanged
 * (`requisitions`, `requisition_state` stays at its 'draft' default — the
 * approval chain is a console concern), but the row now carries the
 * structured facets finance needs to code it: vendor, qty, needed-by,
 * Auto-Code vs Manual + cost code, purpose, the pasted product link, and
 * the attached quote (receipts bucket, service-client uploaded exactly like
 * expense receipts — see fileExpense for why that bucket stays service-only).
 */
const Input = z.object({
  // kit `po` form field ids
  link: z.string().max(2000).optional(),
  item: z.string().trim().min(1, "What are you buying?").max(200),
  vendor: z.string().trim().min(1, "Who sells it?").max(160),
  qty: z.coerce.number().int().min(1).max(9999).default(1),
  amount: z.string().min(1, "Estimate the total."),
  needed: z.string().regex(DATE, "When is it needed?"),
  coding: z.enum(["Auto-Code", "Manual"]).default("Auto-Code"),
  code: z.string().max(160).optional(),
  purpose: z.string().trim().min(1, "Why is this needed?").max(2000),
  projectId: z.string().uuid().optional().or(z.literal("")),
});

/** "12.34", "$1,200" → cents. Rejects anything that isn't money. */
function parseCents(raw: string): number | null {
  const cleaned = raw.trim().replace(/[$\s,]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const cents = Math.round(Number(cleaned) * 100);
  return Number.isFinite(cents) && cents > 0 ? cents : null;
}

export async function submitPoRequest(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();

  // Files first — Object.fromEntries would stringify them.
  const quotes = filesFrom(fd, "quote");
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
    return { error: "Please fix the errors below.", fieldErrors: { amount: "Enter an amount like 120.00" } };
  }
  if (v.coding === "Manual" && !v.code) {
    return { error: "Please fix the errors below.", fieldErrors: { code: "Pick the cost code (or switch to Auto-Code)." } };
  }

  const supabase = await createClient();

  // Cross-tenant FK guard — a supplied project must belong to the caller's org.
  const projectId = v.projectId || null;
  if (projectId) {
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!project) return { error: "Project not found in your organization." };
  }

  // Manual coding: resolve "0000 · Executive" back to the cost_centers row
  // by its org-unique leading code. A stale string is an error, not a guess.
  let costCenterId: string | null = null;
  if (v.coding === "Manual" && v.code) {
    const code = v.code.split("·")[0]?.trim();
    const { data: cc } = code
      ? await supabase
          .from("cost_centers")
          .select("id")
          .eq("org_id", session.orgId)
          .eq("code", code)
          .limit(1)
          .maybeSingle()
      : { data: null };
    if (!cc) return { error: "Please fix the errors below.", fieldErrors: { code: "That cost code no longer exists." } };
    costCenterId = cc.id as string;
  }

  // Upload the quote BEFORE the row, mirroring the expense-receipt flow.
  let quotePath: string | null = null;
  let warning: string | undefined;
  const file = quotes[0];
  if (file && file.size > 0) {
    if (file.size > MAX_BYTES) {
      return { error: "Please fix the errors below.", fieldErrors: { quote: "That file is too large (15 MB limit)" } };
    }
    if (!isServiceClientAvailable()) {
      warning = "Request filed, but the quote could not be attached. Add it from the console.";
    } else {
      const safe = (file.name || "quote.jpg").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
      const path = `field/${session.orgId}/${session.userId}/po-${Date.now()}-${safe}`;
      const svc = createServiceClient();
      const { error: upErr } = await svc.storage.from("receipts").upload(path, Buffer.from(await file.arrayBuffer()), {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
      if (upErr) {
        log.error("m.requisitions.quote_upload_failed", { err: upErr.message });
        warning = "Request filed, but the quote could not be attached. Try again from the console.";
      } else {
        quotePath = path;
      }
    }
  }

  const { error } = await supabase.from("requisitions").insert({
    org_id: session.orgId,
    // RLS grant is `requester_id = auth.uid()` — a member raises requests
    // only in their own name; setting it from the session keeps that true.
    requester_id: session.userId,
    title: v.item,
    description: v.purpose,
    // The form asks for the estimated TOTAL, so this is not qty-multiplied.
    estimated_cents: cents,
    project_id: projectId,
    vendor_name: v.vendor,
    qty: v.qty,
    needed_by: v.needed,
    auto_code: v.coding === "Auto-Code",
    cost_center_id: costCenterId,
    product_url: v.link?.trim() || null,
    purpose: v.purpose,
    quote_path: quotePath,
  });
  if (error) return { error: error.message };

  // A request nobody sees is a note to self.
  const managers = await managerUserIds(session.orgId, session.userId);
  if (managers.length) {
    await sendPushBulk(managers, {
      title: "Purchase Order Requested",
      body: `${v.item} · ${v.vendor}`.slice(0, 120),
      url: "/m/requisitions",
      kind: "announcement",
      scope: "all",
      orgId: session.orgId,
    });
  }

  revalidatePath("/m/requisitions");
  if (warning) return { warning };
  redirect("/m/requisitions");
}

/**
 * The states in which the requester may still withdraw their OWN request.
 * `req_status` has no `cancelled` value, so a withdrawal removes the row —
 * which is only safe while nothing downstream has been built on it. Once a
 * request is `approved` or `converted` (it became a PO), it is procurement's
 * record, not the requester's, and the field can no longer pull it.
 */
const WITHDRAWABLE_REQ_STATES = ["draft", "submitted", "rejected"] as const;

/**
 * Withdraw my own purchase request.
 *
 * Raising one was the only thing the field could do — a request sent in error
 * (wrong item, duplicate, no longer needed) sat in the approver's queue with
 * no way for the requester to pull it back, so the fix was a message asking
 * someone else to reject it.
 *
 * Ownership AND state are pinned in the WHERE (`requester_id` matches the RLS
 * grant `requester_id = auth.uid()`), and the row is read back: a refused
 * delete returns zero rows rather than an error, so "not yours / already
 * approved" is surfaced honestly instead of as a silent success.
 */
export async function withdrawRequisition(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = z.object({ id: z.string().uuid() }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("requisitions")
    .delete()
    .eq("id", parsed.data.id)
    .eq("requester_id", session.userId)
    .in("requisition_state", [...WITHDRAWABLE_REQ_STATES])
    .select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "You can only withdraw your own request before it's approved." };
  }

  revalidatePath("/m/requisitions");
  revalidatePath("/m/my-work");
  return null;
}
