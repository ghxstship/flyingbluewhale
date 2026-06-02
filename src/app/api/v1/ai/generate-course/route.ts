import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { isManagerPlus } from "@/lib/auth";
import { env } from "@/lib/env";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

const Schema = z.object({
  topic: z.string().min(3).max(500),
  targetRole: z.string().max(80).optional(),
  durationMinutes: z.number().int().min(5).max(480).optional(),
});

export async function POST(req: Request) {
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:generate-course"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "AI rate limit reached; try again shortly");

  if (!env.ANTHROPIC_API_KEY) return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");

  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  return withAuth(async (session) => {
    if (!isManagerPlus(session)) return apiError("forbidden", "Manager+ required to generate courses");

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

    const roleCtx = input.targetRole ? ` for the role of ${input.targetRole}` : "";
    const durCtx = input.durationMinutes ? ` The course should take approximately ${input.durationMinutes} minutes.` : "";

    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are building training content for a live events and production operations company. Generate a concise training course outline${roleCtx} on the topic: "${input.topic}".${durCtx}

Respond with valid JSON only — no markdown fences, no extra text. Shape:
{
  "title": "Course title (max 120 chars)",
  "summary": "2-3 sentence summary for learners (max 400 chars)",
  "lessons": [
    { "title": "Lesson title", "objective": "What learners will be able to do after this lesson (1 sentence)" }
  ]
}

Include 3-6 lessons, ordered logically. Keep titles punchy. The objective must start with an action verb (Identify, Demonstrate, Apply, etc.).`,
        },
      ],
    });

    const raw = msg.content[0]?.type === "text" ? msg.content[0].text.trim() : "";
    let parsed: { title: string; summary: string; lessons: { title: string; objective: string }[] };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return apiError("internal", "AI returned non-JSON output; try again");
    }

    if (!parsed?.title || !parsed?.summary || !Array.isArray(parsed?.lessons)) {
      return apiError("internal", "AI output missing required fields; try again");
    }

    return apiOk({
      title: String(parsed.title).slice(0, 120),
      summary: String(parsed.summary).slice(0, 400),
      lessons: parsed.lessons.slice(0, 6).map((l) => ({
        title: String(l.title).slice(0, 120),
        objective: String(l.objective).slice(0, 300),
      })),
    });
  });
}
