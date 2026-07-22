"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { extractApInvoice } from "@/lib/ai/extract-ap-invoice";
import { log } from "@/lib/log";

/**
 * Scanner-mode server actions (kit 31, live-test resolutions #21/#22).
 *
 * `parseScanCapture` — an invoice/receipt capture (client-assembled 1-page
 * PDF) is stored in the `receipts` bucket (service client, mirroring the
 * fileExpense precedent) and run through the REAL AP-OCR extractor
 * (`extractApInvoice`, Anthropic Vision — the same pipeline as
 * /studio/finance/ap-ocr). The parsed vendor/amount/date come back as a
 * DRAFT the user confirms — never silently written. Cost-code suggestion is
 * evidence-based: the most recent coded expense from the same vendor. When
 * extraction is unavailable (no key, low-quality capture) the draft returns
 * `parsed: false` with empty fields and the user types them — the capture
 * itself is still stored.
 *
 * `importScanToBudget` — writes the REAL spend record: a new `expenses` row
 * (receipt: any member, own submission; invoice: manager band, matching the
 * kit's `approve` gate) or codes an existing uncoded expense (manager band).
 */

export type ScanDraft = {
  error?: string;
  parsed?: boolean;
  vendor?: string | null;
  amount?: string | null;
  date?: string | null;
  suggestedCode?: string | null;
  receiptPath?: string | null;
  confidence?: number | null;
};

const ParseInput = z.object({
  kind: z.enum(["invoice", "receipt"]),
  file_base64: z.string().min(100),
});

const MAX_BYTES = 20 * 1024 * 1024;

export async function parseScanCapture(fd: FormData): Promise<ScanDraft> {
  const session = await requireSession();
  const parsed = ParseInput.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Bad capture payload." };
  if (parsed.data.kind === "invoice" && !isManagerPlus(session)) {
    return { error: "Invoice capture is a manager action." };
  }

  let pdfBytes: Uint8Array;
  try {
    pdfBytes = new Uint8Array(Buffer.from(parsed.data.file_base64, "base64"));
  } catch {
    return { error: "Could not decode the capture." };
  }
  if (pdfBytes.length === 0 || pdfBytes.length > MAX_BYTES) {
    return { error: "Capture must be under 20 MB." };
  }

  // Store the capture first — the evidence outlives a failed parse.
  let receiptPath: string | null = null;
  if (isServiceClientAvailable()) {
    const path = `field-scans/${session.orgId}/${session.userId}/${Date.now()}-${parsed.data.kind}.pdf`;
    const svc = createServiceClient();
    const { error: upErr } = await svc.storage.from("receipts").upload(path, Buffer.from(pdfBytes), {
      contentType: "application/pdf",
      upsert: false,
    });
    if (upErr) log.error("m.scan.capture_upload_failed", { err: upErr.message });
    else receiptPath = path;
  }

  const result = await extractApInvoice(pdfBytes);
  if ("error" in result) {
    // Honest no-parse: capture stored, fields stay manual.
    return { parsed: false, vendor: null, amount: null, date: null, suggestedCode: null, receiptPath };
  }

  // Evidence-based cost-code suggestion: the most recent CODED expense from
  // the same vendor. No history → no suggestion (manual coding).
  let suggestedCode: string | null = null;
  if (result.vendor_name) {
    const supabase = await createClient();
    const { data: prior } = await supabase
      .from("expenses")
      .select("department")
      .eq("org_id", session.orgId)
      .not("department", "is", null)
      .ilike("vendor", `%${result.vendor_name.slice(0, 60)}%`)
      .order("spent_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    suggestedCode = (prior as { department: string | null } | null)?.department ?? null;
  }

  return {
    parsed: true,
    vendor: result.vendor_name,
    amount: result.total_amount_cents != null ? (result.total_amount_cents / 100).toFixed(2) : null,
    date: result.invoice_date,
    suggestedCode,
    receiptPath,
    confidence: result.confidence,
  };
}

const ImportInput = z.object({
  kind: z.enum(["invoice", "receipt"]),
  vendor: z.string().min(1, "Vendor is required.").max(200),
  amount: z.string().min(1, "Amount is required."),
  date: z.string().optional(),
  code: z.string().max(200).optional(),
  receiptPath: z.string().max(400).optional(),
  expenseId: z.string().uuid().optional(),
});

export type ImportResult = { error?: string; fieldErrors?: Record<string, string> } | null;

/** "12.34", "$1,234.56" → cents. */
function parseCents(raw: string): number | null {
  const cleaned = raw.trim().replace(/[$\s,]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const cents = Math.round(Number(cleaned) * 100);
  return Number.isFinite(cents) && cents > 0 ? cents : null;
}

export async function importScanToBudget(fd: FormData): Promise<ImportResult> {
  const session = await requireSession();
  const scalars = Object.fromEntries(Array.from(fd.entries()).filter(([, v]) => typeof v === "string"));
  const parsed = ImportInput.safeParse(scalars);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) if (i.path[0]) fieldErrors[String(i.path[0])] = i.message;
    return { error: "Please fix the errors below.", fieldErrors };
  }
  const v = parsed.data;
  const manager = isManagerPlus(session);

  // The receipt path round-trips through the client between parse and import.
  // Only accept the shape THIS flow produces, pinned to the caller's own
  // org+user prefix — otherwise a crafted path could point the expense record
  // at another tenant's stored evidence.
  if (v.receiptPath && !v.receiptPath.startsWith(`field-scans/${session.orgId}/${session.userId}/`)) {
    return { error: "Invalid capture reference. Rescan the page." };
  }

  const supabase = await createClient();

  // Coding an EXISTING uncoded expense (the Finance "Code It" flow) — a
  // finance act, manager band.
  if (v.expenseId) {
    if (!manager) return { error: "Coding spend is a manager action." };
    if (!v.code) return { error: "Please fix the errors below.", fieldErrors: { code: "Pick a cost code." } };
    const { error } = await supabase
      .from("expenses")
      .update({ department: v.code })
      .eq("id", v.expenseId)
      .eq("org_id", session.orgId);
    if (error) return { error: error.message };
    revalidatePath("/m/finance");
    return null;
  }

  if (v.kind === "invoice" && !manager) return { error: "Invoice import is a manager action." };

  const cents = parseCents(v.amount);
  if (cents === null) {
    return { error: "Please fix the errors below.", fieldErrors: { amount: "Enter an amount like 12.34" } };
  }
  const spentAt = v.date && /^\d{4}-\d{2}-\d{2}$/.test(v.date) ? v.date : new Date().toISOString().slice(0, 10);

  const { error } = await supabase.from("expenses").insert({
    org_id: session.orgId,
    submitter_id: session.userId,
    description:
      v.kind === "invoice" ? `Scanned invoice · ${v.vendor}` : `Scanned receipt · ${v.vendor}`,
    vendor: v.vendor,
    amount_cents: cents,
    spent_at: spentAt,
    expense_type: v.kind,
    department: v.code || null,
    expense_state: "pending",
    receipt_path: v.receiptPath || null,
  });
  if (error) {
    log.error("m.scan.import_failed", { err: error.message });
    return { error: error.message };
  }

  revalidatePath("/m/finance");
  revalidatePath("/m/expenses");
  return null;
}
