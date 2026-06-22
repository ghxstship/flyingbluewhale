import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { isManagerPlus, withAuth } from "@/lib/auth";
import { env } from "@/lib/env";
import { record as recordUsage } from "@/lib/usage";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";
import { ANNOUNCEMENT_AUDIENCES } from "@/lib/connecteam";

// Competitive parity with Connecteam "AI Text Enhancement" (Sep 2025) and
// CventIQ "AI-Driven Content Creation". Takes a brief topic + target audience
// and returns a ready-to-use announcement title + body. Not persisted — caller
// fills the form fields and submits through the normal action.

const Schema = z.object({
  topic: z.string().min(3).max(500),
  audience: z.enum(ANNOUNCEMENT_AUDIENCES).default("all"),
  model: z.enum(["claude-opus-4-7", "claude-sonnet-4-6"]).default("claude-sonnet-4-6"),
});

const SYSTEM = `You are the ATLVS Technologies internal communications writer. Draft a crisp, professional announcement for a live events / production operations workforce. Respond with valid JSON only — no markdown fences:

{
  "title": "string (≤120 chars, punchy and specific)",
  "body": "string (2–4 short paragraphs in plain text, action-oriented, concise operator voice)"
}

Tone: confident, warm, direct. Never use filler phrases like "We are pleased to announce." Jump straight to the point.`;

export async function POST(req: Request) {
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:announce-draft"), ...RATE_BUDGETS.ai });
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
    return apiError("forbidden", "Manager access required to generate announcement content");
  }

  const audienceLabel: Record<string, string> = {
    all: "all staff",
    crew: "crew members",
    contractors: "contractors",
    vendors: "vendors",
    admins: "admins",
  };

  const userPrompt = [
    `Topic: ${input.topic}`,
    `Audience: ${audienceLabel[input.audience] ?? input.audience}`,
    "Write the announcement now.",
  ].join("\n\n");

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  let title = "";
  let body = "";
  let usage: Anthropic.Messages.Usage | null = null;

  try {
    const message = await anthropic.messages.create({
      model: input.model,
      max_tokens: 1024,
      system: SYSTEM,
      messages: [{ role: "user", content: userPrompt }],
    });
    const raw = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    usage = message.usage;
    const parsed = JSON.parse(raw) as { title: string; body: string };
    title = String(parsed.title ?? "").slice(0, 200);
    body = String(parsed.body ?? "").slice(0, 8000);
  } catch (e) {
    return apiError("internal", e instanceof Error ? e.message : "AI generation failed");
  }

  if (!title || !body) {
    return apiError("internal", "AI returned an empty draft");
  }

  if (usage) {
    void Promise.all([
      recordUsage({
        orgId: session.orgId,
        actorId: session.userId,
        metric: "ai.tokens.input",
        quantity: usage.input_tokens ?? 0,
        unit: "tokens",
        metadata: { model: input.model, surface: "announce-draft" },
      }),
      recordUsage({
        orgId: session.orgId,
        actorId: session.userId,
        metric: "ai.tokens.output",
        quantity: usage.output_tokens ?? 0,
        unit: "tokens",
        metadata: { model: input.model, surface: "announce-draft" },
      }),
      recordUsage({
        orgId: session.orgId,
        actorId: session.userId,
        metric: "ai.request",
        quantity: 1,
        unit: "count",
        metadata: { model: input.model, surface: "announce-draft" },
      }),
    ]);
  }

  return apiOk({ title, body });
}
