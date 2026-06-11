import Anthropic from "@anthropic-ai/sdk";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

/** POST /api/v1/ai/schedule
 *
 * AI-powered shift auto-scheduler — Connecteam + Ubeya parity.
 *
 * Accepts a list of open (unfilled) shifts and available crew members for
 * an org, then asks Claude to produce an optimized assignment plan that
 * respects skills, availability windows, and overtime eligibility.
 *
 * The response is a structured JSON suggestion list — the caller renders
 * it for admin confirmation before any DB writes. This endpoint never
 * mutates shifts directly (no "apply" side-effect). */

const ShiftInput = z.object({
  id: z.string(),
  starts_at: z.string(),
  ends_at: z.string(),
  role: z.string().nullable().optional(),
  venue_name: z.string().nullable().optional(),
  required_skills: z.array(z.string()).default([]),
});

const CrewInput = z.object({
  id: z.string(),
  full_name: z.string(),
  role: z.string().nullable().optional(),
  skills: z.array(z.string()).default([]),
  overtime_eligible: z.boolean().default(true),
  // ISO date-time windows when the person is available (admin-supplied
  // or derived from availability_slots); absent = assume always available.
  available_windows: z
    .array(z.object({ from: z.string(), to: z.string() }))
    .default([]),
});

const PostSchema = z.object({
  shifts: z.array(ShiftInput).min(1).max(200),
  crew: z.array(CrewInput).min(1).max(500),
});

type Assignment = {
  shift_id: string;
  crew_member_id: string;
  crew_member_name: string;
  reason: string;
  confidence: "high" | "medium" | "low";
};

type ScheduleResult = {
  assignments: Assignment[];
  unassigned_shift_ids: string[];
  notes: string;
};

export async function POST(req: NextRequest) {
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:schedule"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "AI rate limit reached; try again shortly");

  if (!env.ANTHROPIC_API_KEY) {
    return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");
  }

  const input = await parseJson(req, PostSchema);
  if (input instanceof Response) return input;

  return withAuth(async (session) => {
    const supabase = await createClient();

    // Org guard — verify the requesting user belongs to the org whose
    // shift/crew data they're scheduling. This prevents cross-tenant leakage
    // even though the route doesn't take an explicit org_id param (we derive
    // it from the session).
    const { data: member } = await supabase
      .from("memberships")
      .select("id")
      .eq("org_id", session.orgId)
      .eq("user_id", session.userId)
      .maybeSingle();
    if (!member) return apiError("forbidden", "Not a member of this organisation");

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

    const prompt = buildPrompt(input.shifts as z.infer<typeof ShiftInput>[], input.crew as z.infer<typeof CrewInput>[]);

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: `You are an expert workforce scheduler for a live-events production company.
You receive a list of open shifts (with times, venues, roles, and skill requirements) and a roster of available crew members (with skills, availability windows, and overtime eligibility).
You must return ONLY a valid JSON object — no markdown fences, no preamble — matching this schema exactly:
{
  "assignments": [
    {
      "shift_id": "<string>",
      "crew_member_id": "<string>",
      "crew_member_name": "<string>",
      "reason": "<one sentence explaining the match>",
      "confidence": "high" | "medium" | "low"
    }
  ],
  "unassigned_shift_ids": ["<shift_id>", ...],
  "notes": "<overall summary or caveats>"
}
Assign each shift to the best-fit crew member. A crew member may appear in multiple assignments only if their availability windows don't overlap. Skip an assignment and add the shift to unassigned_shift_ids when no suitable crew member exists.`,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "";

    let result: ScheduleResult;
    try {
      result = JSON.parse(raw) as ScheduleResult;
    } catch {
      return apiError("internal", "AI returned unparseable schedule response");
    }

    return apiOk({ schedule: result, model: "claude-sonnet-4-6" });
  });
}

function buildPrompt(
  shifts: z.infer<typeof ShiftInput>[],
  crew: z.infer<typeof CrewInput>[],
): string {
  const shiftLines = shifts
    .map(
      (s) =>
        `- id=${s.id} | ${s.starts_at} → ${s.ends_at} | role=${s.role ?? "any"} | venue=${s.venue_name ?? "TBD"} | needs=[${s.required_skills.join(", ") || "none"}]`,
    )
    .join("\n");

  const crewLines = crew
    .map(
      (c) =>
        `- id=${c.id} | ${c.full_name} | role=${c.role ?? "general"} | skills=[${c.skills.join(", ") || "none"}] | overtime=${c.overtime_eligible ? "yes" : "no"} | windows=${c.available_windows.length > 0 ? c.available_windows.map((w) => `${w.from}–${w.to}`).join(", ") : "always available"}`,
    )
    .join("\n");

  return `OPEN SHIFTS (${shifts.length}):\n${shiftLines}\n\nAVAILABLE CREW (${crew.length}):\n${crewLines}\n\nGenerate the optimized schedule JSON.`;
}
