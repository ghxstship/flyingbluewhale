"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { dollarsToCents } from "@/lib/format";
import type { FormState } from "@/components/FormShell";

/**
 * C-08 — in-portal vendor invoice submission.
 *
 * External vendors sit in the member RLS band, which can't INSERT into
 * `invoices` (owner/admin/controller/collaborator/manager only), so the
 * write goes through the service client after strict app-side validation:
 * the caller must hold a session in the slug's org, the PO (if referenced)
 * must belong to that org, and the row is stamped `source='ap_sub'` (the
 * merged sub-invoice payable facet), `invoice_state='submitted'`, and
 * `created_by=<caller>` so the vendor list and the AP review queue both
 * see it. Receipts upload to the `receipts` bucket; the storage path is
 * appended to the invoice notes for the reviewer.
 */

const Schema = z.object({
  slug: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  amount: z.string().trim().min(1),
  poId: z.union([z.literal(""), z.string().uuid()]).optional(),
  note: z.string().trim().max(2000).optional(),
});

const MAX_UPLOAD_BYTES = 900_000; // stay under the server-action body limit
const ALLOWED_UPLOAD_TYPES = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);

export async function submitVendorInvoice(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await requireSession();
  const parsed = Schema.safeParse({
    slug: fd.get("slug"),
    title: fd.get("title"),
    amount: fd.get("amount"),
    poId: fd.get("poId") ?? "",
    note: fd.get("note") ?? "",
  });
  if (!parsed.success) {
    return { error: "Check the highlighted fields and try again." };
  }
  const { slug, title, amount, poId, note } = parsed.data;

  const amountCents = dollarsToCents(amount);
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return { error: "Enter an amount greater than zero.", fieldErrors: { amount: "Enter an amount above zero." } };
  }

  const project = await projectIdFromSlug(slug);
  if (!project) return { error: "This portal's project could not be found." };
  if (project.org_id !== session.orgId) {
    return { error: "Your account isn't linked to this organization. Message your account manager." };
  }
  if (!isServiceClientAvailable()) {
    return { error: "Invoice submission is temporarily unavailable. Message your account manager instead." };
  }

  const svc = createServiceClient();

  // PO reference must belong to this org (the select the vendor picked from
  // is RLS-scoped, but never trust the posted id).
  let purchaseOrderId: string | null = null;
  if (poId) {
    const { data: po } = await svc
      .from("purchase_orders")
      .select("id")
      .eq("id", poId)
      .eq("org_id", project.org_id)
      .is("deleted_at", null)
      .maybeSingle();
    if (!po) return { error: "That purchase order could not be found. Pick it again." };
    purchaseOrderId = po.id;
  }

  const invoiceId = randomUUID();

  // Optional receipt/backup upload → receipts bucket.
  let receiptPath: string | null = null;
  const file = fd.get("receipt");
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_UPLOAD_BYTES) {
      return { error: "That file is too large. Attach a PDF or image under 900 KB." };
    }
    if (file.type && !ALLOWED_UPLOAD_TYPES.has(file.type)) {
      return { error: "Attach a PDF or image (PNG, JPG, WEBP)." };
    }
    const safeName = (file.name || "receipt").replace(/[^\w.-]+/g, "_").slice(0, 80);
    receiptPath = `vendor-invoices/${project.org_id}/${invoiceId}/${safeName}`;
    const { error: uploadError } = await svc.storage.from("receipts").upload(receiptPath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (uploadError) {
      return { error: "We couldn't attach that file. Try again, or submit without it." };
    }
  }

  const number = `VI-${invoiceId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
  const notes =
    [note || null, receiptPath ? `Attachment: ${receiptPath}` : null].filter(Boolean).join("\n") || null;

  const { error: insertError } = await svc.from("invoices").insert({
    id: invoiceId,
    org_id: project.org_id,
    project_id: project.id,
    number,
    title,
    amount_cents: amountCents,
    currency: "USD",
    invoice_state: "submitted",
    source: "ap_sub",
    purchase_order_id: purchaseOrderId,
    issued_at: new Date().toISOString().slice(0, 10),
    notes,
    created_by: session.userId,
  });
  if (insertError) {
    return { error: "We couldn't submit the invoice. Try again, or message your account manager." };
  }

  revalidatePath(`/p/${slug}/vendor/invoices`);
  return { ok: true };
}
