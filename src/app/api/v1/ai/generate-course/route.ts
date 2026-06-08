import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiError, apiCreated, parseJson } from "@/lib/api";
import { withAuth, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

const Schema = z.object({
  topic: z.string().min(3).max(500),
  role: z.string().max(80).optional(),
  lesson_count: z.number().int().min(1).max(8).default(3),
  duration_minutes: z.number().int().min(5).max(120).optional(),
});

const SYSTEM = `You are a training-content specialist for live events production companies.
Generate practical, deskless-worker-friendly micro-learning courses in JSON.

Return ONLY valid JSON matching this exact schema — no markdown, no prose:
{
  "title": string,
  "summary": string (≤200 chars),
  "duration_minutes": number,
  "lessons": [
    { "ordinal": number, "title": string, "body": string (plain text, 150-400 words), "lesson_kind": "text" }
  ],
  "quiz_questions": [
    {
      "ordinal": number,
      "prompt": string,
      "choices": [string, string, string, string],
      "correct_index": number (0-3)
    }
  ]
}

Rules:
- lessons array length equals the requested lesson count
- quiz_questions: 2–4 questions, one per key concept
- body text must be practical, actionable, and jargon-light
- choices must have exactly 4 items; correct_index points to the correct one
- duration_minutes should reflect the lesson count and body length realistically`;

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
  const { session } = guard;

  if (!isManagerPlus(session)) {
    return apiError("forbidden", "Only managers and above can generate courses");
  }

  const prompt = [
    `Generate a micro-learning course about: "${input.topic}"`,
    input.role ? `Target audience: ${input.role}` : "",
    `Number of lessons: ${input.lesson_count}`,
    input.duration_minutes ? `Target duration: ${input.duration_minutes} minutes` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  let raw: string;
  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });
    const block = msg.content[0];
    if (!block || block.type !== "text") {
      return apiError("internal", "Unexpected response from AI model");
    }
    raw = block.text.trim();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI request failed";
    return apiError("internal", msg);
  }

  let parsed: {
    title: string;
    summary: string;
    duration_minutes: number;
    lessons: Array<{ ordinal: number; title: string; body: string; lesson_kind: string }>;
    quiz_questions: Array<{ ordinal: number; prompt: string; choices: string[]; correct_index: number }>;
  };

  try {
    // Strip any accidental markdown code fences
    const clean = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    parsed = JSON.parse(clean);
  } catch {
    return apiError("internal", "AI returned malformed JSON; please try again");
  }

  const supabase = await createClient();

  const { data: course, error: courseErr } = await supabase
    .from("courses")
    .insert({
      org_id: session.orgId,
      title: parsed.title,
      summary: parsed.summary,
      duration_minutes: parsed.duration_minutes ?? null,
      required_for_role: input.role || null,
      created_by: session.userId,
    })
    .select("id")
    .single();

  if (courseErr || !course) {
    return apiError("internal", courseErr?.message ?? "Failed to create course");
  }

  const lessonRows = parsed.lessons.map((l) => ({
    course_id: course.id,
    ordinal: l.ordinal,
    title: l.title,
    body: l.body,
    lesson_kind: "text" as const,
  }));

  const quizRows = parsed.quiz_questions.map((q) => ({
    course_id: course.id,
    ordinal: q.ordinal,
    prompt: q.prompt,
    choices: q.choices,
    correct_index: q.correct_index,
  }));

  const [{ error: lessonErr }, { error: quizErr }] = await Promise.all([
    supabase.from("course_lessons").insert(lessonRows),
    supabase.from("course_quiz_questions").insert(quizRows),
  ]);

  if (lessonErr) return apiError("internal", lessonErr.message);
  if (quizErr) return apiError("internal", quizErr.message);

  return apiCreated({ courseId: course.id });
}
