import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { isAdmin, withAuth } from "@/lib/auth";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { pullDailyRates } from "@/lib/finance/fx";
import { log } from "@/lib/log";

/**
 * POST /api/v1/integrations/fx/refresh
 *
 * Pulls a daily FX-rate snapshot from Frankfurter (ECB-backed, free,
 * no key) with fallback to exchangerate.host, then upserts into
 * public.exchange_rates keyed on (from, to, effective_at, source).
 *
 * Body: { date?: "YYYY-MM-DD", bases?: string[] }
 * - date defaults to today (UTC).
 * - bases defaults to USD/EUR/GBP/CAD/AUD/JPY/MXN.
 *
 * Org-scoped guard only — the table is global reference data, but only
 * admin/owner can trigger a pull (avoid runaway worker invocations).
 */

const BodySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  bases: z.array(z.string().regex(/^[A-Z]{3}$/)).optional(),
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return withAuth(async (session) => {
    // Enforce the admin/owner gate the doc comment promises.
    if (!isAdmin(session)) return apiError("forbidden", "Only owners and admins can trigger an FX pull");
    const body = await parseJson(req, BodySchema);
    if (body instanceof Response) return body;

    const date = body.date ?? new Date().toISOString().slice(0, 10);
    const rows = await pullDailyRates(date, body.bases);
    if (rows.length === 0) {
      return apiError("internal", "No FX rates returned. Frankfurter + exchangerate.host both failed.");
    }

    if (!isServiceClientAvailable()) {
      return apiError(
        "service_unavailable",
        "This endpoint requires SUPABASE_SERVICE_ROLE_KEY in the runtime environment.",
      );
    }
    const supabase = createServiceClient() as unknown as LooseSupabase;

    // Idempotent upsert keyed on the unique index (from, to, effective_at, source).
    const inserted: number[] = [];
    for (const r of rows) {
      const { error } = await supabase.from("exchange_rates").upsert(
        {
          from_currency: r.from_currency,
          to_currency: r.to_currency,
          effective_at: r.effective_at,
          rate: r.rate,
          source: r.source,
        },
        { onConflict: "from_currency,to_currency,effective_at,source", ignoreDuplicates: false },
      );
      if (error) {
        log.warn("fx.upsert_failed", { from: r.from_currency, to: r.to_currency, err: error.message });
      } else {
        inserted.push(1);
      }
    }

    return apiOk({ date, count: inserted.length, attempted: rows.length });
  });
}
