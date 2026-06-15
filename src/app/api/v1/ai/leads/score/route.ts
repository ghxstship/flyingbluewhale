import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiCreated, apiError, parseJson } from "@/lib/api";
import { isManagerPlus, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { record as recordUsage } from "@/lib/usage";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

// AI lead scoring — surface validated by HubSpot Smart Deal Progression and
// Salesforce Einstein. Scores 0-100 with rationale so the rep knows WHY, not
// just the number. Gate: manager+ only; 30/min shared with other AI endpoints.
const Schema = z.object({
  leadId: z.string().uuid(),
  model: z.enum(["claude-opus-4-7", "claude-sonnet-4-6"]).default("claude-sonnet-4-6"),
});

const SYSTEM = `You are an expert sales analyst for ATLVS Technologies, an experiential productions platform serving live events, fabrication, and creative ops. Given a lead record, score the likelihood of conversion (0-100) and explain the key positive and negative signals. Be concise and honest — a real sales manager should trust this score to prioritise their pipeline. Return valid JSON with these exact fields: score (integer 0-100), tier ("hot"|"warm"|"cool"|"cold"), rationale (2-3 sentences), signals (array of { type: "positive"|"negative", text: string }, max 5).`;

export async function POST(req: Request) {
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:lead-score"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "AI rate limit reached; try again shortly");

  if (!env.ANTHROPIC_API_KEY) {
    return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");
  }

  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  if (!isManagerPlus(session)) {
    return apiError("forbidden", "Manager access required to run AI lead scoring");
  }

  const supabase = await createClient();

  // Cross-tenant guard — pin lead to caller's org.
  const { data: lead } = await supabase
    .from("leads")
    .select("id, name, email, source, stage, estimated_value_cents, notes, created_at, updated_at")
    .eq("id", input.leadId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!lead) return apiError("not_found", "Lead not found");

  const userPrompt = [
    `Lead name: ${lead.name}`,
    lead.email ? `Email: ${lead.email}` : null,
    lead.source ? `Source: ${lead.source}` : null,
    `Current stage: ${lead.stage}`,
    lead.estimated_value_cents != null
      ? `Estimated value: $${(lead.estimated_value_cents / 100).toLocaleString()}`
      : null,
    lead.notes ? `Notes:\n${lead.notes}` : null,
    `Created: ${lead.created_at}`,
    `Last updated: ${lead.updated_at}`,
    "",
    "Score this lead. Return only the JSON object, no markdown fences.",
  ]
    .filter(Boolean)
    .join("\n");

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  let result: {
    score: number;
    tier: "hot" | "warm" | "cool" | "cold";
    rationale: string;
    signals: Array<{ type: "positive" | "negative"; text: string }>;
  };

  let usage: Anthropic.Messages.Usage | null = null;

  try {
    const message = await anthropic.messages.create({
      model: input.model,
      max_tokens: 1024,
      system: SYSTEM,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    usage = message.usage;
    result = JSON.parse(text.replace(/^```json\s*/i, "").replace(/```\s*$/, ""));
  } catch (e) {
    return apiError("internal", e instanceof Error ? e.message : "Scoring failed");
  }

  if (typeof result.score !== "number" || result.score < 0 || result.score > 100) {
    return apiError("internal", "Model returned an invalid score");
  }

  if (usage) {
    void Promise.all([
      recordUsage({
        orgId: session.orgId,
        actorId: session.userId,
        metric: "ai.tokens.input",
        quantity: usage.input_tokens ?? 0,
        unit: "tokens",
        metadata: { model: input.model, lead_id: lead.id, surface: "lead-score" },
      }),
      recordUsage({
        orgId: session.orgId,
        actorId: session.userId,
        metric: "ai.tokens.output",
        quantity: usage.output_tokens ?? 0,
        unit: "tokens",
        metadata: { model: input.model, lead_id: lead.id, surface: "lead-score" },
      }),
      recordUsage({
        orgId: session.orgId,
        actorId: session.userId,
        metric: "ai.request",
        quantity: 1,
        unit: "count",
        metadata: { model: input.model, surface: "lead-score" },
      }),
    ]);
  }

  return apiCreated({ leadId: lead.id, ...result });
}
