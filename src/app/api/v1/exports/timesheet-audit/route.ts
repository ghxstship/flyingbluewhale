import { z } from "zod";
import { apiError } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

const QUERY = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

function csvEscape(v: string | number | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function row(cols: (string | number | null | undefined)[]) {
  return cols.map(csvEscape).join(",");
}

export async function GET(req: Request) {
  const rl = await ratelimit({ key: keyFromRequest(req, "export:timesheet-audit"), ...RATE_BUDGETS.export });
  if (!rl.ok) return apiError("rate_limited", "Export rate limit reached; try again shortly");

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  const url = new URL(req.url);
  const q = QUERY.safeParse(Object.fromEntries(url.searchParams));
  const from = q.success && q.data.from ? q.data.from : undefined;
  const to = q.success && q.data.to ? q.data.to : undefined;

  const supabase = await createClient();

  let query = supabase
    .from("time_entries")
    .select(
      "id, description, user_id, project_id, started_at, ended_at, duration_minutes, billable, hourly_rate_cents, approved_at, approved_by, created_at, updated_at",
    )
    .eq("org_id", session.orgId)
    .order("started_at", { ascending: false })
    .limit(10_000);

  if (from) query = query.gte("started_at", from);
  if (to) query = query.lte("started_at", to);

  const { data, error } = await query;
  if (error) return apiError("internal", error.message);

  const header = row([
    "id",
    "description",
    "user_id",
    "project_id",
    "started_at",
    "ended_at",
    "duration_minutes",
    "billable",
    "hourly_rate_cents",
    "approved_at",
    "approved_by",
    "created_at",
    "updated_at",
  ]);

  const lines = (data ?? []).map((r) =>
    row([
      r.id,
      r.description,
      r.user_id,
      r.project_id,
      r.started_at,
      r.ended_at,
      r.duration_minutes,
      r.billable ? "TRUE" : "FALSE",
      r.hourly_rate_cents,
      r.approved_at,
      r.approved_by,
      r.created_at,
      r.updated_at,
    ]),
  );

  const csv = [header, ...lines].join("\n");
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="timesheet-audit-${stamp}.csv"`,
      "cache-control": "no-store",
    },
  });
}
