import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { env } from "@/lib/env";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";
import { record as recordUsage } from "@/lib/usage";

/**
 * POST /api/v1/ai/generate
 *
 * Non-streaming AI content generator for three modes:
 *   announcement — draft a company announcement from a topic/bullets
 *   course        — generate a full course outline (title + sections + lessons)
 *   schedule      — suggest shift assignments from open shift + crew roster
 *
 * Returns { content: string } for announcement/schedule, { outline: object } for course.
 * Rate-limited to the same AI budget as /api/v1/ai/chat.
 */

const Schema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("announcement"),
    topic: z.string().min(3).max(500),
    audience: z.string().optional(),
    tone: z.enum(["professional", "casual", "urgent"]).default("professional"),
  }),
  z.object({
    mode: z.literal("course"),
    topic: z.string().min(3).max(500),
    duration_minutes: z.number().int().min(5).max(480).optional(),
    role_context: z.string().max(200).optional(),
  }),
  z.object({
    mode: z.literal("schedule"),
    shift_date: z.string(),
    shift_role: z.string(),
    open_slots: z.number().int().min(1).max(50),
    available_crew: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        skills: z.array(z.string()),
        hours_this_week: z.number().optional(),
      }),
    ),
  }),
]);

const SYSTEM = `You are an AI assistant embedded in ATLVS Technologies, a production operations platform for live events, fabrication, and creative ops. Be concise, professional, and action-oriented.`;

const PROMPTS = {
  announcement: (input: z.infer<typeof Schema> & { mode: "announcement" }) =>
    `Write a ${input.tone} internal announcement for an event production company.
Topic: ${input.topic}
${input.audience ? `Audience: ${input.audience}` : ""}

Requirements:
- 2–4 short paragraphs
- Clear opening sentence that states the key news
- Practical details in the body
- Brief closing call-to-action or next steps
- No fluff; operators are busy people

Return only the announcement body text (no subject line or metadata).`,

  course: (input: z.infer<typeof Schema> & { mode: "course" }) =>
    `Generate a structured training course outline for an event production team.
Topic: ${input.topic}
${input.duration_minutes ? `Target duration: ${input.duration_minutes} minutes` : ""}
${input.role_context ? `Role context: ${input.role_context}` : ""}

Return a JSON object with this exact shape:
{
  "title": "Course title",
  "summary": "1–2 sentence overview",
  "sections": [
    {
      "title": "Section title",
      "lessons": [
        { "title": "Lesson title", "kind": "text|video|pdf", "duration_minutes": 5 }
      ]
    }
  ]
}

Aim for 3–5 sections with 2–4 lessons each. Keep titles short and action-oriented.`,

  schedule: (input: z.infer<typeof Schema> & { mode: "schedule" }) =>
    `You are a crew scheduling assistant. Recommend the best crew assignments for an open shift.

Shift: ${input.shift_role} on ${input.shift_date} — ${input.open_slots} slot(s) to fill.

Available crew (name, skills, hours worked this week):
${input.available_crew
  .map((c) => `- ${c.name} | skills: ${c.skills.join(", ")} | hours this week: ${c.hours_this_week ?? "unknown"}`)
  .join("\n")}

Prioritize: 1) relevant skills, 2) lower weekly hours (avoid overtime), 3) availability.

Return a JSON object:
{
  "assignments": [
    { "crew_id": "<id>", "name": "<name>", "reason": "<1 sentence rationale>" }
  ],
  "notes": "<any scheduling cautions or conflicts>"
}

Only include up to ${input.open_slots} assignments.`,
};

export async function POST(req: Request) {
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:generate"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "AI rate limit reached; try again shortly");

  if (!env.ANTHROPIC_API_KEY) {
    return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");
  }

  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  const prompt = PROMPTS[input.mode](input as never);
  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: input.mode === "course" || input.mode === "schedule" ? 2048 : 1024,
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content.find((b) => b.type === "text")?.text ?? "";

  void Promise.all([
    recordUsage({
      orgId: session.orgId,
      actorId: session.userId,
      metric: "ai.tokens.input",
      quantity: message.usage.input_tokens,
      unit: "tokens",
      metadata: { model: "claude-sonnet-4-6", mode: input.mode },
    }),
    recordUsage({
      orgId: session.orgId,
      actorId: session.userId,
      metric: "ai.tokens.output",
      quantity: message.usage.output_tokens,
      unit: "tokens",
      metadata: { model: "claude-sonnet-4-6", mode: input.mode },
    }),
  ]);

  if (input.mode === "course" || input.mode === "schedule") {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return apiError("internal", "AI returned malformed JSON");
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return apiOk({ [input.mode === "course" ? "outline" : "assignments"]: parsed });
    } catch {
      return apiError("internal", "AI returned invalid JSON");
    }
  }

  return apiOk({ content: text.trim() });
}
