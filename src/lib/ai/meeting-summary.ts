import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";
import { log } from "@/lib/log";
import type { ActionItem } from "@/lib/meeting-notes";

/**
 * F1 — Meeting transcript summarization.
 *
 * Mirrors the non-streaming Anthropic pattern in
 * `src/lib/ai/extract-credential.ts`: strict JSON-only system prompt,
 * `claude-sonnet-4-6`, content-union narrowing, brace-match JSON parse.
 *
 * Returns a recap `summary` plus a list of extracted `action_items`. The
 * caller (the Summarize server action) persists both onto the
 * `meeting_notes` row and flips `note_state` to `summarized`.
 */

const SYSTEM = `You are a meeting notetaker for a live-events / production operations platform.
You receive a raw meeting transcript and produce a concise recap plus a list of concrete action items.
Respond with ONLY a JSON object matching this shape, no prose, no markdown fences:
{
  "summary": "A tight 2-5 sentence recap of decisions, status, and outcomes. Operator-friendly.",
  "action_items": [
    { "text": "imperative phrasing of the task", "owner": "person named or null", "due": "YYYY-MM-DD or null" }
  ]
}
Extract every commitment, follow-up, or assignment as an action item. If no owner or due date is stated, use null.
If the transcript is empty or has no actionable content, return an empty action_items array.`;

export type SummaryResult =
  | { summary: string; actionItems: ActionItem[] }
  | { error: string };

export async function summarizeTranscript(transcript: string): Promise<SummaryResult> {
  if (!env.ANTHROPIC_API_KEY) return { error: "ANTHROPIC_API_KEY not configured" };
  const trimmed = transcript.trim();
  if (trimmed === "") return { error: "Transcript is empty — paste a transcript before summarizing." };

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  try {
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM,
      messages: [{ role: "user", content: trimmed.slice(0, 100_000) }],
    });
    const text = res.content
      .filter((c): c is Extract<typeof c, { type: "text" }> => c.type === "text")
      .map((c) => c.text)
      .join("");
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return { error: "Model did not return JSON" };
    const parsed = JSON.parse(match[0]) as Record<string, unknown>;

    const summary = typeof parsed.summary === "string" ? parsed.summary : "";
    const rawItems = Array.isArray(parsed.action_items) ? parsed.action_items : [];
    const actionItems: ActionItem[] = [];
    for (const r of rawItems) {
      if (!r || typeof r !== "object") continue;
      const o = r as Record<string, unknown>;
      if (typeof o.text !== "string" || o.text.trim() === "") continue;
      actionItems.push({
        text: o.text.trim(),
        owner: typeof o.owner === "string" && o.owner.trim() !== "" ? o.owner.trim() : null,
        due: typeof o.due === "string" && o.due.trim() !== "" ? o.due.trim() : null,
        task_id: null,
      });
    }
    return { summary, actionItems };
  } catch (e) {
    log.warn("ai.meeting_summary.anthropic_failed", { err: e instanceof Error ? e.message : String(e) });
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
