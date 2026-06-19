import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { env } from "@/lib/env";
import { keyFromRequest, ratelimit } from "@/lib/ratelimit";

const Schema = z.object({
  kind: z.enum(["proposal", "sop", "schedule_suggest", "timesheet_audit", "guide_qa"]),
  context: z.string().min(1).max(8000),
  question: z.string().max(2000).optional(),
});

const SYSTEM_PROMPTS: Record<z.infer<typeof Schema>["kind"], string> = {
  proposal:
    "You are an expert proposal writer for live event production and experiential marketing. Generate concise, professional proposal content based on the provided context.",
  sop: "You are an expert in live production operations. Draft a clear, step-by-step Standard Operating Procedure based on the provided context. Use numbered steps.",
  schedule_suggest:
    "You are a workforce scheduling expert for live events. Analyze the provided crew availability and project requirements and suggest an optimized shift schedule.",
  timesheet_audit:
    'You are a payroll auditor for live event production companies. Analyze the provided timesheet data and identify anomalies: missed punches, excessive overtime (>12h), duplicate entries, or suspicious patterns. Output a JSON array of findings with {crew_name, date, issue, severity: \'low\'|\'medium\'|\'high\'}.',
  guide_qa:
    "You are the ATLVS event guide assistant. Answer the attendee's question about the event based only on the provided event guide context. Be friendly and concise.",
};

export async function POST(req: Request) {
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:generate"), max: 20, windowMs: 60_000 });
  if (!rl.ok) return apiError("rate_limited", "AI rate limit reached; try again shortly");

  if (!env.ANTHROPIC_API_KEY) {
    return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");
  }

  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const userContent =
    input.kind === "guide_qa" && input.question
      ? `Event guide context:\n${input.context}\n\nAttendee question: ${input.question}`
      : input.context;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: SYSTEM_PROMPTS[input.kind],
    messages: [{ role: "user", content: userContent }],
  });

  const content =
    message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("") ?? "";

  return apiOk({ content });
}
