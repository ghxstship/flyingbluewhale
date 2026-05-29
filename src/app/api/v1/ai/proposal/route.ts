import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiOk, apiError, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";
import type { LooseSupabase } from "@/lib/supabase/loose";

const Schema = z.object({
  client_name: z.string().min(1).max(200),
  event_type: z.string().min(1).max(200),
  event_dates: z.string().max(200).optional(),
  scope_summary: z.string().min(10).max(2000),
  budget_range: z.string().max(200).optional(),
  proposal_id: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:proposal"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "AI rate limit reached; try again shortly");

  if (!env.ANTHROPIC_API_KEY) return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");

  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  const prompt = `You are the proposal writer for ATLVS Technologies — a premium live-events production company known for luxury self-confidence and operational excellence. Write a compelling, professional proposal narrative for the following engagement.

CLIENT: ${input.client_name}
EVENT TYPE: ${input.event_type}
${input.event_dates ? `EVENT DATES: ${input.event_dates}` : ""}
SCOPE: ${input.scope_summary}
${input.budget_range ? `BUDGET RANGE: ${input.budget_range}` : ""}

Write a proposal narrative (500–800 words) with these sections:
1. Executive Overview — why ATLVS is the right partner (2–3 sentences, confident and direct)
2. Our Approach — how we'll execute this specific event
3. What We Deliver — 4–6 concrete deliverables as a bulleted list
4. Timeline & Next Steps — high-level milestones

Tone: premium, direct, zero competitor comparisons, luxury self-confidence with hacker irreverence. First person plural ("We", "Our team"). No filler phrases like "We are excited to" or "We are pleased to".`;

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  let draftContent: string;
  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });
    const block = msg.content[0];
    draftContent = block.type === "text" ? block.text.trim() : "";
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Anthropic error";
    return apiError("internal", msg);
  }

  if (!draftContent) return apiError("internal", "AI returned empty proposal draft");

  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { data: row, error } = await supabase
    .from("ai_proposal_drafts")
    .insert({
      org_id: session.orgId,
      proposal_id: input.proposal_id ?? null,
      prompt_context: {
        client_name: input.client_name,
        event_type: input.event_type,
        event_dates: input.event_dates ?? null,
        scope_summary: input.scope_summary,
        budget_range: input.budget_range ?? null,
      },
      draft_content: draftContent,
      draft_state: "generated",
      created_by: session.userId,
    })
    .select("id, draft_content, draft_state, created_at")
    .single();

  if (error) return apiError("internal", error.message);
  return apiOk(row);
}
