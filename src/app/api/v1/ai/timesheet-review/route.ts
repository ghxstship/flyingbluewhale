import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { record as recordUsage } from "@/lib/usage";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

const Schema = z.object({
  /** ISO date strings, inclusive range. */
  period_start: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  period_end: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  /** Narrow to one user; omit for org-wide review. */
  user_id: z.string().uuid().optional(),
});

type Anomaly = {
  user_id: string;
  entry_id: string;
  flag: string;
  severity: "low" | "medium" | "high";
  description: string;
};

export async function POST(req: Request) {
  // Timesheet review is expensive — cap at 5/min per the export budget.
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:ts-review"), ...RATE_BUDGETS.export });
  if (!rl.ok) return apiError("rate_limited", "Timesheet review rate limit reached; try again shortly");

  if (!env.ANTHROPIC_API_KEY) {
    return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");
  }

  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  const supabase = await createClient();

  let query = supabase
    .from("time_entries")
    .select("id, user_id, started_at, ended_at, duration_minutes, billable, description, activity_category")
    .eq("org_id", session.orgId)
    .gte("started_at", input.period_start)
    .lte("started_at", input.period_end)
    .order("user_id")
    .order("started_at")
    .limit(500);

  if (input.user_id) {
    query = query.eq("user_id", input.user_id);
  }

  const { data: entries, error } = await query;
  if (error) return apiError("internal", error.message);
  if (!entries || entries.length === 0) {
    return apiOk({ anomalies: [], summary: "No time entries found for this period." });
  }

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const prompt = `You are a payroll auditor reviewing time entries for anomalies before a pay period closes.

Time entries (${entries.length} rows):
${JSON.stringify(entries, null, 2)}

Identify anomalies. Look for:
1. Entries longer than 16 hours (likely clock-out missed)
2. Overlapping entries for the same user
3. Entries with no description on billable work
4. Duplicate entries (same user, same start time)
5. Entries that start/end outside 04:00–23:59 local time (potential clock error)
6. Entries on weekends or holidays if duration > 12h
7. Unusually high daily totals (> 14h in a day for same user)

Return ONLY a JSON array of anomaly objects. Each object must have:
{
  "user_id": "<uuid>",
  "entry_id": "<uuid>",
  "flag": "<short flag name>",
  "severity": "low" | "medium" | "high",
  "description": "<1 sentence explaining the issue>"
}

If no anomalies, return []. Never include any text outside the JSON array.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const u = response.usage;
  if (u) {
    void Promise.all([
      recordUsage({
        orgId: session.orgId,
        actorId: session.userId,
        metric: "ai.tokens.input",
        quantity: u.input_tokens ?? 0,
        unit: "tokens",
        metadata: { model: "claude-sonnet-4-6", type: "timesheet-review" },
      }),
      recordUsage({
        orgId: session.orgId,
        actorId: session.userId,
        metric: "ai.tokens.output",
        quantity: u.output_tokens ?? 0,
        unit: "tokens",
        metadata: { model: "claude-sonnet-4-6", type: "timesheet-review" },
      }),
    ]);
  }

  const rawText = response.content[0]?.type === "text" ? response.content[0].text : "[]";

  let anomalies: Anomaly[] = [];
  try {
    // Strip any markdown fencing the model may add despite instructions
    const cleaned = rawText.replace(/^```[a-z]*\n?/i, "").replace(/```$/m, "").trim();
    anomalies = JSON.parse(cleaned) as Anomaly[];
  } catch {
    // If parsing fails, surface the raw text so callers can debug
    return apiOk({ anomalies: [], raw: rawText, parse_error: true });
  }

  return apiOk({
    anomalies,
    entries_reviewed: entries.length,
    period: { start: input.period_start, end: input.period_end },
  });
}
