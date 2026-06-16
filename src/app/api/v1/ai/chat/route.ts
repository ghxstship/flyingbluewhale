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

const BASE_SYSTEM = `You are the ATLVS Technologies AI assistant, embedded in a production operations platform (ATLVS console, GVTEWAY portals, COMPVSS mobile) for live events, fabrication, and creative ops. Answer questions about the user's projects, invoices, deliverables, and crew using concise, operator-friendly language. Be specific and action-oriented.`;

/** Fetch live workspace context for the requesting org and inject it into the
 *  system prompt so the AI can answer operational questions without tool calls.
 *  This is the "Ask Mo" (Momentus) / "Bizzy" (Bizzabo) AI copilot pattern —
 *  pre-load a snapshot of the org's current state so the assistant can answer
 *  questions like "how many open invoices do I have?" from real data. */
async function buildSystemPrompt(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  const in30 = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);

  const [projectsRes, invoicesRes, assignmentsRes, crewRes] = await Promise.allSettled([
    supabase
      .from("projects")
      .select("name, xpms_phase")
      .eq("org_id", orgId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(20),
    supabase
      .from("invoices")
      .select("number, title, amount_cents, currency, invoice_state")
      .eq("org_id", orgId)
      .in("invoice_state", ["draft", "sent", "overdue"])
      .is("deleted_at", null)
      .limit(15),
    supabase
      .from("assignments")
      .select("title, catalog_kind, fulfillment_state, deadline")
      .eq("org_id", orgId)
      .in("fulfillment_state", ["briefed", "issued", "in_review"])
      .gte("deadline", today)
      .lte("deadline", in30)
      .is("deleted_at", null)
      .order("deadline", { ascending: true })
      .limit(20),
    supabase
      .from("crew_members")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .is("deleted_at", null),
  ]);

  const projects = projectsRes.status === "fulfilled" ? (projectsRes.value.data ?? []) : [];
  const invoices = invoicesRes.status === "fulfilled" ? (invoicesRes.value.data ?? []) : [];
  const upcoming  = assignmentsRes.status === "fulfilled" ? (assignmentsRes.value.data ?? []) : [];
  const crewCount = crewRes.status === "fulfilled" ? (crewRes.value.count ?? 0) : 0;

  const sections: string[] = [];

  if (projects.length > 0) {
    sections.push(
      `Active projects (${projects.length}):\n` +
        projects
          .map((p: { name: string; xpms_phase: string }) => `  • ${p.name} [${p.xpms_phase ?? "—"}]`)
          .join("\n"),
    );
  }

  if (invoices.length > 0) {
    sections.push(
      `Open invoices (${invoices.length}):\n` +
        invoices
          .map(
            (i: { number: string; title: string; amount_cents: number; currency: string; invoice_state: string }) =>
              `  • #${i.number} "${i.title}" ${(i.amount_cents / 100).toFixed(2)} ${i.currency} [${i.invoice_state}]`,
          )
          .join("\n"),
    );
  }

  if (upcoming.length > 0) {
    sections.push(
      `Upcoming assignments (next 30 days, ${upcoming.length}):\n` +
        upcoming
          .map(
            (a: { title: string | null; catalog_kind: string; fulfillment_state: string; deadline: string | null }) =>
              `  • ${a.title ?? a.catalog_kind}: ${a.fulfillment_state}, due ${a.deadline ?? "TBD"}`,
          )
          .join("\n"),
    );
  }

  if (crewCount > 0) {
    sections.push(`Crew roster size: ${crewCount} members`);
  }

  if (sections.length === 0) return BASE_SYSTEM;

  return `${BASE_SYSTEM}\n\nCurrent workspace context (${today}):\n${sections.join("\n\n")}`
};

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

  // Last 40 turns only — long conversations otherwise resend the entire
  // history every request, growing token cost without bound. Fetch newest
  // first with a cap, then restore chronological order for the model.
  const { data: historyDesc } = await supabase
    .from("ai_messages")
    .select("role,content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(40);
  const history = (historyDesc ?? []).reverse();

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

  // Build an org-context-enriched system prompt for the first message in a
  // conversation (subsequent turns reuse the pre-fetched context already in
  // the conversation history). Building on every turn is wasteful; only the
  // first user message triggers the workspace snapshot.
  const systemPrompt =
    history && history.length > 0 ? BASE_SYSTEM : await buildSystemPrompt(supabase, session.orgId);

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
          system: systemPrompt,
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
