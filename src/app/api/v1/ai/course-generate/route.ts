import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { env } from "@/lib/env";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

const Schema = z.object({
  topic: z.string().min(3).max(500),
  audience: z.string().max(200).optional(),
  lesson_count: z.number().int().min(1).max(8).default(4),
});

export type GeneratedCourse = {
  title: string;
  summary: string;
  duration_minutes: number;
  lessons: Array<{
    title: string;
    body: string;
    kind: "text";
  }>;
  quiz_questions: Array<{
    prompt: string;
    choices: string[];
    correct_index: number;
  }>;
};

export async function POST(req: Request) {
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:course-generate"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "AI rate limit reached; try again shortly");

  if (!env.ANTHROPIC_API_KEY) {
    return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");
  }

  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const audienceClause = input.audience ? ` Intended audience: ${input.audience}.` : "";
  const lessonCount = input.lesson_count;
  const quizCount = Math.min(lessonCount, 5);

  const prompt = `Generate a training course for live event production operators on the topic: "${input.topic}".${audienceClause}

Return ONLY a valid JSON object with no markdown fences, no explanation — just the raw JSON:
{
  "title": "Course title (max 80 characters)",
  "summary": "One or two sentence course overview (max 200 characters)",
  "duration_minutes": <estimated total minutes as an integer>,
  "lessons": [
    {
      "title": "Lesson title (max 80 characters)",
      "body": "Lesson content as plain text, 120–350 words. Cover practical steps, key concepts, and safety considerations where relevant.",
      "kind": "text"
    }
  ],
  "quiz_questions": [
    {
      "prompt": "Quiz question text",
      "choices": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0
    }
  ]
}

Generate exactly ${lessonCount} lessons and ${quizCount} quiz questions. Keep content practical, operator-focused, and specific to the event production context.`;

  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = msg.content[0];
    if (raw.type !== "text") return apiError("internal", "Unexpected response from model");

    let course: GeneratedCourse;
    try {
      course = JSON.parse(raw.text.trim()) as GeneratedCourse;
    } catch {
      return apiError("internal", "Model returned malformed JSON — please try again");
    }

    if (!course.title || !Array.isArray(course.lessons) || !Array.isArray(course.quiz_questions)) {
      return apiError("internal", "Generated course is missing required fields");
    }

    return apiOk({ course });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI generation failed";
    return apiError("internal", msg);
  }
}
