import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { env } from "@/lib/env";
import { isManagerPlus } from "@/lib/auth";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

const Schema = z.object({
  prompt: z.string().min(4).max(600),
  tone: z.enum(["professional", "urgent", "friendly"]).default("professional"),
});

export async function POST(req: Request) {
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:draft-announcement"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "AI rate limit reached; try again shortly");

  if (!env.ANTHROPIC_API_KEY) return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");

  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;
  if (!isManagerPlus(session)) return apiError("forbidden", "Only manager+ can draft announcements");

  const toneGuide: Record<string, string> = {
    professional: "Clear, direct, professional. No fluff.",
    urgent: "Urgent, action-oriented, bold. Lead with what's time-sensitive.",
    friendly: "Warm, approachable. Conversational but still informative.",
  };

  const systemPrompt = `You are a communications assistant for ATLVS Technologies, a live event production platform. Write internal announcements for field crews, event staff, and production teams. Style: ${toneGuide[input.tone]}. Keep it ≤200 words. Return ONLY the announcement body text — no title, no subject line, no JSON wrapper.`;

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  let body: string;
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: "user", content: input.prompt }],
    });
    body = response.content[0].type === "text" ? response.content[0].text.trim() : "";
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI generation failed";
    return apiError("internal", msg);
  }

  if (!body) return apiError("internal", "AI returned empty response; try again");
  return apiOk({ body });
}
