import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";
import { log } from "@/lib/log";

/**
 * AI Course Creator — generates a complete multi-lesson course outline from a
 * topic prompt. Inspired by Connecteam's August 2025 feature (92% reduction in
 * course prep time). Uses claude-sonnet-4-6 with a strict JSON-only response
 * shape. Pattern mirrors extract-ap-invoice.ts.
 */

const SYSTEM_PROMPT = `You are a professional learning-and-development author. Generate a complete course outline from the provided topic.
Respond with ONLY a JSON object matching this exact shape, no prose:
{
  "title": "string — concise course title",
  "summary": "string — 1-3 sentence overview of what learners will achieve",
  "duration_minutes": integer — realistic total seat-time estimate,
  "lessons": [
    {
      "title": "string",
      "kind": "text" | "video" | "pdf" | "external",
      "body": "string — 2-4 sentence description of the lesson content and learning objectives",
      "duration_minutes": integer
    }
  ],
  "quiz_questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correct_index": integer (0-based index into options)
    }
  ]
}
Rules:
- Include 3-8 lessons (scale to the requested duration; err toward 5 for a balanced outline).
- Include 3-5 quiz questions that test key concepts from the lessons.
- duration_minutes: realistic seat-time across all lessons (5–480).
- lesson kind: prefer "text" for conceptual content, "video" for demonstrations, "pdf" for reference material.
- correct_index: must be a valid index into that question's options array (0-3 for a 4-option question).
- Tailor content difficulty and terminology to the target role when provided.
- Never include any text outside the JSON object.`;

export type GeneratedCourse = {
  title: string;
  summary: string;
  duration_minutes: number;
  lessons: Array<{
    title: string;
    kind: "text" | "video" | "pdf" | "external";
    body: string;
    duration_minutes: number;
  }>;
  quiz_questions: Array<{
    question: string;
    options: string[];
    correct_index: number;
  }>;
};

export async function generateCourse(opts: {
  topic: string;
  target_role?: string;
  duration_minutes?: number;
}): Promise<GeneratedCourse | { error: string }> {
  if (!env.ANTHROPIC_API_KEY) {
    return { error: "ANTHROPIC_API_KEY not configured" };
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const modelVersion = "claude-sonnet-4-6";

  const userPrompt = [
    `Topic: ${opts.topic}`,
    opts.target_role ? `Target role: ${opts.target_role}` : null,
    opts.duration_minutes ? `Target duration: approximately ${opts.duration_minutes} minutes` : null,
    "Generate the course outline per the system instructions. Return only the JSON object.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await client.messages.create({
      model: modelVersion,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const text = res.content
      .filter((c): c is Extract<typeof c, { type: "text" }> => c.type === "text")
      .map((c) => c.text)
      .join("");

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      log.warn("generate_course.no_json", { sample: text.slice(0, 200) });
      return { error: "Model did not return JSON" };
    }

    const parsed = JSON.parse(match[0]) as Record<string, unknown>;

    const lessonsRaw = Array.isArray(parsed.lessons) ? (parsed.lessons as unknown[]) : [];
    const lessons = lessonsRaw
      .filter((l): l is Record<string, unknown> => l != null && typeof l === "object")
      .map((l) => ({
        title: typeof l.title === "string" ? l.title : "",
        kind: (["text", "video", "pdf", "external"].includes(l.kind as string)
          ? l.kind
          : "text") as "text" | "video" | "pdf" | "external",
        body: typeof l.body === "string" ? l.body : "",
        duration_minutes: typeof l.duration_minutes === "number" ? l.duration_minutes : 5,
      }));

    const quizRaw = Array.isArray(parsed.quiz_questions) ? (parsed.quiz_questions as unknown[]) : [];
    const quiz_questions = quizRaw
      .filter((q): q is Record<string, unknown> => q != null && typeof q === "object")
      .map((q) => ({
        question: typeof q.question === "string" ? q.question : "",
        options: Array.isArray(q.options)
          ? (q.options as unknown[]).filter((o): o is string => typeof o === "string")
          : [],
        correct_index: typeof q.correct_index === "number" ? q.correct_index : 0,
      }));

    return {
      title: typeof parsed.title === "string" ? parsed.title : opts.topic,
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      duration_minutes:
        typeof parsed.duration_minutes === "number" ? parsed.duration_minutes : opts.duration_minutes ?? 30,
      lessons,
      quiz_questions,
    };
  } catch (e) {
    log.error("generate_course.exception", { err: e instanceof Error ? e.message : String(e) });
    return { error: e instanceof Error ? e.message : "Course generation failed" };
  }
}
