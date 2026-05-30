import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";
import { log } from "@/lib/log";

/**
 * AI Run-of-Show Generator — generates a realistic cue-by-cue rundown from an
 * event brief. Addresses a genuine market gap: LASSO Intelligence-style
 * automated show-calling documents from natural-language event descriptions.
 * Uses claude-sonnet-4-6 with a strict JSON-only response shape.
 * Pattern mirrors extract-ap-invoice.ts.
 */

const SYSTEM_PROMPT = `You are a professional show caller and production manager. Generate a realistic run-of-show cue list from the provided event brief.
Respond with ONLY a JSON object matching this exact shape, no prose:
{
  "event_name": "string",
  "start_time": "HH:MM (24-hour) — same as provided or normalised",
  "cues": [
    {
      "label": "string — cue identifier, e.g. CUE 1, PROD-01, TALENT-A3",
      "lane": "string — one of: Production, Talent, AV, Operations, Catering, Security, Comms",
      "description": "string — clear action instruction for the crew member responsible",
      "duration_seconds": integer — realistic cue duration in seconds,
      "offset_minutes": number — minutes from show start (0 = simultaneous with start_time; decimals allowed)
    }
  ]
}
Rules:
- Generate 15-40 cues scaled to event duration (longer events = more cues).
- Distribute cues across Production, Talent, AV, and Operations lanes as a minimum; add Catering, Security, or Comms lanes where relevant to the event type.
- offset_minutes must be monotonically non-decreasing (cues are in chronological order).
- duration_seconds: realistic action time (e.g. a "doors open" cue might be 0, a "soundcheck" might be 2700).
- Labels should be lane-prefixed shortcodes (PROD-01, TLNT-01, AV-01, OPS-01) for easy radio reference.
- Descriptions must be imperative, specific, and crew-actionable. Not stage directions — real operational instructions.
- Cover the full event arc: load-in, soundcheck/tech, pre-show, show segments, intermissions if applicable, post-show, load-out.
- Never include any text outside the JSON object.`;

export type GeneratedCue = {
  label: string;
  lane: string;
  description: string;
  duration_seconds: number;
  offset_minutes: number;
};

export type GeneratedRos = {
  event_name: string;
  start_time: string;
  cues: GeneratedCue[];
};

export async function generateRos(opts: {
  event_name: string;
  event_type: string;
  start_time: string;
  duration_hours: number;
  notes?: string;
}): Promise<GeneratedRos | { error: string }> {
  if (!env.ANTHROPIC_API_KEY) {
    return { error: "ANTHROPIC_API_KEY not configured" };
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const modelVersion = "claude-sonnet-4-6";

  const userPrompt = [
    `Event name: ${opts.event_name}`,
    `Event type: ${opts.event_type}`,
    `Start time: ${opts.start_time}`,
    `Duration: ${opts.duration_hours} hours`,
    opts.notes ? `Additional notes: ${opts.notes}` : null,
    "Generate the run-of-show cue list per the system instructions. Return only the JSON object.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await client.messages.create({
      model: modelVersion,
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const text = res.content
      .filter((c): c is Extract<typeof c, { type: "text" }> => c.type === "text")
      .map((c) => c.text)
      .join("");

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      log.warn("generate_ros.no_json", { sample: text.slice(0, 200) });
      return { error: "Model did not return JSON" };
    }

    const parsed = JSON.parse(match[0]) as Record<string, unknown>;

    const cuesRaw = Array.isArray(parsed.cues) ? (parsed.cues as unknown[]) : [];
    const cues: GeneratedCue[] = cuesRaw
      .filter((c): c is Record<string, unknown> => c != null && typeof c === "object")
      .map((c) => ({
        label: typeof c.label === "string" ? c.label : "",
        lane: typeof c.lane === "string" ? c.lane : "Production",
        description: typeof c.description === "string" ? c.description : "",
        duration_seconds: typeof c.duration_seconds === "number" ? c.duration_seconds : 0,
        offset_minutes: typeof c.offset_minutes === "number" ? c.offset_minutes : 0,
      }));

    return {
      event_name: typeof parsed.event_name === "string" ? parsed.event_name : opts.event_name,
      start_time: typeof parsed.start_time === "string" ? parsed.start_time : opts.start_time,
      cues,
    };
  } catch (e) {
    log.error("generate_ros.exception", { err: e instanceof Error ? e.message : String(e) });
    return { error: e instanceof Error ? e.message : "Run-of-show generation failed" };
  }
}
