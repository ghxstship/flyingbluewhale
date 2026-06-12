import { z } from "zod";
import { apiOk, apiCreated, apiError, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const CreateSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  condition_json: z.object({
    kind: z.enum([
      "crew_coverage_gap",
      "credential_expiry",
      "budget_overrun",
      "assignment_unconfirmed",
      "shift_unfilled",
      "induction_expired",
      "asset_unavailable",
      "invoice_overdue",
    ]),
    threshold_pct: z.number().min(0).max(100).optional(),
    lead_days: z.number().min(1).max(365).optional(),
  }),
  scope_json: z.record(z.unknown()).default({ all: true }),
  cadence: z.enum(["realtime", "hourly", "daily", "weekly"]).default("daily"),
  notify_user_ids: z.array(z.string().uuid()).default([]),
});

export async function GET(_req: Request) {
  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ai_alert_rules")
    .select("*")
    .eq("org_id", session.orgId)
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) return apiError("internal", error.message);
  return apiOk(data ?? []);
}

export async function POST(req: Request) {
  const input = await parseJson(req, CreateSchema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  if (!["owner", "admin", "manager"].includes(session.role ?? "")) {
    return apiError("forbidden", "Manager role required to create alert rules");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_alert_rules")
    .insert({
      org_id: session.orgId,
      created_by: session.userId,
      name: input.name,
      description: input.description ?? null,
      condition_json: input.condition_json,
      scope_json: input.scope_json,
      cadence: input.cadence,
      notify_user_ids: input.notify_user_ids,
    })
    .select()
    .single();

  if (error) return apiError("internal", error.message);
  return apiCreated(data);
}
