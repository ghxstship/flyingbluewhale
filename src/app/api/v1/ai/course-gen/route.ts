import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiCreated, apiError, parseJson } from "@/lib/api";
import { isManagerPlus, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { record as recordUsage } from "@/lib/usage";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

// Competitive parity with Connecteam "AI Generated Courses" (Aug 2025).
// Takes a course + topic, generates lessons + quiz questions, bulk-inserts
// them as real rows. Non-streaming — caller refreshes on 201.

const Schema = z.object({
  courseId: z.string().uuid(),
  topic: z.string().min(3).max(500),
  lessonCount: z.number().int().min(1).max(8).default(4),
  model: z.enum(["claude-opus-4-7", "claude-sonnet-4-6"]).default("claude-sonnet-4-6"),
});

const SYSTEM = `You are an expert training curriculum designer for the live events and experiential productions industry (ATLVS Technologies). Generate a structured course curriculum as valid JSON only — no markdown fences, no commentary. Schema:

{
  "lessons": [
    { "title": "string", "body": "string (markdown, ≤800 chars)" }
  ],
  "quiz": [
    {
      "prompt": "string (question)",
      "choices": ["string", "string", "string", "string"],
      "correct_index": 0
    }
  ]
}

Rules:
- lessons array length = requested lessonCount
- quiz array length = lessonCount (one question per lesson)
- Each lesson body is a concise, action-oriented explanation in markdown
- Each quiz question has exactly 4 choices; correct_index is 0-based
- Use industry-specific language for live events, production, and event operations
- Output ONLY the JSON object — nothing else`;

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

  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, summary")
    .eq("id", input.courseId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!course) return apiError("not_found", "Course not found");

  const userPrompt = [
    `Course title: ${course.title}`,
    course.summary ? `Course summary: ${course.summary}` : null,
    `Topic to cover: ${input.topic}`,
    `Generate ${input.lessonCount} lesson(s) with 1 quiz question each.`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  let parsed: { lessons: Array<{ title: string; body: string }>; quiz: Array<{ prompt: string; choices: string[]; correct_index: number }> };
  let usage: Anthropic.Messages.Usage | null = null;

  try {
    const message = await anthropic.messages.create({
      model: input.model,
      max_tokens: 4096,
      system: SYSTEM,
      messages: [{ role: "user", content: userPrompt }],
    });
    const raw = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    usage = message.usage;
    parsed = JSON.parse(raw) as typeof parsed;
  } catch (e) {
    return apiError("internal", e instanceof Error ? e.message : "AI generation failed");
  }

  if (!Array.isArray(parsed.lessons) || !Array.isArray(parsed.quiz)) {
    return apiError("internal", "AI returned unexpected structure");
  }

  // Compute starting ordinal so we append after existing lessons.
  const { count: existingLessons } = await supabase
    .from("course_lessons")
    .select("id", { count: "exact", head: true })
    .eq("course_id", input.courseId);
  const startOrdinal = (existingLessons ?? 0) + 1;

  const { count: existingQuestions } = await supabase
    .from("course_quiz_questions")
    .select("id", { count: "exact", head: true })
    .eq("course_id", input.courseId);
  const startQuestionOrdinal = (existingQuestions ?? 0) + 1;

  const lessonRows = parsed.lessons.map((l, i) => ({
    course_id: input.courseId,
    ordinal: startOrdinal + i,
    title: String(l.title).slice(0, 200),
    body: String(l.body).slice(0, 4000),
    lesson_kind: "text" as const,
  }));

  const questionRows = parsed.quiz.map((q, i) => ({
    course_id: input.courseId,
    ordinal: startQuestionOrdinal + i,
    prompt: String(q.prompt).slice(0, 400),
    choices: (Array.isArray(q.choices) ? q.choices.slice(0, 4) : []).map(String),
    correct_index: Number.isInteger(q.correct_index) ? Math.min(Math.max(q.correct_index, 0), 3) : 0,
  }));

  const [{ error: lessonErr }, { error: questionErr }] = await Promise.all([
    supabase.from("course_lessons").insert(lessonRows),
    supabase.from("course_quiz_questions").insert(questionRows),
  ]);

  if (lessonErr) return apiError("internal", `Lesson insert failed: ${lessonErr.message}`);
  if (questionErr) return apiError("internal", `Question insert failed: ${questionErr.message}`);

  if (usage) {
    void Promise.all([
      recordUsage({
        orgId: session.orgId,
        actorId: session.userId,
        metric: "ai.tokens.input",
        quantity: usage.input_tokens ?? 0,
        unit: "tokens",
        metadata: { model: input.model, course_id: input.courseId, surface: "course-gen" },
      }),
      recordUsage({
        orgId: session.orgId,
        actorId: session.userId,
        metric: "ai.tokens.output",
        quantity: usage.output_tokens ?? 0,
        unit: "tokens",
        metadata: { model: input.model, course_id: input.courseId, surface: "course-gen" },
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

  return apiCreated({ lessons: lessonRows.length, questions: questionRows.length });
}
