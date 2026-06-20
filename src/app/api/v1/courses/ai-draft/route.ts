import Anthropic from "@anthropic-ai/sdk";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiOk, apiError, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { env } from "@/lib/env";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

/** POST /api/v1/courses/ai-draft
 * Generates a full course outline (title, summary, lessons, quiz questions)
 * from a topic prompt. Returns structured JSON consumable by the course
 * creation form. Competitive parity: Connecteam AI-Generated Courses (Aug 2025). */

const Schema = z.object({
  topic: z.string().min(3).max(200),
  targetRole: z.string().max(80).optional(),
  durationMinutes: z.number().int().min(5).max(300).optional(),
});

export type AiCourseDraft = {
  title: string;
  summary: string;
  duration_minutes: number;
  required_for_role: string;
  lessons: Array<{
    title: string;
    content: string;
    order: number;
  }>;
  quiz_questions: Array<{
    question: string;
    options: string[];
    correct_index: number;
  }>;
};

export async function POST(req: NextRequest) {
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:course-draft"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "AI rate limit reached; try again shortly");

  if (!env.ANTHROPIC_API_KEY) {
    return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");
  }

  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  return withAuth(async () => {
    const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

    const targetDuration = input.durationMinutes ?? 30;

    const prompt = [
      "You are a training content designer for live event production companies.",
      "Create a practical, hands-on training course for deskless field workers.",
      "",
      `Topic: ${input.topic}`,
      input.targetRole ? `Target role: ${input.targetRole}` : "",
      `Target duration: ${targetDuration} minutes`,
      "",
      "Return ONLY valid JSON (no markdown fences) matching this exact shape:",
      JSON.stringify(
        {
          title: "string — clear course title",
          summary: "string — 2-3 sentence description of what learners will gain",
          duration_minutes: targetDuration,
          required_for_role: input.targetRole ?? "",
          lessons: [
            {
              title: "Lesson title",
              content: "Lesson body — practical, concise, 100-200 words. Include a key takeaway.",
              order: 1,
            },
          ],
          quiz_questions: [
            {
              question: "Question text?",
              options: ["Option A", "Option B", "Option C", "Option D"],
              correct_index: 0,
            },
          ],
        },
        null,
        2,
      ),
      "",
      "Include 3-5 lessons and 3-5 quiz questions. Focus on practical, safety-aware content relevant to live events.",
    ]
      .filter(Boolean)
      .join("\n");

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";

    let draft: AiCourseDraft;
    try {
      draft = JSON.parse(raw) as AiCourseDraft;
    } catch {
      return apiError("server_error", "AI returned malformed JSON; please retry");
    }

    return apiOk({ draft, tokensUsed: message.usage.input_tokens + message.usage.output_tokens });
  });
}
