import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { env } from "@/lib/env";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

const Schema = z.object({
  prompt: z.string().min(10).max(2000),
});

const SYSTEM = `You are an instructional designer for ATLVS Technologies, a live events and experiential production platform. Generate practical training course content for field crew, production managers, and venue staff. Always respond with valid JSON — no markdown fences, no commentary outside the JSON object.`;

export type GeneratedCourse = {
  title: string;
  summary: string;
  lessons: Array<{ title: string; body: string }>;
};

/** POST /api/v1/ai/generate-course — AI course outline generator.
 *
 * Inspired by Connecteam's "AI Generated Courses" feature (Aug 2025).
 * Returns a structured { title, summary, lessons[] } object suitable for
 * pre-filling the /console/workforce/courses/new form. */
export async function POST(req: Request) {
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:generate-course"), ...RATE_BUDGETS.ai });
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
      max_tokens: 4096,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Generate a training course based on this description: "${input.prompt}"

Respond ONLY with a JSON object in exactly this shape:
{
  "title": "Course title (max 200 chars)",
  "summary": "2-3 sentence overview of what the learner will be able to do after completing this course (max 2000 chars)",
  "lessons": [
    { "title": "Lesson title (max 120 chars)", "body": "2-4 sentence lesson overview explaining the key concepts and skills covered (max 600 chars)" }
  ]
}

Generate 3-6 lessons appropriate for the topic. Keep content concise and practical for deskless field workers.`,
        },
      ],
    });

    const raw = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim()
      .replace(/^```(?:json)?\n?/m, "")
      .replace(/\n?```$/m, "")
      .trim();

    let result: GeneratedCourse;
    try {
      result = JSON.parse(raw) as GeneratedCourse;
    } catch {
      return apiError("internal", "AI returned malformed JSON; please try again");
    }

    if (!result.title || !result.summary || !Array.isArray(result.lessons)) {
      return apiError("internal", "AI response missing required fields; please try again");
    }

    return apiOk(result);
  });
}
