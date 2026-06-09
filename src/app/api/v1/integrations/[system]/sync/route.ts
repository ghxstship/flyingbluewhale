import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { isAdmin, withAuth } from "@/lib/auth";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { decodeSageTokens, fetchSageVendors, fetchSageJobCostCodes } from "@/lib/accounting/sage-300-cre";
import { decodeFoundationTokens, fetchFoundationVendors, fetchFoundationCostCodes } from "@/lib/accounting/foundation";
import { decodeVistaTokens, fetchVistaVendors, fetchVistaCostCodes } from "@/lib/accounting/viewpoint-vista";
import { log } from "@/lib/log";

/**
 * POST /api/v1/integrations/[system]/sync
 *
 * Generic pull-side sync for Sage 300 CRE / Foundation / Viewpoint
 * Vista. Mirrors the QBO sync endpoint's shape so the integrations
 * console can route to the right system uniformly.
 *
 * Body: { connection_id, entities? = ['vendors','accounts'] }
 *
 * Each provider's vendor + cost-code response is normalized into the
 * same { name, email, active, code, source_meta } shape before upsert.
 */

const SystemSchema = z.enum(["sage-300-cre", "foundation", "viewpoint-vista"]);
const BodySchema = z.object({
  connection_id: z.string().uuid(),
  entities: z.array(z.enum(["vendors", "accounts"])).default(["vendors", "accounts"]),
});

export const dynamic = "force-dynamic";

const SYSTEM_KEY_MAP = {
  "sage-300-cre": "sage_300_cre",
  foundation: "foundation",
  "viewpoint-vista": "viewpoint_vista",
} as const;

export async function POST(req: Request, ctx: { params: Promise<{ system: string }> }) {
  const { system } = await ctx.params;
  const parsed = SystemSchema.safeParse(system);
  if (!parsed.success) return apiError("bad_request", "Unsupported system");
  const dbSystem = SYSTEM_KEY_MAP[parsed.data];

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
      .select("id, org_id, system, auth_ciphertext")
      .eq("id", body.connection_id)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    type Conn = { id: string; org_id: string; system: string; auth_ciphertext: string | null };
    const c = conn as Conn | null;
    if (!c) return apiError("not_found", "Connection not found");
    if (c.system !== dbSystem) return apiError("bad_request", `Connection is ${c.system}, not ${dbSystem}`);
    if (!c.auth_ciphertext) return apiError("internal", "Connection has no auth payload");

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

    type NormalizedVendor = { name: string; email: string | null; active: boolean; remote_id: string };
    type NormalizedCostCode = { code: string; name: string; remote_id: string; meta: Record<string, unknown> };

    let vendors: NormalizedVendor[] | null = null;
    let costCodes: NormalizedCostCode[] | null = null;

    try {
      if (parsed.data === "sage-300-cre") {
        const tokens = decodeSageTokens(c.auth_ciphertext);
        if ("error" in tokens) {
          errors.push(tokens.error);
        } else {
          if (body.entities.includes("vendors")) {
            const v = await fetchSageVendors(tokens);
            if (Array.isArray(v)) {
              vendors = v.map((x) => ({
                name: x.Name,
                email: x.EmailAddress ?? null,
                active: x.IsActive !== false,
                remote_id: x.VendorID,
              }));
            } else errors.push(v.error);
          }
          if (body.entities.includes("accounts")) {
            const cc = await fetchSageJobCostCodes(tokens);
            if (Array.isArray(cc)) {
              costCodes = cc.map((x) => ({
                code: x.CostCode,
                name: x.Description,
                remote_id: x.CostCode,
                meta: { category: x.Category, source: "sage_300_cre" },
              }));
            } else errors.push(cc.error);
          }
        }
      } else if (parsed.data === "foundation") {
        const tokens = decodeFoundationTokens(c.auth_ciphertext);
        if ("error" in tokens) {
          errors.push(tokens.error);
        } else {
          if (body.entities.includes("vendors")) {
            const v = await fetchFoundationVendors(tokens);
            if (Array.isArray(v)) {
              vendors = v.map((x) => ({
                name: x.name,
                email: x.email ?? null,
                active: x.active !== false,
                remote_id: x.id,
              }));
            } else errors.push(v.error);
          }
          if (body.entities.includes("accounts")) {
            const cc = await fetchFoundationCostCodes(tokens);
            if (Array.isArray(cc)) {
              costCodes = cc.map((x) => ({
                code: x.code,
                name: x.description,
                remote_id: x.id,
                meta: { source: "foundation" },
              }));
            } else errors.push(cc.error);
          }
        }
      } else if (parsed.data === "viewpoint-vista") {
        const tokens = decodeVistaTokens(c.auth_ciphertext);
        if ("error" in tokens) {
          errors.push(tokens.error);
        } else {
          if (body.entities.includes("vendors")) {
            const v = await fetchVistaVendors(tokens);
            if (Array.isArray(v)) {
              vendors = v.map((x) => ({
                name: x.Name,
                email: x.Email ?? null,
                active: x.Active !== false,
                remote_id: x.VendorCode,
              }));
            } else errors.push(v.error);
          }
          if (body.entities.includes("accounts")) {
            const cc = await fetchVistaCostCodes(tokens);
            if (Array.isArray(cc)) {
              costCodes = cc.map((x) => ({
                code: x.Phase,
                name: x.Description,
                remote_id: x.Phase,
                meta: { category: x.Category, source: "viewpoint_vista" },
              }));
            } else errors.push(cc.error);
          }
        }
      }
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }

    if (vendors) {
      for (const v of vendors) {
        const { error } = await supabase.from("vendors").upsert(
          {
            org_id: c.org_id,
            name: v.name,
            email: v.email,
            deleted_at: v.active ? null : new Date().toISOString(),
            metadata: { remote_id: v.remote_id, source: dbSystem },
          },
          { onConflict: "org_id,name" },
        );
        if (error) {
          errCount += 1;
          errors.push(`Vendor ${v.remote_id}: ${error.message}`);
        } else inCount += 1;
      }
    }

    if (costCodes) {
      for (const cc of costCodes) {
        const { error } = await supabase.from("cost_codes").upsert(
          {
            org_id: c.org_id,
            code: cc.code,
            name: cc.name,
            metadata: cc.meta,
          },
          { onConflict: "org_id,code" },
        );
        if (error) {
          errCount += 1;
          errors.push(`CostCode ${cc.remote_id}: ${error.message}`);
        } else inCount += 1;
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

    log.info("accounting.sync_complete", { system: dbSystem, count_in: inCount, error_count: errCount });
    return apiOk({ run_id: runId, system: dbSystem, count_in: inCount, error_count: errCount });
  });
}
