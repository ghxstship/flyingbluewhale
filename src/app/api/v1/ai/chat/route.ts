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

const SYSTEM = `You are the ATLVS Technologies AI assistant, embedded in a production operations platform (ATLVS console, GVTEWAY portals, COMPVSS mobile) for live events, fabrication, and creative ops. Answer questions about the user's projects, invoices, deliverables, and crew using concise, operator-friendly language. Be specific and action-oriented.

You have access to live workspace tools. Use them when the user asks about specific projects, tasks, crew, budgets, or events. Always cite the data you retrieved.`;

// Workspace intelligence tools — ClickUp Brain / Asana AI Teammates parity.
const AI_TOOLS: Anthropic.Tool[] = [
  {
    name: "query_projects",
    description: "List projects for this org. Use when the user asks about project status, what's active, what's upcoming, or project health.",
    input_schema: {
      type: "object" as const,
      properties: {
        phase: { type: "string", description: "Filter by xpms_phase value (e.g. discovery, planning, active, closeout)" },
        limit: { type: "number", description: "Max rows to return (default 15)" },
      },
    },
  },
  {
    name: "query_overdue_tasks",
    description: "Return tasks whose due date has passed and are not yet complete. Use when the user asks what's overdue, blocked, or behind.",
    input_schema: {
      type: "object" as const,
      properties: {
        project_id: { type: "string", description: "Scope to a single project UUID" },
        limit: { type: "number", description: "Max rows (default 20)" },
      },
    },
  },
  {
    name: "query_crew_availability",
    description: "Return crew members with their current shift and time-entry state. Use when the user asks who is available, scheduled, or clocked in.",
    input_schema: {
      type: "object" as const,
      properties: {
        project_id: { type: "string", description: "Scope to crew assigned to a project" },
        limit: { type: "number", description: "Max rows (default 25)" },
      },
    },
  },
  {
    name: "query_budget_health",
    description: "Return budget vs actual spend for projects. Use when the user asks about budget, spend, overrun, or financial health.",
    input_schema: {
      type: "object" as const,
      properties: {
        project_id: { type: "string", description: "Specific project UUID, or omit for org-wide summary" },
      },
    },
  },
  {
    name: "query_upcoming_events",
    description: "Return upcoming events and show dates for the org. Use when the user asks what's coming up, next shows, or event schedule.",
    input_schema: {
      type: "object" as const,
      properties: {
        days: { type: "number", description: "Look-ahead window in days (default 30)" },
      },
    },
  },
];

type ToolInput = Record<string, unknown>;

