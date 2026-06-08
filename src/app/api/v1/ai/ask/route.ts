import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiError, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

const Schema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().min(1).max(4_000),
  guideContext: z.string().max(16_000).optional(),
});

function buildSystem(guideContext?: string) {
  const base = `You are the COMPVSS field assistant for ATLVS Technologies — a knowledge agent embedded in the mobile app used by on-site crew, performers, vendors, and guests at live events.

Answer questions about THIS event using the provided event guide below. Be concise, direct, and use plain language. Format lists and steps clearly. If the answer isn't in the guide, say so honestly and suggest who to contact.

Never fabricate schedules, contacts, or procedures that aren't in the guide.`;

  if (!guideContext) return base;
  return `${base}

---
EVENT GUIDE CONTENT:
${guideContext}
---`;
}

export async function POST(req: Request) {
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:ask"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "Rate limit reached; try again shortly");

  if (!env.ANTHROPIC_API_KEY) {
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
        title: `Ask: ${input.message.slice(0, 48)}`,
      })
      .select()
      .single();
    if (error) return apiError("internal", error.message);
    conversationId = data.id;
  } else {
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
    .order("created_at", { ascending: true })
    .limit(20);

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
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          system: buildSystem(input.guideContext),
          messages,
        });

        for await (const event of s) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            assistantText += event.delta.text;
            controller.enqueue(encoder.encode(`event: delta\ndata: ${JSON.stringify({ text: event.delta.text })}\n\n`));
          }
        }

        await supabase.from("ai_messages").insert({
          conversation_id: conversationId,
          role: "assistant",
          content: assistantText,
        });

        controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
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
