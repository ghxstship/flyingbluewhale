import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { env } from "@/lib/env";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

const Schema = z.object({
  topic: z.string().min(3).max(500),
  audience: z.string().max(100).optional(),
});

const SYSTEM = `You are a training-content specialist for live events, production, and deskless-workforce operations. Generate a structured training course from the topic provided. Return ONLY a JSON object with this exact shape:

{
  "title": "string (concise, ≤80 chars)",
  "summary": "string (2–3 sentences, what the course covers and who it's for)",
  "duration_minutes": number (realistic estimate, 5–120),
  "lessons": [
    {
      "title": "string",
      "content": "string (1–3 paragraphs of instructional content)",
      "quiz_questions": [
        {
          "question": "string",
          "options": ["string", "string", "string", "string"],
          "answer_index": number (0–3, index of the correct option)
        }
      ]
    }
  ]
}

Include 3–5 lessons. Each lesson should have 1–2 quiz questions. Focus on practical, field-applicable knowledge. Use clear, direct language appropriate for frontline crew.`;

export async function POST(req: Request) {
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:generate-course"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "AI rate limit reached; try again shortly");

  if (!env.ANTHROPIC_API_KEY) {
    return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");
  }

  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;

  const userPrompt = `Topic: ${input.topic}${input.audience ? `\nTarget audience: ${input.audience}` : ""}`;

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: SYSTEM,
    messages: [{ role: "user", content: userPrompt }],
  });

  const raw = msg.content[0]?.type === "text" ? msg.content[0].text : "";
  // Strip markdown code fences if the model wraps the JSON
  const jsonStr = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();

  let course: unknown;
  try {
    course = JSON.parse(jsonStr);
  } catch {
    return apiError("internal", "Failed to parse generated course structure");
  }

  return apiOk(course);
}
