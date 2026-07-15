import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiCreated, apiError, apiOk, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

/**
 * /api/v1/pay-periods — the org's pay calendar.
 *
 * A period is the unit a timesheet is compiled for, so nothing downstream
 * (compile, submit, approve, post, export) can happen until one exists.
 *
 * Admin band: managers approve hours, they do not decide which week those
 * hours belong to.
 */

const PostSchema = z
  .object({
    periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .refine((v) => v.periodEnd >= v.periodStart, {
    message: "The period can't end before it starts.",
    path: ["periodEnd"],
  });

export async function GET(req: NextRequest) {
  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    // Any member may read the calendar — a worker needs to know which week
    // they're submitting for.
    const denial = assertCapability(session, "time:read");
    if (denial) return denial;

    const url = new URL(req.url);
    const db = (await createClient()) as unknown as LooseSupabase;
    let q = db
      .from("pay_periods")
      .select("id, period_start, period_end, period_state, created_at")
      .eq("org_id", session.orgId)
      .order("period_start", { ascending: false })
      .limit(100);
    const state = url.searchParams.get("state");
    if (state) q = q.eq("period_state", state);

    const { data, error } = await q;
    if (error) return apiError("internal", error.message);
    return apiOk({ payPeriods: data ?? [] });
  });
}

export async function POST(req: NextRequest) {
  const input = await parseJson(req, PostSchema);
  if (input instanceof Response) return input;

  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const denial = assertCapability(session, "payroll:post");
    if (denial) return denial;

    const db = (await createClient()) as unknown as LooseSupabase;
    const { data, error } = await db
      .from("pay_periods")
      .insert({
        org_id: session.orgId,
        period_start: input.periodStart,
        period_end: input.periodEnd,
      })
      .select("id, period_start, period_end, period_state, created_at")
      .single();

    if (error) {
      // UNIQUE (org_id, period_start, period_end) — the same window twice
      // would give a worker two sheets for one week.
      if (error.code === "23505") {
        return apiError("conflict", "That pay period already exists.");
      }
      return apiError("internal", error.message);
    }
    return apiCreated({ payPeriod: data });
  });
}
