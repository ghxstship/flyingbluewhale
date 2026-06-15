import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiCreated, apiError, parseJson } from "@/lib/api";
import { isManagerPlus, withAuth } from "@/lib/auth";
import { env } from "@/lib/env";
import { record as recordUsage } from "@/lib/usage";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

// AI Course Creator — validated by TalentLMS AI Content Creator and Docebo AI
// learning paths (2025-2026). Takes a topic + audience + duration and returns
// a full course structure: title, summary, lessons (with body), quiz questions
// with multiple-choice answers. The caller (courses/new page) inserts these
// directly via the existing createCourseAction + addLesson + addQuizQuestion
// server actions rather than a separate write path.

const Schema = z.object({
  topic: z.string().min(3).max(300),
  audience: z.string().max(200).optional(),
  durationMinutes: z.number().int().min(5).max(600).default(30),
  model: z.enum(["claude-opus-4-7", "claude-sonnet-4-6"]).default("claude-sonnet-4-6"),
});

const SYSTEM = `You are an expert instructional designer for ATLVS Technologies, an experiential productions platform serving live events, fabrication, venue ops, and crew management. Your job is to generate structured training courses for crew, staff, and venue operators.

Return ONLY a valid JSON object (no markdown, no fences) with this exact shape:
{
  "title": "string (concise, under 80 chars)",
  "summary": "string (2-3 sentence overview of the course and its learning outcomes, under 300 chars)",
  "duration_minutes": number,
  "required_for_role": "string or null (e.g. 'stage_manager', 'crew_member', null if general)",
  "lessons": [
    {
      "ordinal": number,
      "title": "string (under 100 chars)",
      "body": "string (instructional prose, 150-400 words, plain text not markdown)"
    }
  ],
  "quiz_questions": [
    {
      "ordinal": number,
      "prompt": "string (clear question, under 200 chars)",
      "choices": ["option A", "option B", "option C", "option D"],
      "correct_index": number (0-3)
    }
  ]
}

Requirements: 3-6 lessons, 3-5 quiz questions. Match the depth to the durationMinutes. Focus on practical skills, safety, or compliance relevant to live events and venue operations. Voice: direct, professional, operator-grade.`;

export async function POST(req: Request) {
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:course-gen"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "AI rate limit reached; try again shortly");

  if (!env.ANTHROPIC_API_KEY) {
    return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");
  }

  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  if (!isManagerPlus(session)) {
    return apiError("forbidden", "Manager access required to generate course content");
  }

  const userPrompt = [
    `Topic: ${input.topic}`,
    input.audience ? `Target audience: ${input.audience}` : null,
    `Target duration: ${input.durationMinutes} minutes`,
    "Generate the complete course structure now.",
  ]
    .filter(Boolean)
    .join("\n");

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  let courseStructure: {
    title: string;
    summary: string;
    duration_minutes: number;
    required_for_role: string | null;
    lessons: Array<{ ordinal: number; title: string; body: string }>;
    quiz_questions: Array<{
      ordinal: number;
      prompt: string;
      choices: string[];
      correct_index: number;
    }>;
  };

  let usage: Anthropic.Messages.Usage | null = null;

  try {
    const message = await anthropic.messages.create({
      model: input.model,
      max_tokens: 4096,
      system: SYSTEM,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    usage = message.usage;
    courseStructure = JSON.parse(text.replace(/^```json\s*/i, "").replace(/```\s*$/, ""));
  } catch (e) {
    return apiError("internal", e instanceof Error ? e.message : "Course generation failed");
  }

  if (!courseStructure.title || !Array.isArray(courseStructure.lessons)) {
    return apiError("internal", "Model returned an invalid course structure");
  }

  if (usage) {
    void Promise.all([
      recordUsage({
        orgId: session.orgId,
        actorId: session.userId,
        metric: "ai.tokens.input",
        quantity: usage.input_tokens ?? 0,
        unit: "tokens",
        metadata: { model: input.model, surface: "course-gen" },
      }),
      recordUsage({
        orgId: session.orgId,
        actorId: session.userId,
        metric: "ai.tokens.output",
        quantity: usage.output_tokens ?? 0,
        unit: "tokens",
        metadata: { model: input.model, surface: "course-gen" },
      }),
      recordUsage({
        orgId: session.orgId,
        actorId: session.userId,
        metric: "ai.request",
        quantity: 1,
        unit: "count",
        metadata: { model: input.model, surface: "course-gen" },
      }),
    ]);
  }

  return apiCreated(courseStructure);
}
