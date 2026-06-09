import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { isManagerPlus } from "@/lib/auth";
import { env } from "@/lib/env";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

const Schema = z.object({
  topic: z.string().min(3).max(300),
  audience: z.string().max(200).optional(),
  lesson_count: z.number().int().min(1).max(8).default(4),
});

const SYSTEM = `You are a curriculum designer for ATLVS Technologies. Generate a structured training course for a deskless production + events workforce (crew, technicians, operators). Return ONLY valid JSON — no markdown fences, no extra keys.

Schema:
{
  "title": "string (≤120 chars)",
  "summary": "string (2–4 sentences, ≤600 chars)",
  "duration_minutes": number,
  "lessons": [
    {
      "title": "string (≤120 chars)",
      "kind": "text" | "video" | "quiz",
      "content": "string (lesson body, ≤1200 chars)",
      "quiz_questions": [
        {
          "question": "string",
          "options": ["string","string","string","string"],
          "correct_index": 0
        }
      ]
    }
  ]
}

Rules:
- Include quiz_questions only on "quiz" lessons (2–4 questions each).
- Keep language direct, practical, and jargon-light.
- Duration should reflect realistic read/watch + quiz time.`;

export async function POST(req: Request) {
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:generate-course"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "AI rate limit reached; try again shortly");

  if (!env.ANTHROPIC_API_KEY) return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");

  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  if (!isManagerPlus(guard.session)) return apiError("forbidden", "Only manager+ can generate courses");

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const userPrompt = [
    `Topic: ${input.topic}`,
    input.audience ? `Target audience: ${input.audience}` : null,
    `Number of lessons: ${input.lesson_count}`,
    `Make at least one lesson a quiz lesson.`,
  ]
    .filter(Boolean)
    .join("\n");

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: SYSTEM,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = msg.content.find((b) => b.type === "text")?.text ?? "";
  let course: unknown;
  try {
    course = JSON.parse(text);
  } catch {
    return apiError("internal", "AI returned malformed JSON; please try again");
  }

  return apiOk(course);
}
