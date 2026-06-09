"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { extractApInvoice } from "@/lib/ai/extract-ap-invoice";
import { log } from "@/lib/log";
import { formFail } from "@/lib/forms/fail";

const Schema = z.object({
  file_name: z.string().max(400),
  file_base64: z.string().min(100),
  size_bytes: z.string(),
});

export type UploadState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
  success?: {
    id: string;
    confidence: number;
    vendor_name: string | null;
  };
} | null;

export async function uploadAndExtract(_: UploadState, fd: FormData): Promise<UploadState> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const sizeBytes = Number(parsed.data.size_bytes);
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > 25 * 1024 * 1024) {
    return { error: "File must be 1 byte – 25 MB" };
  }

  // Decode base64 → Uint8Array for upload + Vision input.
  let pdfBytes: Uint8Array;
  try {
    const buf = Buffer.from(parsed.data.file_base64, "base64");
    pdfBytes = new Uint8Array(buf);
  } catch {
    return { error: "Could not decode file" };
  }

  // Use the service client for storage uploads (admin scope).
  const svc = createServiceClient();
  const storagePath = `ap-invoices/${session.orgId}/${crypto.randomUUID()}-${parsed.data.file_name.replace(/[^a-z0-9.-]+/gi, "_")}`;
  const { error: upErr } = await svc.storage.from("receipts").upload(storagePath, pdfBytes, {
    contentType: "application/pdf",
    upsert: false,
  });
  if (upErr) {
    log.error("ap_ocr.upload_failed", { err: upErr.message, path: storagePath });
    return { error: `Upload failed: ${upErr.message}` };
  }

  // Insert the extraction row in 'extracting' state.
  const { data: row, error: insErr } = await supabase
    .from("ap_invoice_extractions")
    .insert({
      org_id: session.orgId,
      storage_path: storagePath,
      file_name: parsed.data.file_name,
      size_bytes: sizeBytes,
      state: "extracting",
      uploaded_by: session.userId,
    })
    .select("id")
    .single();
  if (insErr || !row) {
    log.error("ap_ocr.row_insert_failed", { err: insErr?.message });
    return { error: `Row create failed: ${insErr?.message ?? "unknown"}` };
  }
  const extractionId = (row as { id: string }).id;

  // Call Anthropic Vision.
  const result = await extractApInvoice(pdfBytes);
  if ("error" in result) {
    const { error: failErr } = await supabase
      .from("ap_invoice_extractions")
      .update({ state: "failed", error_message: result.error })
      .eq("id", extractionId)
      .eq("org_id", session.orgId);
    if (failErr) return { error: failErr.message };
    return { error: result.error };
  }

  // Decide state: high confidence → 'extracted', low confidence → 'review'.
  const state = result.confidence >= 0.85 ? "extracted" : "review";

  // Best-effort vendor match by name.
  let matchedVendorId: string | null = null;
  if (result.vendor_name) {
    const { data: v } = await supabase
      .from("vendors")
      .select("id")
      .eq("org_id", session.orgId)
      .ilike("name", `%${result.vendor_name.slice(0, 60)}%`)
      .limit(1)
      .maybeSingle();
    matchedVendorId = (v as { id: string } | null)?.id ?? null;
  }

  // PO match by number.
  let matchedPoId: string | null = null;
  if (result.po_number) {
    const { data: po } = await supabase
      .from("purchase_orders")
      .select("id")
      .eq("org_id", session.orgId)
      .eq("number", result.po_number)
      .limit(1)
      .maybeSingle();
    matchedPoId = (po as { id: string } | null)?.id ?? null;
  }

  const { error: updErr } = await supabase
    .from("ap_invoice_extractions")
    .update({
      state,
      vendor_name: result.vendor_name,
      vendor_tax_id: result.vendor_tax_id,
      invoice_number: result.invoice_number,
      invoice_date: result.invoice_date,
      due_date: result.due_date,
      total_amount_cents: result.total_amount_cents,
      tax_amount_cents: result.tax_amount_cents,
      currency: result.currency,
      po_number: result.po_number,
      line_items: result.line_items,
      confidence: result.confidence,
      model_version: result.model_version,
      raw_response: result.raw,
      matched_vendor_id: matchedVendorId,
      matched_purchase_order_id: matchedPoId,
      extracted_at: new Date().toISOString(),
    })
    .eq("id", extractionId)
    .eq("org_id", session.orgId);
  if (updErr) return { error: updErr.message };

  revalidatePath("/console/finance/ap-ocr");
  return {
    success: {
      id: extractionId,
      confidence: result.confidence,
      vendor_name: result.vendor_name,
    },
  };
}

const PromoteSchema = z.object({ extraction_id: z.string().uuid() });

export async function promoteExtractionToInvoice(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = PromoteSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { data: ex } = await supabase
    .from("ap_invoice_extractions")
    .select(
      "id, state, vendor_name, invoice_number, total_amount_cents, currency, invoice_date, due_date, matched_vendor_id, matched_purchase_order_id, line_items",
    )
    .eq("id", parsed.data.extraction_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!ex) return;
  type ExRow = {
    id: string;
    state: string;
    vendor_name: string | null;
    invoice_number: string | null;
    total_amount_cents: number | null;
    currency: string | null;
    invoice_date: string | null;
    due_date: string | null;
    matched_vendor_id: string | null;
    matched_purchase_order_id: string | null;
    line_items: Array<{ description: string; quantity: number; unit_price_cents: number }>;
  };
  const e = ex as ExRow;

  if (e.state !== "extracted" && e.state !== "review" && e.state !== "matched") return;

  // Create invoice row.
  const { data: invRow, error: invErr } = await supabase
    .from("invoices")
    .insert({
      org_id: session.orgId,
      number: e.invoice_number ?? `AP-${e.id.slice(0, 8)}`,
      title: e.vendor_name ? `Invoice from ${e.vendor_name}` : "AP Invoice (OCR)",
      currency: e.currency ?? "USD",
      amount_cents: e.total_amount_cents ?? 0,
      status: "issued",
      issued_at: e.invoice_date ?? new Date().toISOString().slice(0, 10),
      due_at: e.due_date,
      notes: `Auto-extracted from AP OCR (extraction ${e.id})`,
    })
    .select("id")
    .single();
  if (invErr || !invRow) {
    log.error("ap_ocr.invoice_create_failed", { err: invErr?.message });
    return;
  }
  const invoiceId = (invRow as { id: string }).id;

  // Insert line items.
  for (const [i, l] of e.line_items.entries()) {
    const { error: lineErr } = await supabase.from("invoice_line_items").insert({
      org_id: session.orgId,
      invoice_id: invoiceId,
      description: l.description,
      quantity: l.quantity,
      unit_price_cents: l.unit_price_cents,
      position: i,
    });
    if (lineErr) throw new Error(`Could not create invoice line item: ${lineErr.message}`);
  }

  const { error: promoteErr } = await supabase
    .from("ap_invoice_extractions")
    .update({
      state: "promoted",
      promoted_invoice_id: invoiceId,
      promoted_at: new Date().toISOString(),
    })
    .eq("id", e.id)
    .eq("org_id", session.orgId);
  if (promoteErr) throw new Error(`Could not mark extraction promoted: ${promoteErr.message}`);

  revalidatePath("/console/finance/ap-ocr");
  redirect(`/console/finance/invoices/${invoiceId}`);
}
