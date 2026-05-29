import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiOk, apiError, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";
import type { LooseSupabase } from "@/lib/supabase/loose";

const PatchSchema = z.object({ id: z.string().uuid() });

const Schema = z.object({
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  project_id: z.string().uuid().optional(),
  roles: z
    .array(z.object({ name: z.string().min(1).max(80), count: z.number().int().min(1).max(500) }))
    .min(1)
    .max(20),
});

export async function POST(req: Request) {
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:schedule"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "AI rate limit reached; try again shortly");

  if (!env.ANTHROPIC_API_KEY) return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");

  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  const supabase = (await createClient()) as unknown as LooseSupabase;

  // Fetch crew roster for context (up to 50 members)
  const { data: crew } = await supabase
    .from("crew_members")
    .select("id, name, role, availability_notes")
    .eq("org_id", session.orgId)
    .eq("is_active", true)
    .limit(50);

  const crewList = ((crew ?? []) as { id: string; name: string; role: string | null; availability_notes: string | null }[])
    .map((m) => `- ${m.name} (${m.role ?? "unassigned"})${m.availability_notes ? `: ${m.availability_notes}` : ""}`)
    .join("\n") || "No crew members on file.";

  const roleLines = input.roles.map((r) => `  • ${r.name}: ${r.count} needed`).join("\n");

  const prompt = `You are an operations scheduler for a live-events production company. Generate a practical 5-day (Mon–Fri) shift schedule for the week starting ${input.week_start}.

ROLE REQUIREMENTS:
${roleLines}

AVAILABLE CREW:
${crewList}

OUTPUT FORMAT — respond with valid JSON only, no prose:
{
  "week_start": "${input.week_start}",
  "days": [
    {
      "date": "YYYY-MM-DD",
      "day": "Monday",
      "shifts": [
        { "role": "...", "name": "...", "start": "HH:MM", "end": "HH:MM", "notes": "..." }
      ]
    }
  ],
  "warnings": ["..."],
  "coverage_pct": 95
}

Rules:
- Assign named crew from the roster above where possible; use "TBD" for gaps.
- Flag overtime risks in warnings[].
- Keep shifts 8–12 hours. Ensure at least 10h rest between shifts for the same person.
- coverage_pct = percentage of required role-slots that have a named crew member.`;

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  let scheduleJson: string;
  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });
    const block = msg.content[0];
    scheduleJson = block.type === "text" ? block.text.trim() : "{}";
    // Strip markdown code fences if Claude wrapped the JSON
    scheduleJson = scheduleJson.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Anthropic error";
    return apiError("internal", msg);
  }

  let suggestionData: unknown;
  try {
    suggestionData = JSON.parse(scheduleJson);
  } catch {
    return apiError("internal", "AI returned malformed JSON schedule");
  }

  const { data: row, error } = await supabase
    .from("ai_schedule_suggestions")
    .insert({
      org_id: session.orgId,
      project_id: input.project_id ?? null,
      week_start: input.week_start,
      prompt_context: { roles: input.roles, crew_count: (crew ?? []).length },
      suggestion_data: suggestionData,
      generation_state: "generated",
      created_by: session.userId,
    })
    .select("id, week_start, generation_state, created_at, suggestion_data")
    .single();

  if (error) return apiError("internal", error.message);
  return apiOk(row);
}

export async function PATCH(req: Request) {
  const input = await parseJson(req, PatchSchema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { error } = await supabase
    .from("ai_schedule_suggestions")
    .update({ generation_state: "applied", applied_at: new Date().toISOString() })
    .eq("id", input.id)
    .eq("org_id", session.orgId);

  if (error) return apiError("internal", error.message);
  return apiOk({ id: input.id, generation_state: "applied" });
}
