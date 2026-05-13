import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiError, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { record as recordUsage } from "@/lib/usage";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

const Schema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().min(1).max(10_000),
  model: z.enum(["claude-opus-4-7", "claude-sonnet-4-6"]).default("claude-sonnet-4-6"),
});

const SYSTEM = `You are the ATLVS Technologies AI assistant, embedded in a production operations platform (ATLVS console, GVTEWAY portals, COMPVSS mobile) for live events, fabrication, and creative ops. Answer questions about the user's projects, invoices, deliverables, and crew using concise, operator-friendly language. Be specific and action-oriented.`;

export async function POST(req: Request) {
  // AI calls cost real dollars and are abuse magnets. 30/min per user, per the
  // documented budget. Limit before model dispatch so we never burn API credit
  // on a flooding client.
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:chat"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "AI rate limit reached; try again shortly");

  if (!env.ANTHROPIC_API_KEY) {
    // 503 + service_unavailable matches the canonical ApiErrorCode shape
    // for env-gated capability misses (mirrors webhook + push handlers).
    return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");
  }
  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;

  const { session } = guard;
  const supabase = await createClient();

  let conversationId = input.conversationId;
  if (!conversationId) {
    const { data, error } = await supabase
      .from("ai_conversations")
      .insert({
        org_id: session.orgId,
        user_id: session.userId,
        title: input.message.slice(0, 48),
      })
      .select()
      .single();
    if (error) return apiError("internal", error.message);
    conversationId = data.id;
  } else {
    // Cross-tenant FK guard on conversationId. Without it, the user
    // could pass a peer's conversation_id and append their message
    // (or read history through the prompt) — RLS may scope by org_id
    // but each conversation is per-user, so we pin both.
    const { data: convo } = await supabase
      .from("ai_conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", session.userId)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (!convo) return apiError("not_found", "Conversation not found");
  }

  const { data: history } = await supabase
    .from("ai_messages")
    .select("role,content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  await supabase.from("ai_messages").insert({
    conversation_id: conversationId,
    role: "user",
    content: input.message,
  });

  const messages = [
    ...(history ?? [])
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: input.message },
  ];

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`event: start\ndata: ${JSON.stringify({ conversationId })}\n\n`));

      let assistantText = "";
      try {
        const s = anthropic.messages.stream({
          model: input.model,
          max_tokens: 4096,
          system: SYSTEM,
          messages,
        });

        for await (const event of s) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            assistantText += event.delta.text;
            controller.enqueue(encoder.encode(`event: delta\ndata: ${JSON.stringify({ text: event.delta.text })}\n\n`));
          }
        }

        const final = await s.finalMessage();

        await supabase.from("ai_messages").insert({
          conversation_id: conversationId,
          role: "assistant",
          content: assistantText,
        });

        // H3-01 — meter AI usage per tenant. Fire-and-forget — failures
        // log but never block the stream response.
        const u = final.usage;
        if (u) {
          void Promise.all([
            recordUsage({
              orgId: session.orgId,
              actorId: session.userId,
              metric: "ai.tokens.input",
              quantity: u.input_tokens ?? 0,
              unit: "tokens",
              metadata: { model: input.model, conversation_id: conversationId },
            }),
            recordUsage({
              orgId: session.orgId,
              actorId: session.userId,
              metric: "ai.tokens.output",
              quantity: u.output_tokens ?? 0,
              unit: "tokens",
              metadata: { model: input.model, conversation_id: conversationId },
            }),
            recordUsage({
              orgId: session.orgId,
              actorId: session.userId,
              metric: "ai.request",
              quantity: 1,
              unit: "count",
              metadata: { model: input.model },
            }),
          ]);
        }

        controller.enqueue(
          encoder.encode(
            `event: done\ndata: ${JSON.stringify({
              stop_reason: final.stop_reason,
              usage: final.usage,
            })}\n\n`,
          ),
        );
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
      "x-conversation-id": conversationId,
    },
  });
}
