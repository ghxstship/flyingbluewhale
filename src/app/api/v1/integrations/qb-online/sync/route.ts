import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { isAdmin, withAuth } from "@/lib/auth";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { fetchVendors, fetchAccounts, refreshIfNeeded } from "@/lib/accounting/qb-online";
import { openTokens, sealTokens } from "@/lib/integrations/token-vault";
import { log } from "@/lib/log";

/**
 * POST /api/v1/integrations/qb-online/sync
 *
 * Pulls QBO Vendors + Accounts and upserts into the corresponding
 * ATLVS tables (vendors, cost_codes). Writes an accounting_sync_runs
 * audit row.
 *
 * Body: { connection_id, entities? = ['vendors','accounts'] }
 */

const BodySchema = z.object({
  connection_id: z.string().uuid(),
  entities: z.array(z.enum(["vendors", "accounts"])).default(["vendors", "accounts"]),
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return withAuth(async (session) => {
    // Accounting pulls upsert vendors/cost_codes via the service role —
    // restrict to owner/admin, not every org member.
    if (!isAdmin(session)) return apiError("forbidden", "Only owners and admins can run accounting syncs");
    const body = await parseJson(req, BodySchema);
    if (body instanceof Response) return body;
    if (!isServiceClientAvailable()) {
      return apiError(
        "service_unavailable",
        "This endpoint requires SUPABASE_SERVICE_ROLE_KEY in the runtime environment.",
      );
    }
    const supabase = createServiceClient() as unknown as LooseSupabase;

    const { data: conn } = await supabase
      .from("accounting_connections")
      .select("id, org_id, system, tenant_id, auth_ciphertext, connection_state")
      .eq("id", body.connection_id)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    type Conn = {
      id: string;
      org_id: string;
      system: string;
      tenant_id: string;
      auth_ciphertext: string | null;
      connection_state: string;
    };
    const c = conn as Conn | null;
    if (!c) return apiError("not_found", "Connection not found");
    if (c.system !== "qb_online") return apiError("bad_request", "Connection is not QuickBooks Online");
    if (!c.auth_ciphertext) return apiError("internal", "Connection has no auth payload");

    type QboTokens = { access_token: string; refresh_token: string; realm_id: string; expires_at: number };
    const tokens = openTokens<QboTokens>(c.auth_ciphertext);
    if (!tokens) {
      log.error("qbo.token_decode_failed", { connection_id: c.id });
      return apiError("internal", "Could not decode connection tokens");
    }

    const refreshed = await refreshIfNeeded(tokens);
    if ("error" in refreshed) return apiError("internal", refreshed.error);
    if (refreshed !== tokens) {
      // Re-seal on refresh — this is also how legacy base64 rows migrate
      // to the AES-GCM vault format without a data migration.
      const sealed = sealTokens(refreshed);
      await supabase
        .from("accounting_connections")
        .update({ auth_ciphertext: sealed.ciphertext, auth_key_ref: sealed.keyRef })
        .eq("id", c.id);
    }

    // Audit row for this sync.
    const { data: runRow } = await supabase
      .from("accounting_sync_runs")
      .insert({
        org_id: c.org_id,
        connection_id: c.id,
        entity_type: body.entities.join(","),
        direction: "pull",
        run_state: "running",
        triggered_by: session.userId,
      })
      .select("id")
      .single();
    const runId = (runRow as { id: string } | null)?.id;

    let inCount = 0;
    let errCount = 0;
    const errors: string[] = [];

    if (body.entities.includes("vendors")) {
      const result = await fetchVendors(refreshed);
      if (Array.isArray(result)) {
        for (const v of result) {
          const { error } = await supabase.from("vendors").upsert(
            {
              org_id: c.org_id,
              name: v.DisplayName,
              email: v.PrimaryEmailAddr?.Address ?? null,
              deleted_at: v.Active === false ? new Date().toISOString() : null,
              metadata: { qb_id: v.Id },
            },
            { onConflict: "org_id,name" },
          );
          if (error) {
            errCount += 1;
            errors.push(`Vendor ${v.Id}: ${error.message}`);
          } else inCount += 1;
        }
      } else {
        errors.push(result.error);
      }
    }

    if (body.entities.includes("accounts")) {
      const result = await fetchAccounts(refreshed);
      if (Array.isArray(result)) {
        for (const a of result) {
          if (!["Expense", "CostOfGoodsSold", "OtherCurrentLiability"].includes(a.AccountType)) continue;
          const { error } = await supabase.from("cost_codes").upsert(
            {
              org_id: c.org_id,
              code: a.AcctNum ?? a.Id,
              name: a.Name,
              metadata: { qb_account_type: a.AccountType, qb_id: a.Id },
            },
            { onConflict: "org_id,code" },
          );
          if (error) {
            errCount += 1;
            errors.push(`Account ${a.Id}: ${error.message}`);
          } else inCount += 1;
        }
      } else {
        errors.push(result.error);
      }
    }

    if (runId) {
      await supabase
        .from("accounting_sync_runs")
        .update({
          run_state: errCount > 0 && inCount === 0 ? "failed" : "succeeded",
          finished_at: new Date().toISOString(),
          count_in: inCount,
          error_count: errCount,
          error_summary: errors.length > 0 ? errors.slice(0, 10).join("\n") : null,
        })
        .eq("id", runId);
    }

    await supabase.from("accounting_connections").update({ last_sync_at: new Date().toISOString() }).eq("id", c.id);

    return apiOk({ run_id: runId, count_in: inCount, error_count: errCount });
  });
}
