import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiCreated, apiError, parseJson } from "@/lib/api";
import { isManagerPlus, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { record as recordUsage } from "@/lib/usage";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

// AI proposal drafting. Mirrors /api/v1/ai/chat (Anthropic dispatch, usage
// metering, rate-limit-before-spend) but resolves to a single non-streamed
// draft persisted into ai_proposal_drafts so the proposal detail page can
// render the latest copy. draft_state is an LDP-named lifecycle column
// (briefed → generated → accepted/discarded), never a bare `status`.
const Schema = z.object({
  proposalId: z.string().uuid(),
  instructions: z.string().max(2_000).optional(),
  model: z.enum(["claude-opus-4-7", "claude-sonnet-4-6"]).default("claude-sonnet-4-6"),
});

const SYSTEM = `You are the ATLVS Technologies proposal-writing assistant, embedded in a production operations platform for live events, fabrication, and creative ops. Draft a polished, client-ready proposal in clean markdown given the proposal metadata and any operator instructions. Use a confident, premium voice; never compare to competitors. Cover scope, approach, deliverables, timeline, and a brief commercial summary. Keep it tight and operator-grade. No filler.`;

export async function POST(req: Request) {
  // AI calls cost real dollars and are abuse magnets. Limit before model
  // dispatch so we never burn API credit on a flooding client.
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:propose"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "AI rate limit reached; try again shortly");

  if (!env.ANTHROPIC_API_KEY) {
    return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");
  }

  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  // Drafting writes a row + spends API credit — gate it to manager+.
  if (!isManagerPlus(session)) {
    return apiError("forbidden", "Manager access required to generate a proposal draft");
  }

  const supabase = await createClient();

  // Cross-tenant FK guard — pin the proposal to the caller's org. RLS would
  // also block, but an explicit 404 is clearer than an opaque insert error.
  const { data: proposal } = await supabase
    .from("proposals")
    .select("id, title, notes, amount_cents, proposal_state, version")
    .eq("id", input.proposalId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!proposal) return apiError("not_found", "Proposal not found");

  const promptContext = {
    title: proposal.title,
    notes: proposal.notes ?? null,
    amount_cents: proposal.amount_cents ?? null,
    proposal_state: proposal.proposal_state,
    version: proposal.version,
    instructions: input.instructions ?? null,
  };

  const userPrompt = [
    `Proposal title: ${proposal.title}`,
    proposal.amount_cents != null ? `Target amount (cents): ${proposal.amount_cents}` : null,
    proposal.notes ? `Scope notes:\n${proposal.notes}` : null,
    input.instructions ? `Operator instructions:\n${input.instructions}` : null,
    "Draft the full proposal now.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  let draftContent = "";
  let usage: Anthropic.Messages.Usage | null = null;
  try {
    const message = await anthropic.messages.create({
      model: input.model,
      max_tokens: 4096,
      system: SYSTEM,
      messages: [{ role: "user", content: userPrompt }],
    });
    draftContent = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    usage = message.usage;
  } catch (e) {
    return apiError("internal", e instanceof Error ? e.message : "Draft generation failed");
  }

  if (!draftContent.trim()) {
    return apiError("internal", "Model returned an empty draft");
  }

  const { data: draft, error } = await supabase
    .from("ai_proposal_drafts")
    .insert({
      org_id: session.orgId,
      proposal_id: proposal.id,
      created_by: session.userId,
      draft_state: "generated",
      draft_content: draftContent,
      prompt_context: promptContext,
    })
    .select("id, draft_state, draft_content, created_at")
    .single();
  if (error) return apiError("internal", error.message);

  // Meter AI usage per tenant. Fire-and-forget — failures log but never
  // block the response.
  if (usage) {
    void Promise.all([
      recordUsage({
        orgId: session.orgId,
        actorId: session.userId,
        metric: "ai.tokens.input",
        quantity: usage.input_tokens ?? 0,
        unit: "tokens",
        metadata: { model: input.model, proposal_id: proposal.id, surface: "propose" },
      }),
      recordUsage({
        orgId: session.orgId,
        actorId: session.userId,
        metric: "ai.tokens.output",
        quantity: usage.output_tokens ?? 0,
        unit: "tokens",
        metadata: { model: input.model, proposal_id: proposal.id, surface: "propose" },
      }),
      recordUsage({
        orgId: session.orgId,
        actorId: session.userId,
        metric: "ai.request",
        quantity: 1,
        unit: "count",
        metadata: { model: input.model, surface: "propose" },
      }),
    ]);
  }

  return apiCreated(draft);
}
