import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiCreated, apiError, parseJson } from "@/lib/api";
import { isManagerPlus, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { record as recordUsage } from "@/lib/usage";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

// AI course generation (Competitive Edge Drop v1 — Connecteam AI-Generated
// Courses parity). Accepts a topic/prompt and returns a structured course
// outline with lessons and quiz questions. Optionally persists the course +
// lessons into the DB when `persist: true`. Non-streaming — the caller wants
// the full structure before rendering. Mirrors the /api/v1/ai/propose pattern.

const Schema = z.object({
  topic: z.string().min(2).max(500),
  audience: z.string().max(200).optional(),
  duration_minutes: z.number().int().min(5).max(600).optional(),
  instructions: z.string().max(1_000).optional(),
  persist: z.boolean().default(false),
  model: z.enum(["claude-opus-4-7", "claude-sonnet-4-6"]).default("claude-sonnet-4-6"),
});

const SYSTEM = `You are the ATLVS Technologies training-content assistant, embedded in a production operations platform for live events, fabrication, and creative ops. Generate a structured, practical course outline for frontline production crew — riggers, stagehand leads, venue ops, safety officers, credentialing staff. Output ONLY valid JSON matching the schema below. No prose outside the JSON object.

Schema:
{
  "title": "string (concise, action-oriented)",
  "summary": "string (2-3 sentences, operator tone)",
  "duration_minutes": number,
  "lessons": [
    {
      "ordinal": number,
      "title": "string",
      "body": "string (markdown, 3-6 paragraphs of instructional content)",
      "quiz_questions": [
        {
          "prompt": "string",
          "options": ["A", "B", "C", "D"],
          "correct_index": 0
        }
      ]
    }
  ]
}

Rules:
- 3-6 lessons per course.
- Each lesson has 1-2 quiz questions.
- Use confident, premium voice; no filler; no competitor references.
- Duration in minutes must match the number of lessons × ~10 min each.`;

export async function POST(req: Request) {
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:courses"), ...RATE_BUDGETS.ai });
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
    return apiError("forbidden", "Manager access required to generate courses");
  }

  const prompt = [
    `Topic: ${input.topic}`,
    input.audience ? `Target audience: ${input.audience}` : null,
    input.duration_minutes ? `Target duration: ${input.duration_minutes} minutes` : null,
    input.instructions ? `Operator instructions:\n${input.instructions}` : null,
    "Generate the course now.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  let raw = "";
  let usage: Anthropic.Messages.Usage | null = null;
  try {
    const message = await anthropic.messages.create({
      model: input.model,
      max_tokens: 4096,
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });
    raw = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    usage = message.usage;
  } catch (e) {
    return apiError("internal", e instanceof Error ? e.message : "Course generation failed");
  }

  if (!raw.trim()) return apiError("internal", "Model returned empty content");

  // Strip markdown code fences if the model wrapped the JSON.
  const jsonStr = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

  let outline: unknown;
  try {
    outline = JSON.parse(jsonStr);
  } catch {
    return apiError("internal", "Model returned non-JSON content");
  }

  // Meter AI usage. Fire-and-forget.
  if (usage) {
    void Promise.all([
      recordUsage({ orgId: session.orgId, actorId: session.userId, metric: "ai.tokens.input", quantity: usage.input_tokens ?? 0, unit: "tokens", metadata: { model: input.model, surface: "course_generate" } }),
      recordUsage({ orgId: session.orgId, actorId: session.userId, metric: "ai.tokens.output", quantity: usage.output_tokens ?? 0, unit: "tokens", metadata: { model: input.model, surface: "course_generate" } }),
      recordUsage({ orgId: session.orgId, actorId: session.userId, metric: "ai.request", quantity: 1, unit: "count", metadata: { model: input.model, surface: "course_generate" } }),
    ]);
  }

  // Optionally persist the generated course + lessons into the DB.
  if (input.persist) {
    const supabase = await createClient();
    const c = outline as { title?: string; summary?: string; duration_minutes?: number; lessons?: unknown[] };
    const { data: course, error: ce } = await supabase
      .from("courses")
      .insert({
        org_id: session.orgId,
        title: c.title ?? input.topic,
        summary: c.summary ?? null,
        duration_minutes: c.duration_minutes ?? input.duration_minutes ?? null,
        created_by: session.userId,
      })
      .select("id")
      .single();
    if (ce) return apiError("internal", ce.message);

    const lessons = Array.isArray(c.lessons) ? c.lessons : [];
    if (lessons.length > 0) {
      const lessonRows = lessons.map((l) => {
        const lesson = l as { ordinal?: number; title?: string; body?: string; quiz_questions?: unknown[] };
        return {
          course_id: course.id,
          org_id: session.orgId,
          ordinal: lesson.ordinal ?? 1,
          title: lesson.title ?? "Lesson",
          body: lesson.body ?? null,
          quiz_questions: lesson.quiz_questions ?? [],
        };
      });
      await supabase.from("lessons").insert(lessonRows);
    }

    return apiCreated({ courseId: course.id, outline });
  }

  return apiCreated({ outline });
}
