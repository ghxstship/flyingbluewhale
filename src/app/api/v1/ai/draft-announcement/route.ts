import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { env } from "@/lib/env";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

const Schema = z.object({
  prompt: z.string().min(5).max(500),
  audience: z.enum(["all", "crew", "contractors", "vendors", "admins"]).default("all"),
});

const SYSTEM = `You are a communications specialist for live event production companies. Draft clear, direct team announcements. Return ONLY a JSON object:

{
  "title": "string (concise headline, ≤120 chars, no trailing period)",
  "body": "string (1–3 paragraphs, plain text, no markdown, action-oriented language)"
}

Tone: professional but direct. No corporate filler. No emojis. No sign-offs. State facts, then action.`;

export async function POST(req: Request) {
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:draft-announcement"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "AI rate limit reached; try again shortly");

  if (!env.ANTHROPIC_API_KEY) {
    return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");
  }

  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;

  const audienceLabel: Record<string, string> = {
    all: "the entire team",
    crew: "crew members",
    contractors: "contractors",
    vendors: "vendors",
    admins: "administrators",
  };

  const userPrompt = `Draft an announcement for ${audienceLabel[input.audience] ?? "the team"} about:\n${input.prompt}`;

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: SYSTEM,
    messages: [{ role: "user", content: userPrompt }],
  });

  const raw = msg.content[0]?.type === "text" ? msg.content[0].text : "";
  const jsonStr = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();

  let draft: unknown;
  try {
    draft = JSON.parse(jsonStr);
  } catch {
    return apiError("internal", "Failed to parse generated announcement");
  }

  return apiOk(draft);
}
