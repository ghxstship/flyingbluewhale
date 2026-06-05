"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

const Schema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().max(2000).optional().or(z.literal("")),
  duration_minutes: z.string().optional().or(z.literal("")),
  required_for_role: z.string().max(80).optional().or(z.literal("")),
});

export type State = { error?: string } | null;

const GenerateSchema = z.object({
  topic: z.string().min(3).max(500),
});

export async function generateCourseAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can generate courses" };
  const parsed = GenerateSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid topic" };

  if (!env.ANTHROPIC_API_KEY) return { error: "AI generation is not configured (missing ANTHROPIC_API_KEY)" };

  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const prompt = `You are a training content specialist for live event production crews. Generate a practical training course on the following topic.

Topic: ${parsed.data.topic}

Return ONLY valid JSON with this exact schema (no markdown, no commentary):
{
  "title": "string (concise, max 100 chars)",
  "summary": "string (2-3 sentences describing what the trainee will learn, max 400 chars)",
  "duration_minutes": number (15 to 120),
  "lessons": [
    {
      "title": "string (max 100 chars)",
      "body": "string (practical content with clear steps or key points, 150-600 chars)"
    }
  ]
}

Include 4-6 lessons. Focus on safety, standard operating procedures, and field-ready knowledge.`;

  let raw = "";
  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });
    raw = msg.content[0]?.type === "text" ? msg.content[0].text : "";
  } catch {
    return { error: "AI generation failed — try again in a moment" };
  }

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { error: "AI returned an unexpected format — try a more specific topic" };

  let generated: {
    title: string;
    summary: string;
    duration_minutes: number;
    lessons: Array<{ title: string; body: string }>;
  };
  try {
    generated = JSON.parse(jsonMatch[0]);
  } catch {
    return { error: "Failed to parse AI response — try again" };
  }

  const supabase = await createClient();

  const { data: course, error: ce } = await supabase
    .from("courses")
    .insert({
      org_id: session.orgId,
      title: (generated.title ?? parsed.data.topic).slice(0, 200),
      summary: generated.summary?.slice(0, 2000) || null,
      duration_minutes: Number.isFinite(generated.duration_minutes) ? Math.max(1, generated.duration_minutes) : null,
      created_by: session.userId,
    })
    .select("id")
    .single();

  if (ce || !course) return { error: ce?.message ?? "Failed to create course" };

  if (Array.isArray(generated.lessons) && generated.lessons.length > 0) {
    const lessonRows = generated.lessons.slice(0, 10).map((l, i) => ({
      course_id: course.id,
      ordinal: i + 1,
      title: String(l.title ?? "").slice(0, 200) || `Lesson ${i + 1}`,
      body: String(l.body ?? "").slice(0, 4000) || null,
      lesson_kind: "text" as const,
    }));
    await supabase.from("course_lessons").insert(lessonRows);
  }

  revalidatePath("/console/workforce/courses");
  redirect(`/console/workforce/courses/${course.id}`);
  return null;
}

export async function createCourseAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  // Course creation is a content-authoring action — manager+ only.
  if (!isManagerPlus(session)) return { error: "Only manager+ can author courses" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();

  const dur = parsed.data.duration_minutes ? Number(parsed.data.duration_minutes) : null;
  const { data, error } = await supabase
    .from("courses")
    .insert({
      org_id: session.orgId,
      title: parsed.data.title,
      summary: parsed.data.summary || null,
      duration_minutes: Number.isFinite(dur as number) ? dur : null,
      required_for_role: parsed.data.required_for_role || null,
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/console/workforce/courses");
  redirect(`/console/workforce/courses/${data.id}`);
  return null;
}
