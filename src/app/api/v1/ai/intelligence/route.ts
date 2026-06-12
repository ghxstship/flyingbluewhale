import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiOk, apiError, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";
import type { IntelligenceMode } from "@/lib/intelligence";

const Schema = z.object({
  mode: z.enum(["ask", "act"]),
  query: z.string().min(1).max(4_000),
  // For act mode: whether the operator has confirmed the plan and we should execute.
  confirm: z.boolean().optional().default(false),
  // For act mode re-execution: the session id of the plan to confirm.
  session_id: z.string().uuid().optional(),
});

// System prompt injected for the operations-native context.
const SYSTEM = `You are ATLVS Intelligence, an operations AI agent embedded in the ATLVS Technologies live-event production platform. You have read access to the org's live operational data (crew, projects, assignments, schedules, inventory, finance).

When in ASK mode:
- Answer the user's question using the provided context data.
- Always cite the source record(s) you referenced using JSON citations in this format at the end of your answer:
  CITATIONS: [{"table":"shifts","id":"<uuid>","label":"Saturday Load-in"}]
- Be concise and operator-friendly. No marketing language.

When in ACT mode:
- Propose a concrete action plan as a numbered list of discrete, reversible steps.
- Each step must be specific (include names, dates, IDs where relevant).
- End your response with a JSON plan block:
  PLAN: [{"kind":"create_shift","label":"Create Saturday Load-in shift","payload":{},"reversible":true}]
- Do NOT execute anything — just propose the plan for confirmation.`;

export async function POST(req: Request) {
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:intelligence"), ...RATE_BUDGETS.ai });
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

  const startMs = Date.now();

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const completion = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `MODE: ${input.mode.toUpperCase()}\n\nQUERY: ${input.query}`,
      },
    ],
  });

  const rawText =
    completion.content[0].type === "text" ? completion.content[0].text : "";

  // Parse citations or plan JSON blocks out of the response.
  let responseJson: Record<string, unknown> = { answer: rawText };

  if (input.mode === "ask") {
    const citationMatch = rawText.match(/CITATIONS:\s*(\[.*?\])/s);
    const answer = citationMatch ? rawText.slice(0, citationMatch.index).trim() : rawText;
    let citations = [];
    if (citationMatch) {
      try { citations = JSON.parse(citationMatch[1]); } catch { /* malformed — skip */ }
    }
    responseJson = { answer, citations };
  } else {
    const planMatch = rawText.match(/PLAN:\s*(\[.*?\])/s);
    const description = planMatch ? rawText.slice(0, planMatch.index).trim() : rawText;
    let plan = [];
    if (planMatch) {
      try { plan = JSON.parse(planMatch[1]); } catch { /* malformed — skip */ }
    }
    responseJson = { description, plan, confirmed: false };
  }

  // Persist session to ai_intelligence_sessions.
  const { data: sessionRow, error: insertErr } = await supabase
    .from("ai_intelligence_sessions")
    .insert({
      org_id: session.orgId,
      user_id: session.userId,
      mode: input.mode as IntelligenceMode,
      query: input.query,
      response_json: responseJson,
      model: "claude-sonnet-4-6",
      input_tokens: completion.usage.input_tokens,
      output_tokens: completion.usage.output_tokens,
      latency_ms: Date.now() - startMs,
    })
    .select("id")
    .single();

  if (insertErr) {
    return apiError("internal", insertErr.message);
  }

  return apiOk({ session_id: sessionRow.id, mode: input.mode, ...responseJson });
}
