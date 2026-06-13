import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiOk, apiError, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

const Schema = z.object({
  dailyLogId: z.string().uuid(),
});

export async function POST(req: Request) {
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:summarize"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "AI rate limit reached; try again shortly");
  if (!env.ANTHROPIC_API_KEY) return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");

  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;
  const supabase = await createClient();

  const { data: log } = await supabase
    .from("daily_logs")
    .select("*, project:project_id(name)")
    .eq("id", input.dailyLogId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!log) return apiError("not_found", "Daily log not found");

  const [{ data: manpower }, { data: equipment }, { data: deliveries }, { data: visitors }] = await Promise.all([
    supabase
      .from("daily_log_manpower")
      .select("trade, headcount, hours_worked, notes")
      .eq("daily_log_id", input.dailyLogId),
    supabase.from("daily_log_equipment").select("name").eq("daily_log_id", input.dailyLogId),
    supabase
      .from("daily_log_deliveries")
      .select("description, vendor")
      .eq("daily_log_id", input.dailyLogId),
    supabase
      .from("daily_log_visitors")
      .select("name, company, purpose")
      .eq("daily_log_id", input.dailyLogId),
  ]);

  const totalHeadcount = (manpower ?? []).reduce((s, m) => s + (m.headcount ?? 0), 0);
  const totalHours = (manpower ?? []).reduce((s, m) => s + Number(m.hours_worked ?? 0), 0);
  const projectName = (log.project as { name: string | null } | null)?.name ?? "Unknown project";
  const tradeLines = (manpower ?? [])
    .map((m) => `${m.trade}: ${m.headcount} ppl · ${Number(m.hours_worked).toFixed(1)} hrs${m.notes ? ` — ${m.notes}` : ""}`)
    .join("; ") || "None recorded";

  const prompt = [
    "Write a 2–4 sentence executive summary of this daily site log for a project manager's report.",
    "Lead with the most significant activity. Be precise with numbers. Surface any issues or delays if the narrative mentions them.",
    "Do not invent details not present in the data. Use plain, professional language.",
    "",
    `Date: ${log.log_date}`,
    `Project: ${projectName}`,
    `Weather: ${log.weather_summary ?? "Not recorded"} · High ${log.weather_temp_high_f ?? "—"}°F / Low ${log.weather_temp_low_f ?? "—"}°F`,
    `Site narrative: ${log.notes ?? "None"}`,
    `Manpower: ${totalHeadcount} workers · ${totalHours.toFixed(1)} hrs total`,
    `Trades: ${tradeLines}`,
    `Deliveries (${(deliveries ?? []).length}): ${(deliveries ?? []).map((d) => [d.vendor, d.description].filter(Boolean).join(" – ")).join("; ") || "None"}`,
    `Visitors (${(visitors ?? []).length}): ${(visitors ?? []).map((v) => [v.name, v.company].filter(Boolean).join(", ")).join("; ") || "None"}`,
    `Equipment entries: ${(equipment ?? []).length}`,
  ].join("\n");

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const summary = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  return apiOk({ summary });
}
