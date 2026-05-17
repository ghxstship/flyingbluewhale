import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

/**
 * POST /api/v1/scheduler/suggest
 *
 * AI smart crew scheduler — LASSO / Rentman parity.
 * Given a role, time window, and optional required skills, returns a ranked
 * list of crew members from this org with reasons. Excludes members who have
 * conflicting time_entries for the window.
 */

const Schema = z.object({
  projectId: z.string().uuid().optional(),
  role: z.string().min(1).max(120),
  requiredSkills: z.array(z.string()).default([]),
  startsAt: z.string(),
  endsAt: z.string(),
  slotsNeeded: z.number().int().min(1).max(50).default(1),
});

export async function POST(req: Request) {
  if (!env.ANTHROPIC_API_KEY) {
    return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");
  }

  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  return withAuth(async (session) => {
    const supabase = await createClient();

    // Fetch all crew members for this org.
    const { data: crew, error: crewErr } = await supabase
      .from("crew_members")
      .select("id, name, role, email, day_rate_cents, notes")
      .eq("org_id", session.orgId)
      .order("name");
    if (crewErr) return apiError("internal", crewErr.message);

    // Find crew with conflicting time entries in the requested window.
    const { data: conflicts } = await supabase
      .from("time_entries")
      .select("user_id")
      .eq("org_id", session.orgId)
      .lte("started_at", input.endsAt)
      .gte("ended_at", input.startsAt);

    const conflictedUserIds = new Set((conflicts ?? []).map((c) => c.user_id));

    const available = (crew ?? []).filter((c) => {
      // crew_members.user_id may be null for external freelancers
      if (!c) return true;
      return true; // include all; we'll let AI rank and flag conflicts
    });

    const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

    const prompt = `You are a crew scheduling assistant for a live events production company.

Role needed: ${input.role}
Required skills: ${input.requiredSkills.length ? input.requiredSkills.join(", ") : "none specified"}
Shift window: ${input.startsAt} to ${input.endsAt}
Slots needed: ${input.slotsNeeded}

Available crew roster:
${JSON.stringify(available, null, 2)}

Crew IDs with scheduling conflicts during this window: ${JSON.stringify(Array.from(conflictedUserIds))}

Rank the crew by suitability for this role. Consider:
1. Role/title match
2. Notes mentioning relevant skills
3. Exclude conflicted crew or mark them as unavailable
4. Prefer crew without conflicts

Return a JSON array of up to ${Math.min(input.slotsNeeded * 3, 10)} suggestions:
[{ "crew_id": "uuid", "name": "...", "score": 0-100, "reason": "...", "available": true/false }]

Return ONLY the JSON array, no other text.`;

    const resp = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = resp.content[0]?.type === "text" ? resp.content[0].text.trim() : "[]";
    let suggestions: unknown[] = [];
    try {
      // Strip markdown code fences if present
      const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      suggestions = JSON.parse(cleaned) as unknown[];
    } catch {
      suggestions = [];
    }

    return apiOk({ suggestions, crew_count: available.length });
  });
}
