import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { env } from "@/lib/env";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

const Schema = z.object({
  text: z.string().min(1).max(8000),
  context: z.enum(["announcement", "course_summary", "requisition"]),
});

const SYSTEM_PROMPTS: Record<z.infer<typeof Schema>["context"], string> = {
  announcement: `You are a professional comms writer for a live events and experiential production company (ATLVS Technologies). Rewrite the given announcement copy to be clear, engaging, and action-oriented for crew, contractors, or vendors. Keep the same core message and approximate length. Return ONLY the improved text, no preamble or commentary.`,
  course_summary: `You are an instructional designer for a live events and experiential production company (ATLVS Technologies). Rewrite the given course summary to be clear, learning-outcome focused, and motivating for field crew and production staff. Return ONLY the improved text.`,
  requisition: `You are a procurement officer at a live events production company (ATLVS Technologies). Improve the given purchase requisition description to be specific, professional, and include enough detail for vendor evaluation (quantities, specs, timeline context). Return ONLY the improved description text.`,
};

/** POST /api/v1/ai/enhance-text — non-streaming AI text enhancement.
 *
 * Takes a block of text + context label and returns an improved version.
 * Sits on the same AI rate budget as the chat endpoint (30/min per user).
 * Used by: announcement composer, course summary field, requisition form. */
export async function POST(req: Request) {
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:enhance"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "AI rate limit reached; try again shortly");

  if (!env.ANTHROPIC_API_KEY) {
    return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");
  }

  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  return withAuth(async () => {
    const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `${SYSTEM_PROMPTS[input.context]}\n\n---\n\n${input.text}`,
        },
      ],
    });

    const enhanced = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    return apiOk({ enhanced });
  });
}
