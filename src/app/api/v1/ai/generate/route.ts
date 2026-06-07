import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiError, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { env } from "@/lib/env";
import { record as recordUsage } from "@/lib/usage";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

const Schema = z.object({
  type: z.enum(["announcement", "course_outline", "proposal_draft"]),
  context: z.object({
    topic: z.string().min(1).max(500),
    audience: z.string().max(200).optional(),
    projectName: z.string().max(200).optional(),
    notes: z.string().max(2000).optional(),
  }),
  model: z.enum(["claude-opus-4-7", "claude-sonnet-4-6"]).default("claude-sonnet-4-6"),
});

const SYSTEM_BY_TYPE = {
  announcement: `You are an internal communications writer for ATLVS Technologies, a live-event production platform. Write workplace announcements that are direct, professional, and action-oriented. Always return valid JSON: {"title": "...", "body": "..."}. The title should be under 120 characters. The body should be 2–4 short paragraphs in plain text (no markdown, no bullet points). Match the tone to the audience.`,

  course_outline: `You are a training content designer for ATLVS Technologies. Create structured course outlines for production, events, and deskless workforce training. Always return valid JSON: {"title": "...", "summary": "...", "lessons": [{"title": "...", "objective": "..."}]}. Include 3–6 lessons. Each lesson title should be under 80 characters. The summary should be 1–2 sentences.`,

  proposal_draft: `You are a senior account manager at ATLVS Technologies writing client-facing production proposals. Write a scope / executive summary section. Always return valid JSON: {"title": "...", "notes": "..."}. The title should be under 120 characters. The notes field should be 2–3 paragraphs of scope narrative in plain text — professional, confident, no filler phrases.`,
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

  const contextParts = [
    `Topic: ${input.context.topic}`,
    input.context.audience ? `Audience: ${input.context.audience}` : null,
    input.context.projectName ? `Project: ${input.context.projectName}` : null,
    input.context.notes ? `Additional notes: ${input.context.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let fullText = "";
      try {
        const s = anthropic.messages.stream({
          model: input.model,
          max_tokens: 1024,
          system: SYSTEM_BY_TYPE[input.type],
          messages: [{ role: "user", content: contextParts }],
        });

        for await (const event of s) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            fullText += event.delta.text;
            controller.enqueue(encoder.encode(`event: delta\ndata: ${JSON.stringify({ text: event.delta.text })}\n\n`));
          }
        }

        const final = await s.finalMessage();
        const u = final.usage;
        if (u) {
          void Promise.all([
            recordUsage({
              orgId: session.orgId,
              actorId: session.userId,
              metric: "ai.tokens.input",
              quantity: u.input_tokens ?? 0,
              unit: "tokens",
              metadata: { model: input.model, type: input.type },
            }),
            recordUsage({
              orgId: session.orgId,
              actorId: session.userId,
              metric: "ai.tokens.output",
              quantity: u.output_tokens ?? 0,
              unit: "tokens",
              metadata: { model: input.model, type: input.type },
            }),
          ]);
        }

        controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({ result: fullText })}\n\n`));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Stream failed";
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: msg })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
    },
  });
}
