import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { env } from "@/lib/env";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

/**
 * Human-in-the-loop AI action planning.
 *
 * The caller describes an intent in plain English. This endpoint returns a
 * structured plan (list of steps) for the user to review before anything is
 * executed. Execution itself happens via separate endpoints after the user
 * confirms — this route NEVER mutates data. Pattern inspired by Deputy's
 * "confirm before act" design and LASSO Intelligence's "Act" mode.
 */

const Schema = z.object({
  intent: z.string().min(5).max(1000),
  context: z.string().max(2000).optional(),
});

const SYSTEM = `You are an AI assistant for ATLVS Technologies, a live event production platform. A user has asked you to perform an action. Your job is to explain what you would do — clearly, step by step — so the user can confirm before anything happens.

Return ONLY a JSON object:
{
  "summary": "string (one sentence describing the overall action, ≤120 chars)",
  "steps": [
    {
      "label": "string (short verb phrase, ≤60 chars)",
      "description": "string (one sentence explaining what this step does and why)",
      "reversible": boolean (true if easily undone)
    }
  ],
  "warnings": ["string"] | null,
  "estimated_scope": "small" | "medium" | "large"
}

Keep steps to 2–6. Be specific. If the action would affect many records or people, include a warning. Never downplay destructive actions.`;

export async function POST(req: Request) {
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:plan"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "AI rate limit reached; try again shortly");

  if (!env.ANTHROPIC_API_KEY) {
    return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");
  }

  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;

  const userPrompt = [
    `Intent: ${input.intent}`,
    input.context ? `Context: ${input.context}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: SYSTEM,
    messages: [{ role: "user", content: userPrompt }],
  });

  const raw = msg.content[0]?.type === "text" ? msg.content[0].text : "";
  const jsonStr = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();

  let plan: unknown;
  try {
    plan = JSON.parse(jsonStr);
  } catch {
    return apiError("internal", "Failed to parse generated plan");
  }

  return apiOk(plan);
}
