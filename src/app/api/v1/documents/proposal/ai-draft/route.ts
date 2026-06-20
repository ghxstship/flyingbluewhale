import Anthropic from "@anthropic-ai/sdk";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiOk, apiError, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

/** POST /api/v1/documents/proposal/ai-draft
 * Generates pre-filled proposal merge-field data from a project + client
 * record. Returns a JSON object that DocRenderer / render-html.ts can
 * consume directly as `data`. Competitive parity: CventIQ AI Proposals
 * (Jun 2025) + Momentus AI for Sales (Q3 2026 roadmap). */

const Schema = z.object({
  projectId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:doc-draft"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "AI rate limit reached; try again shortly");

  if (!env.ANTHROPIC_API_KEY) {
    return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");
  }

  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  return withAuth(async (session) => {
    const supabase = await createClient();

    let projectContext = "";
    let clientContext = "";

    if (input.projectId) {
      const { data: project } = await supabase
        .from("projects")
        .select("id, title, description, budget, start_date, end_date, xpms_phase")
        .eq("id", input.projectId)
        .eq("org_id", session.orgId)
        .maybeSingle();

      if (project) {
        projectContext = [
          `Project: ${project.title}`,
          project.description ? `Description: ${project.description}` : null,
          project.budget ? `Budget: $${project.budget}` : null,
          project.start_date ? `Start: ${project.start_date}` : null,
          project.end_date ? `End: ${project.end_date}` : null,
          project.xpms_phase ? `Phase: ${project.xpms_phase}` : null,
        ]
          .filter(Boolean)
          .join("\n");
      }
    }

    if (input.clientId) {
      const { data: client } = await supabase
        .from("clients")
        .select("id, name, company, email, phone")
        .eq("id", input.clientId)
        .eq("org_id", session.orgId)
        .maybeSingle();

      if (client) {
        clientContext = [
          `Client: ${client.name ?? client.company ?? "Unknown"}`,
          client.company ? `Company: ${client.company}` : null,
          client.email ? `Email: ${client.email}` : null,
        ]
          .filter(Boolean)
          .join("\n");
      }
    }

    const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

    const prompt = [
      "You are an expert event production proposal writer for ATLVS Technologies.",
      "Generate a concise, professional proposal draft as a JSON object.",
      "The JSON must match this exact shape (all strings, use empty string if unknown):",
      "",
      JSON.stringify(
        {
          project: {
            title: "string — compelling project title",
            subtitle: "string — one-line description",
            scope: "string — 2-3 sentences on scope of work",
            deliverables: "string — bullet-style list of key deliverables",
            timeline: "string — high-level timeline narrative",
          },
          client: { name: "string", company: "string", address: "string" },
          invest: [{ description: "string", qty: "number", rate: "number", amount: "number" }],
          terms: { payment: "string", validity: "string", notes: "string" },
        },
        null,
        2,
      ),
      "",
      "Context provided:",
      projectContext || "(no project specified)",
      clientContext || "(no client specified)",
      input.notes ? `Additional notes: ${input.notes}` : "",
      "",
      "Respond with ONLY valid JSON, no markdown fences.",
    ]
      .filter((l) => l !== undefined)
      .join("\n");

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";

    let draft: unknown;
    try {
      draft = JSON.parse(raw);
    } catch {
      return apiError("server_error", "AI returned malformed JSON; please retry");
    }

    return apiOk({ draft, tokensUsed: message.usage.input_tokens + message.usage.output_tokens });
  });
}
