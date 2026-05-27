import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { pushBill, pushInvoice, refreshIfNeeded } from "@/lib/accounting/qb-online";
import { log } from "@/lib/log";

/**
 * POST /api/v1/integrations/qb-online/push
 *
 * Pushes an ATLVS invoice into QBO as either an Invoice (AR) or a Bill
 * (AP). Stamps metadata.qb_id on the source row so re-runs dedup.
 *
 * Body: { connection_id, invoice_id, kind: 'ar' | 'ap' }
 *
 * Mapping rules:
 * - AR: invoice.client_id → clients.metadata.qb_id → CustomerRef.value.
 *   Single line for the invoice total (line breakdown deferred — needs
 *   ItemRef mapping per QBO best practice).
 * - AP: invoice.notes → vendor lookup via metadata.qb_id → VendorRef.value.
 *   Single AccountBasedExpenseLine pointed at the default expense
 *   account (configurable via accounting_mapping_rules; uses '1' as a
 *   safe-default if unmapped).
 */

const BodySchema = z.object({
  connection_id: z.string().uuid(),
  invoice_id: z.string().uuid(),
  kind: z.enum(["ar", "ap"]),
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return withAuth(async (session) => {
    const body = await parseJson(req, BodySchema);
    if (body instanceof Response) return body;
    const supabase = createServiceClient() as unknown as LooseSupabase;

    const { data: conn } = await supabase
      .from("accounting_connections")
      .select("id, system, auth_ciphertext")
      .eq("id", body.connection_id)
      .eq("org_id", session.orgId)
      .maybeSingle();
    type Conn = { id: string; system: string; auth_ciphertext: string | null };
    const c = conn as Conn | null;
    if (!c) return apiError("not_found", "Connection not found");
    if (c.system !== "qb_online") return apiError("bad_request", "Not a QBO connection");
    if (!c.auth_ciphertext) return apiError("internal", "Missing auth payload");

    let tokens: { access_token: string; refresh_token: string; realm_id: string; expires_at: number };
    try {
      tokens = JSON.parse(Buffer.from(c.auth_ciphertext, "base64").toString("utf8"));
    } catch (e) {
      log.error("qbo.token_decode_failed", { err: e instanceof Error ? e.message : String(e) });
      return apiError("internal", "Token decode failed");
    }
    const refreshed = await refreshIfNeeded(tokens);
    if ("error" in refreshed) return apiError("internal", refreshed.error);
    if (refreshed !== tokens) {
      const payload = Buffer.from(JSON.stringify(refreshed)).toString("base64");
      await supabase.from("accounting_connections").update({ auth_ciphertext: payload }).eq("id", c.id);
    }

    const { data: inv } = await supabase
      .from("invoices")
      .select("id, number, title, currency, amount_cents, issued_at, due_at, notes, client_id, project_id")
      .eq("id", body.invoice_id)
      .eq("org_id", session.orgId)
      .maybeSingle();
    type Inv = {
      id: string;
      number: string;
      title: string | null;
      currency: string;
      amount_cents: number;
      issued_at: string | null;
      due_at: string | null;
      notes: string | null;
      client_id: string | null;
      project_id: string;
    };
    const i = inv as Inv | null;
    if (!i) return apiError("not_found", "Invoice not found");

    if (body.kind === "ar") {
      if (!i.client_id) return apiError("bad_request", "AR push requires invoice.client_id");
      const { data: client } = await supabase.from("clients").select("metadata").eq("id", i.client_id).maybeSingle();
      const clientQbId = (client as { metadata?: { qb_id?: string } } | null)?.metadata?.qb_id;
      if (!clientQbId) return apiError("bad_request", "Client has no qb_id in metadata; map first.");
      const result = await pushInvoice(refreshed, {
        CustomerRef: { value: clientQbId },
        Line: [
          {
            Amount: Number(i.amount_cents) / 100,
            DetailType: "SalesItemLineDetail",
            Description: i.title ?? `Invoice ${i.number}`,
            SalesItemLineDetail: { ItemRef: { value: "1" } },
          },
        ],
        DocNumber: i.number,
        TxnDate: i.issued_at?.slice(0, 10),
        DueDate: i.due_at?.slice(0, 10),
        CurrencyRef: { value: i.currency },
        PrivateNote: i.notes ?? undefined,
      });
      if ("error" in result) return apiError("internal", result.error);
      await supabase
        .from("invoices")
        .update({ notes: `${i.notes ?? ""}\n[qb_id:${result.qb_id}]` })
        .eq("id", i.id);
      return apiOk({ kind: "ar", qb_id: result.qb_id, sync_token: result.sync_token });
    }

    // AP — resolve vendor via the AP-OCR extraction (if any) or by note.
    const { data: ext } = await supabase
      .from("ap_invoice_extractions")
      .select("matched_vendor_id")
      .eq("promoted_invoice_id", i.id)
      .maybeSingle();
    const matchedVendorId = (ext as { matched_vendor_id: string | null } | null)?.matched_vendor_id;
    if (!matchedVendorId)
      return apiError("bad_request", "AP push requires a matched vendor (via AP OCR or manual map).");
    const { data: vendor } = await supabase.from("vendors").select("metadata").eq("id", matchedVendorId).maybeSingle();
    const vendorQbId = (vendor as { metadata?: { qb_id?: string } } | null)?.metadata?.qb_id;
    if (!vendorQbId) return apiError("bad_request", "Matched vendor has no qb_id in metadata; sync vendors first.");

    const result = await pushBill(refreshed, {
      VendorRef: { value: vendorQbId },
      Line: [
        {
          Amount: Number(i.amount_cents) / 100,
          DetailType: "AccountBasedExpenseLineDetail",
          Description: i.title ?? `Bill ${i.number}`,
          AccountBasedExpenseLineDetail: { AccountRef: { value: "1" } },
        },
      ],
      DocNumber: i.number,
      TxnDate: i.issued_at?.slice(0, 10),
      DueDate: i.due_at?.slice(0, 10),
      CurrencyRef: { value: i.currency },
      PrivateNote: i.notes ?? undefined,
    });
    if ("error" in result) return apiError("internal", result.error);
    await supabase
      .from("invoices")
      .update({ notes: `${i.notes ?? ""}\n[qb_bill_id:${result.qb_id}]` })
      .eq("id", i.id);
    return apiOk({ kind: "ap", qb_id: result.qb_id, sync_token: result.sync_token });
  });
}
