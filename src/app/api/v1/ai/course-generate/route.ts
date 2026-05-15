import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { env } from "@/lib/env";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

const Schema = z.object({
  prompt: z.string().min(10).max(2000),
  audience: z.string().max(200).optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  num_lessons: z.number().int().min(2).max(20).optional(),
});

const SYSTEM = `You are a corporate learning designer for ATLVS Technologies — a live-events production platform.
Generate training courses for deskless event crews (stagehands, security, catering, transport, logistics).
Return ONLY valid JSON matching the schema. No prose outside the JSON.

Schema:
{
  "title": string,
  "summary": string (1-2 sentences),
  "duration_minutes": number (realistic estimate),
  "sections": [
    {
      "title": string,
      "lessons": [
        {
          "title": string,
          "body": string (2-4 paragraphs of instructional content),
          "quiz": [
            { "question": string, "options": string[4], "correct_index": number }
          ]
        }
      ]
    }
  ]
}`;

export async function POST(req: Request) {
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:course"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "AI rate limit reached; try again shortly");

  if (!env.ANTHROPIC_API_KEY)
    return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");

  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;

  const userPrompt = [
    `Topic: ${input.prompt}`,
    input.audience ? `Audience: ${input.audience}` : null,
    input.level ? `Level: ${input.level}` : null,
    input.num_lessons ? `Target lessons: ${input.num_lessons}` : "Target lessons: 4-6",
  ]
    .filter(Boolean)
    .join("\n");

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: SYSTEM,
    messages: [{ role: "user", content: userPrompt }],
  });

  const raw = message.content.find((b) => b.type === "text")?.text ?? "";
  let course: unknown;
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    course = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
  } catch {
    return apiError("internal", "AI returned malformed JSON; please try again");
  }

  return apiOk({ course });
}
