import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiOk, apiCreated, apiError, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

// AI Course Builder — mirrors Connecteam's AI Course/Training Builder (2025).
// Accepts a natural language prompt + optional source material, returns a
// structured course outline (objectives, lessons, quiz questions) as JSON,
// and persists a course_ai_generations row so the operator can review and
// attach the content to an existing or new course.

const Schema = z.object({
  prompt: z.string().min(10).max(2_000),
  source_material: z.string().max(20_000).optional(),
  course_id: z.string().uuid().optional(),
  lesson_count: z.number().int().min(1).max(20).default(5),
  quiz_question_count: z.number().int().min(0).max(20).default(5),
});

const SYSTEM = `You are an instructional designer embedded in the ATLVS Technologies platform. Generate structured training course content for live event production crews.

Always respond with valid JSON matching EXACTLY this schema (no extra keys):
{
  "objectives": ["string", ...],  // 3-5 learning objectives
  "lessons": [
    {
      "title": "string",
      "kind": "text",            // always "text" for generated content
      "body": "string",          // markdown formatted lesson body
      "duration_min": number     // estimated reading/watch time in minutes
    }
  ],
  "quiz_questions": [
    {
      "stem": "string",          // the question
      "choices": ["string", ...],// 4 choices
      "correct_index": number    // 0-based index of correct answer
    }
  ]
}

Keep lesson bodies concise, safety-focused, and relevant to professional event production. Use plain language appropriate for field crew.`;

export async function POST(req: Request) {
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:course-builder"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "AI rate limit reached; try again shortly");

  if (!env.ANTHROPIC_API_KEY) {
    return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");
  }

  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  if (!["owner", "admin", "manager"].includes(session.role ?? "")) {
    return apiError("forbidden", "Manager role required to generate course content");
  }

  const supabase = await createClient();

  // Create a generation row in 'queued' state.
  const { data: genRow, error: insertErr } = await supabase
    .from("course_ai_generations")
    .insert({
      org_id: session.orgId,
      course_id: input.course_id ?? null,
      created_by: session.userId,
      prompt: input.prompt,
      source_material: input.source_material ?? null,
      gen_phase: "generating",
    })
    .select("id")
    .single();

  if (insertErr) return apiError("internal", insertErr.message);

  const userContent = [
    `Generate a training course for: ${input.prompt}`,
    `Target lesson count: ${input.lesson_count}`,
    `Target quiz question count: ${input.quiz_question_count}`,
    input.source_material
      ? `Use this source material as the basis:\n---\n${input.source_material}\n---`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const completion = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4_000,
      system: SYSTEM,
      messages: [{ role: "user", content: userContent }],
    });

    const rawText =
      completion.content[0].type === "text" ? completion.content[0].text : "{}";

    let generated_json: Record<string, unknown> = {};
    try {
      // Strip markdown code fences if the model wrapped the JSON.
      const cleaned = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      generated_json = JSON.parse(cleaned);
    } catch {
      // If parsing fails, store the raw text so the operator can recover it.
      generated_json = { raw: rawText };
    }

    await supabase
      .from("course_ai_generations")
      .update({
        generated_json,
        gen_phase: "complete",
        model: "claude-sonnet-4-6",
        input_tokens: completion.usage.input_tokens,
        output_tokens: completion.usage.output_tokens,
        completed_at: new Date().toISOString(),
      })
      .eq("id", genRow.id);

    return apiCreated({ generation_id: genRow.id, ...generated_json });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await supabase
      .from("course_ai_generations")
      .update({ gen_phase: "error", error_message: message })
      .eq("id", genRow.id);
    return apiError("internal", message);
  }
}
