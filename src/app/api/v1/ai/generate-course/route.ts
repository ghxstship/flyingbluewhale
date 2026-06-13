import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiOk, apiError, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { env } from "@/lib/env";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

const Schema = z.object({
  topic: z.string().min(3).max(300),
  lessonCount: z.number().int().min(1).max(8).default(3),
  audience: z.string().max(200).optional(),
  courseTitle: z.string().max(200).optional(),
});

export type GeneratedLesson = {
  title: string;
  body: string;
};

export type GeneratedQuestion = {
  prompt: string;
  choices: string[];
  correct_index: number;
};

export type GenerateCourseResponse = {
  lessons: GeneratedLesson[];
  questions: GeneratedQuestion[];
};

export async function POST(req: Request) {
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:generate-course"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "AI rate limit reached; try again shortly");
  if (!env.ANTHROPIC_API_KEY) return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");

  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;

  const audienceNote = input.audience ? ` Target audience: ${input.audience}.` : "";
  const titleNote = input.courseTitle ? ` Course title: "${input.courseTitle}".` : "";

  const prompt = `You are building a training course for a live events and production operations workforce.${titleNote}${audienceNote}

Topic: ${input.topic}

Generate exactly ${input.lessonCount} lesson(s) and ${Math.min(input.lessonCount * 2, 10)} quiz question(s) covering the topic.

Respond ONLY with a valid JSON object — no markdown fences, no preamble — matching this shape exactly:
{
  "lessons": [
    { "title": "string (max 200 chars)", "body": "string (200–800 chars, plain text)" }
  ],
  "questions": [
    {
      "prompt": "string (max 400 chars)",
      "choices": ["A", "B", "C", "D"],
      "correct_index": 0
    }
  ]
}

Rules:
- Lessons must be practical, actionable, and specific to live events / production / field ops.
- Quiz questions must have exactly 4 choices and a correct_index (0-based).
- No JSON comments. No trailing commas. No extra keys.`;

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  let parsed: GenerateCourseResponse;
  try {
    parsed = JSON.parse(raw) as GenerateCourseResponse;
  } catch {
    return apiError("internal", "AI returned malformed JSON; please try again");
  }

  if (!Array.isArray(parsed.lessons) || !Array.isArray(parsed.questions)) {
    return apiError("internal", "AI response missing lessons or questions");
  }

  return apiOk<GenerateCourseResponse>(parsed);
}
