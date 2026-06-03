import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { env } from "@/lib/env";
import { isManagerPlus } from "@/lib/auth";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

const Schema = z.object({
  topic: z.string().min(4).max(400),
  audience: z.string().max(120).optional(),
  lesson_count: z.number().int().min(1).max(8).default(3),
});

export type GeneratedCourse = {
  title: string;
  summary: string;
  duration_minutes: number;
  lessons: Array<{ title: string; body: string }>;
  quiz_questions: Array<{
    prompt: string;
    choices: string[];
    correct_index: number;
  }>;
};

export async function POST(req: Request) {
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:generate-course"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "AI rate limit reached; try again shortly");

  if (!env.ANTHROPIC_API_KEY) return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");

  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;
  if (!isManagerPlus(session)) return apiError("forbidden", "Only manager+ can generate courses");

  const audienceNote = input.audience ? ` The audience is: ${input.audience}.` : "";
  const prompt = `Create a training course about: "${input.topic}".${audienceNote}

Generate exactly ${input.lesson_count} lessons. Return ONLY valid JSON matching this exact schema, no markdown fences:
{
  "title": "string (≤120 chars)",
  "summary": "string (≤300 chars, one paragraph)",
  "duration_minutes": number,
  "lessons": [
    { "title": "string (≤100 chars)", "body": "string (≤800 chars, plain text)" }
  ],
  "quiz_questions": [
    {
      "prompt": "string (question, ≤200 chars)",
      "choices": ["A", "B", "C", "D"],
      "correct_index": 0
    }
  ]
}

Rules:
- lessons array must have exactly ${input.lesson_count} items
- quiz_questions array must have exactly ${Math.min(input.lesson_count, 4)} items
- correct_index is 0-based index into choices array
- duration_minutes should be realistic (5–90)
- Write for operational/field staff; be practical, not academic`;

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  let raw: string;
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });
    raw = response.content[0].type === "text" ? response.content[0].text : "";
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI generation failed";
    return apiError("internal", msg);
  }

  // Strip any accidental markdown fences before parsing.
  const json = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

  let course: GeneratedCourse;
  try {
    course = JSON.parse(json) as GeneratedCourse;
  } catch {
    return apiError("internal", "AI returned malformed JSON; try again");
  }

  return apiOk(course);
}