async function executeTools(
  content: Anthropic.ContentBlock[],
  supabase: Awaited<ReturnType<typeof createClient>>,
  session: { orgId: string; userId: string },
): Promise<Anthropic.ToolResultBlockParam[]> {
  const results: Anthropic.ToolResultBlockParam[] = [];

  for (const block of content) {
    if (block.type !== "tool_use") continue;
    const input = (block.input ?? {}) as ToolInput;
    let data: unknown;

    try {
      if (block.name === "query_projects") {
        const q = supabase
          .from("projects")
          .select("id, name, xpms_phase, start_date, end_date, budget_cents, updated_at")
          .eq("org_id", session.orgId)
          .is("deleted_at", null)
          .order("updated_at", { ascending: false })
          .limit(typeof input.limit === "number" ? input.limit : 15);
        if (input.phase) q.eq("xpms_phase", input.phase as string);
        const { data: rows } = await q;
        data = rows ?? [];
      } else if (block.name === "query_overdue_tasks") {
        const now = new Date().toISOString();
        const q = supabase
          .from("tasks")
          .select("id, title, due_date, assignee_id, project_id, created_at")
          .eq("org_id", session.orgId)
          .lt("due_date", now)
          .not("status", "in", '("done","cancelled")')
          .order("due_date", { ascending: true })
          .limit(typeof input.limit === "number" ? input.limit : 20);
        if (input.project_id) q.eq("project_id", input.project_id as string);
        const { data: rows } = await q;
        data = rows ?? [];
      } else if (block.name === "query_crew_availability") {
        const q = supabase
          .from("crew_members")
          .select("id, name, role, email")
          .eq("org_id", session.orgId)
          .order("name")
          .limit(typeof input.limit === "number" ? input.limit : 25);
        if (input.project_id) {
          // crew_members don't have project_id directly; skip filter if provided
        }
        const { data: rows } = await q;
        data = rows ?? [];
      } else if (block.name === "query_budget_health") {
        if (input.project_id) {
          const [{ data: project }, { data: expenses }, { data: time }] = await Promise.all([
            supabase
              .from("projects")
              .select("id, name, budget_cents")
              .eq("id", input.project_id as string)
              .eq("org_id", session.orgId)
              .maybeSingle(),
            supabase
              .from("expenses")
              .select("amount_cents")
              .eq("project_id", input.project_id as string)
              .eq("org_id", session.orgId),
            supabase
              .from("time_entries")
              .select("duration_minutes, rate_cents")
              .eq("project_id", input.project_id as string)
              .eq("org_id", session.orgId),
          ]);
          const expenseTotal = (expenses ?? []).reduce((s, r) => s + (r.amount_cents ?? 0), 0);
          const timeTotal = (time ?? []).reduce(
            (s, r) => s + Math.round(((r.duration_minutes ?? 0) / 60) * (r.rate_cents ?? 0)),
            0,
          );
          data = {
            project: project ?? {},
            expense_spend_cents: expenseTotal,
            time_spend_cents: timeTotal,
            total_spend_cents: expenseTotal + timeTotal,
            budget_cents: (project as { budget_cents?: number } | null)?.budget_cents ?? null,
          };
        } else {
          const { data: projects } = await supabase
            .from("projects")
            .select("id, name, budget_cents")
            .eq("org_id", session.orgId)
            .is("deleted_at", null)
            .order("name")
            .limit(10);
          data = projects ?? [];
        }
      } else if (block.name === "query_upcoming_events") {
        const days = typeof input.days === "number" ? input.days : 30;
        const until = new Date(Date.now() + days * 86_400_000).toISOString();
        const { data: rows } = await supabase
          .from("events")
          .select("id, name, starts_at, ends_at, location_id")
          .eq("org_id", session.orgId)
          .gte("starts_at", new Date().toISOString())
          .lte("starts_at", until)
          .order("starts_at")
          .limit(20);
        data = rows ?? [];
      } else {
        data = { error: "unknown tool" };
      }
    } catch (e) {
      data = { error: e instanceof Error ? e.message : "tool_error" };
    }

    results.push({
      type: "tool_result",
      tool_use_id: block.id,
      content: JSON.stringify(data),
    });
  }

  return results;
}

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

  const baseMessages: Anthropic.MessageParam[] = [
    ...(history ?? [])
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content as string })),
    { role: "user" as const, content: input.message },
  ];

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`event: start\ndata: ${JSON.stringify({ conversationId })}\n\n`));

      let assistantText = "";
      try {
        // Phase 1: non-streaming call with tools to resolve any tool use.
        // This adds ~200–500 ms latency but keeps the final stream clean.
        let finalMessages: Anthropic.MessageParam[] = baseMessages;

        const probe = await anthropic.messages.create({
          model: input.model,
          max_tokens: 1024,
          system: SYSTEM,
          messages: baseMessages,
          tools: AI_TOOLS,
          tool_choice: { type: "auto" },
        });

        if (probe.stop_reason === "tool_use") {
          const toolResults = await executeTools(probe.content, supabase, session);
          finalMessages = [
            ...baseMessages,
            { role: "assistant", content: probe.content },
            { role: "user", content: toolResults },
          ];
        }

        // Phase 2: stream the final response (no tools — pure text).
        const s = anthropic.messages.stream({
          model: input.model,
          max_tokens: 4096,
          system: SYSTEM,
          messages: finalMessages,
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
