import { type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { record as recordUsage } from "@/lib/usage";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

/**
 * POST /api/v1/crew/suggest
 *
 * AI-powered crew suggestion for a project + role. Returns a ranked list
 * of crew members with reasoning, sourced from the org's roster filtered
 * by credentials, skill_tags, and reliability_score.
 *
 * Competitive sources: Connecteam AI auto-scheduling, Deputy demand
 * forecasting, Nowsta intelligent shift matching.
 */

const Schema = z.object({
  projectId: z.string().uuid().optional(),
  role: z.string().min(1).max(100),
  skillTags: z.array(z.string().max(50)).max(10).default([]),
  date: z.string().optional(),
  count: z.number().int().min(1).max(20).default(5),
});

export type CrewSuggestion = {
  crew_member_id: string;
  name: string;
  role: string | null;
  reliability_score: number | null;
  skill_tags: string[];
  reason: string;
  rank: number;
};

export async function POST(req: NextRequest) {
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:crew-suggest"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "AI rate limit reached; try again shortly");

  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  return withAuth(async (session) => {
    if (!env.ANTHROPIC_API_KEY) return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");
    const supabase = await createClient();

    // Cross-tenant guard on projectId
    let projectContext = "";
    if (input.projectId) {
      const { data: project } = await supabase
        .from("projects")
        .select("id, name, xpms_phase, start_date, end_date")
        .eq("id", input.projectId)
        .eq("org_id", session.orgId)
        .is("deleted_at", null)
        .maybeSingle();
      if (!project) return apiError("not_found", "Project not found");
      projectContext = `Project: ${project.name} (phase: ${project.xpms_phase}, ${project.start_date ?? "?"} – ${project.end_date ?? "?"})`;
    }

    // Fetch roster — prefer crew with matching skills or who have been
    // previously assigned to the same project
    type CrewRow = {
      id: string;
      name: string;
      email: string | null;
      role: string | null;
      reliability_score: number | null;
      skill_tags: string[];
      preferred_roles: string[];
    };

    const { data: rawCrew } = await supabase
      .from("crew_members")
      .select("id, name, email, role, reliability_score, skill_tags, preferred_roles")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("reliability_score", { ascending: false, nullsFirst: false })
      .limit(50);

    const crew = (rawCrew ?? []) as CrewRow[];

    if (!crew.length) return apiOk({ suggestions: [] });

    const rosterText = crew
      .map(
        (c, i) =>
          `${i + 1}. ID:${c.id} | ${c.name} | role:${c.role ?? "—"} | reliability:${c.reliability_score ?? "unscored"}/100 | skills:[${(c.skill_tags ?? []).join(", ") || "none"}]`,
      )
      .join("\n");

    const prompt = `You are an ATLVS Technologies crew scheduling AI. Suggest the best ${input.count} crew members for this assignment.

${projectContext}
Role needed: ${input.role}
Required skills: ${input.skillTags.length ? input.skillTags.join(", ") : "none specified"}
Date: ${input.date ?? "not specified"}

ROSTER (${crew.length} members):
${rosterText}

Return JSON only (no markdown):
{
  "suggestions": [
    { "crew_member_id": "<uuid>", "reason": "<1 sentence>", "rank": 1 },
    ...
  ]
}

Rules: rank 1 = best fit. Only include IDs from the roster above. Base ranking on: skill match, reliability score, role alignment. Explain each choice in one sentence.`;

    const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });

    const inputTokens = msg.usage?.input_tokens ?? 0;
    const outputTokens = msg.usage?.output_tokens ?? 0;
    const raw = msg.content[0]?.type === "text" ? msg.content[0].text : "{}";

    let aiResult: { suggestions: Array<{ crew_member_id: string; reason: string; rank: number }> };
    try {
      aiResult = JSON.parse(raw);
    } catch {
      return apiError("internal", "AI returned malformed suggestions");
    }

    // Hydrate AI results with full crew data
    const crewMap = new Map<string, CrewRow>(crew.map((c) => [c.id, c]));
    const suggestions: CrewSuggestion[] = (aiResult.suggestions ?? [])
      .map((s) => {
        const member = crewMap.get(s.crew_member_id);
        if (!member) return null;
        return {
          crew_member_id: member.id,
          name: member.name,
          role: member.role,
          reliability_score: member.reliability_score as number | null,
          skill_tags: (member.skill_tags as string[]) ?? [],
          reason: s.reason,
          rank: s.rank,
        } satisfies CrewSuggestion;
      })
      .filter(Boolean) as CrewSuggestion[];

    void Promise.all([
      recordUsage({ orgId: session.orgId, actorId: session.userId, metric: "ai.tokens.input", quantity: inputTokens, unit: "tokens", metadata: { feature: "crew_suggest" } }),
      recordUsage({ orgId: session.orgId, actorId: session.userId, metric: "ai.tokens.output", quantity: outputTokens, unit: "tokens", metadata: { feature: "crew_suggest" } }),
      recordUsage({ orgId: session.orgId, actorId: session.userId, metric: "ai.request", quantity: 1, unit: "count", metadata: { feature: "crew_suggest" } }),
    ]);

    return apiOk({ suggestions });
  });
}
