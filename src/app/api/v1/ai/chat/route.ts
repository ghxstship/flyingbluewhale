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

const SYSTEM = `You are the ATLVS Technologies AI assistant, embedded in a production operations platform (ATLVS console, GVTEWAY portals, COMPVSS mobile) for live events, fabrication, and creative ops. You have tools to query the user's live org data. Use them proactively when asked about projects, invoices, crew, or assignments — then answer with specific numbers and names, not generic advice. Be concise and action-oriented.`;

// Tools that let the AI query live org data — competes with Momentus "Ask Momentus",
// Tripleseat Intelligence conversational analytics, and Deputy AI Insights.
const TOOLS: Anthropic.Tool[] = [
  {
    name: "query_projects",
    description:
      "List the organization's projects with name, XPMS phase, client, and budget. Use when asked about shows, events, programs, or project status.",
    input_schema: {
      type: "object" as const,
      properties: {
        phase: {
          type: "string",
          description: "XPMS phase: concept | development | advance | build | show | strike | wrap",
        },
        limit: { type: "number", description: "Max results (default 10, max 50)" },
      },
      required: [],
    },
  },
  {
    name: "query_financials",
    description:
      "Get financial summary: total invoiced, collected, outstanding, and expense totals. Optionally scoped to a single project.",
    input_schema: {
      type: "object" as const,
      properties: {
        project_id: { type: "string", description: "UUID to scope to one project (omit for org-wide)" },
      },
      required: [],
    },
  },
  {
    name: "query_assignments",
    description:
      "List advancing assignments (tickets, credentials, catering, equipment, lodging, etc.) for a project or the whole org.",
    input_schema: {
      type: "object" as const,
      properties: {
        project_id: { type: "string", description: "UUID of the project to scope to" },
        catalog_kind: {
          type: "string",
          description: "ticket | credential | catering | radio | tool | equipment | uniform | travel | lodging | vehicle",
        },
        fulfillment_state: {
          type: "string",
          description: "briefed | draft | submitted | in_review | approved | issued | redeemed | voided | etc.",
        },
        limit: { type: "number", description: "Max results (default 10, max 50)" },
      },
      required: [],
    },
  },
  {
    name: "search_crew",
    description: "Search for crew members by name or role within the organization.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Name or role keyword to search for" },
        limit: { type: "number", description: "Max results (default 10, max 25)" },
      },
      required: [],
    },
  },
];

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function executeTool(
  name: string,
  input: Record<string, unknown>,
  supabase: SupabaseClient,
  orgId: string,
): Promise<string> {
  try {
    if (name === "query_projects") {
      let q = supabase
        .from("projects")
        .select("id, name, xpms_phase, budget_cents, currency, clients(name)")
        .eq("org_id", orgId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(Math.min(Number(input.limit ?? 10), 50));
      if (input.phase) q = q.eq("xpms_phase", input.phase as string);
      const { data, error } = await q;
      if (error) return `Error querying projects: ${error.message}`;
      if (!data?.length) return "No projects found matching those filters.";
      type ProjectRow = {
        id: string;
        name: string;
        xpms_phase: string | null;
        budget_cents: number | null;
        currency: string;
        clients: { name: string } | null;
      };
      return JSON.stringify(
        (data as ProjectRow[]).map((p) => ({
          id: p.id,
          name: p.name,
          phase: p.xpms_phase,
          budget: p.budget_cents != null ? `$${(p.budget_cents / 100).toLocaleString()} ${p.currency}` : null,
          client: p.clients?.name ?? null,
        })),
        null,
        2,
      );
    }

    if (name === "query_financials") {
      const projectId = input.project_id as string | undefined;
      const scope = (q: ReturnType<typeof supabase.from>) => {
        let r = q.eq("org_id", orgId);
        if (projectId) r = r.eq("project_id", projectId);
        return r;
      };

      const [invResp, expResp] = await Promise.all([
        scope(supabase.from("invoices").select("amount_cents, currency, invoice_state")),
        scope(supabase.from("expenses").select("amount_cents")),
      ]);

      const invoices = (invResp.data ?? []) as Array<{
        amount_cents: number;
        currency: string;
        invoice_state: string;
      }>;
      const totalInvoiced = invoices.reduce((s, i) => s + (i.amount_cents ?? 0), 0);
      const totalPaid = invoices
        .filter((i) => i.invoice_state === "paid")
        .reduce((s, i) => s + i.amount_cents, 0);
      const outstanding = totalInvoiced - totalPaid;
      const expenses = (expResp.data ?? []) as Array<{ amount_cents: number }>;
      const totalExpenses = expenses.reduce((s, e) => s + (e.amount_cents ?? 0), 0);
      const currency = invoices[0]?.currency ?? "USD";

      return JSON.stringify({
        scope: projectId ? `project:${projectId}` : "org-wide",
        total_invoiced: `$${(totalInvoiced / 100).toLocaleString()} ${currency}`,
        total_paid: `$${(totalPaid / 100).toLocaleString()} ${currency}`,
        outstanding: `$${(outstanding / 100).toLocaleString()} ${currency}`,
        total_expenses: `$${(totalExpenses / 100).toLocaleString()} ${currency}`,
        invoice_count: invoices.length,
      });
    }

    if (name === "query_assignments") {
      let q = supabase
        .from("assignments")
        .select("id, title, catalog_kind, fulfillment_state, created_at")
        .eq("org_id", orgId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(Math.min(Number(input.limit ?? 10), 50));
      if (input.project_id) q = q.eq("project_id", input.project_id as string);
      if (input.catalog_kind) q = q.eq("catalog_kind", input.catalog_kind as string);
      if (input.fulfillment_state) q = q.eq("fulfillment_state", input.fulfillment_state as string);
      const { data, error } = await q;
      if (error) return `Error querying assignments: ${error.message}`;
      if (!data?.length) return "No assignments found matching those filters.";
      return JSON.stringify(data, null, 2);
    }

    if (name === "search_crew") {
      const query = (input.query as string) ?? "";
      const { data, error } = await supabase
        .from("crew_members")
        .select("id, name, email, role")
        .eq("org_id", orgId)
        .is("deleted_at", null)
        .ilike("name", `%${query}%`)
        .limit(Math.min(Number(input.limit ?? 10), 25));
      if (error) return `Error searching crew: ${error.message}`;
      if (!data?.length) return `No crew members found matching "${query}".`;
      return JSON.stringify(data, null, 2);
    }

    return `Unknown tool: ${name}`;
  } catch (e) {
    return `Tool execution error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

// Max turns in the tool-use loop — prevents infinite back-and-forth if the
// model keeps requesting tools. 3 is enough for any realistic query chain.
const MAX_TOOL_TURNS = 3;

export async function POST(req: Request) {
  // AI calls cost real dollars and are abuse magnets. 30/min per user, per the
  // documented budget. Limit before model dispatch so we never burn API credit
  // on a flooding client.
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:chat"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "AI rate limit reached; try again shortly");

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

  const baseMessages: Anthropic.MessageParam[] = [
    ...(history ?? [])
      .filter((m: { role: string }) => m.role === "user" || m.role === "assistant")
      .map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    { role: "user" as const, content: input.message },
  ];

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const encoder = new TextEncoder();
  const conversationIdFinal = conversationId;

  const stream = new ReadableStream({
    async start(controller) {
      const encode = (s: string) => encoder.encode(s);
      controller.enqueue(
        encode(`event: start\ndata: ${JSON.stringify({ conversationId: conversationIdFinal })}\n\n`),
      );

      let assistantText = "";
      let totalInputTokens = 0;
      let totalOutputTokens = 0;
      let lastStopReason: string | null = null;

      const messages: Anthropic.MessageParam[] = [...baseMessages];

      try {
        for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
          const s = anthropic.messages.stream({
            model: input.model,
            max_tokens: 4096,
            system: SYSTEM,
            tools: TOOLS,
            messages,
          });

          for await (const event of s) {
            // Only stream text deltas to the client — tool_use input JSON
            // is internal and should not appear in the chat bubble.
            if (event.type === "content_block_delta" && "delta" in event && event.delta.type === "text_delta") {
              assistantText += event.delta.text;
              controller.enqueue(encode(`event: delta\ndata: ${JSON.stringify({ text: event.delta.text })}\n\n`));
            }
          }

          const final = await s.finalMessage();
          totalInputTokens += final.usage?.input_tokens ?? 0;
          totalOutputTokens += final.usage?.output_tokens ?? 0;
          lastStopReason = final.stop_reason;

          if (final.stop_reason !== "tool_use") break;

          // Model requested tool calls — execute them and continue.
          const toolUses = final.content.filter(
            (b: Anthropic.ContentBlock): b is Anthropic.ToolUseBlock => b.type === "tool_use",
          );

          // Append the full assistant message (including tool_use blocks) so
          // the model can see what it asked for when we feed back the results.
          messages.push({ role: "assistant", content: final.content });

          // Send a lightweight thinking event so the client can display a
          // "Looking that up…" indicator without blocking the text stream.
          const toolNames = toolUses.map((tu: Anthropic.ToolUseBlock) => tu.name).join(", ");
          controller.enqueue(
            encode(`event: thinking\ndata: ${JSON.stringify({ tools: toolNames })}\n\n`),
          );

          const toolResults = await Promise.all(
            toolUses.map(async (toolUse: Anthropic.ToolUseBlock) => ({
              type: "tool_result" as const,
              tool_use_id: toolUse.id,
              content: await executeTool(
                toolUse.name,
                toolUse.input as Record<string, unknown>,
                supabase,
                session.orgId,
              ),
            })),
          );

          messages.push({ role: "user", content: toolResults });
        }

        await supabase.from("ai_messages").insert({
          conversation_id: conversationIdFinal,
          role: "assistant",
          content: assistantText,
        });

        // H3-01 — meter AI usage per tenant. Fire-and-forget — failures
        // log but never block the stream response.
        if (totalInputTokens > 0 || totalOutputTokens > 0) {
          void Promise.all([
            recordUsage({
              orgId: session.orgId,
              actorId: session.userId,
              metric: "ai.tokens.input",
              quantity: totalInputTokens,
              unit: "tokens",
              metadata: { model: input.model, conversation_id: conversationIdFinal },
            }),
            recordUsage({
              orgId: session.orgId,
              actorId: session.userId,
              metric: "ai.tokens.output",
              quantity: totalOutputTokens,
              unit: "tokens",
              metadata: { model: input.model, conversation_id: conversationIdFinal },
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
          encode(
            `event: done\ndata: ${JSON.stringify({
              stop_reason: lastStopReason,
              usage: { input_tokens: totalInputTokens, output_tokens: totalOutputTokens },
            })}\n\n`,
          ),
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Stream failed";
        controller.enqueue(encode(`event: error\ndata: ${JSON.stringify({ message: msg })}\n\n`));
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
