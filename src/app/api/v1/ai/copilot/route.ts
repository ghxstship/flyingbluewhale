import Anthropic from "@anthropic-ai/sdk";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { env } from "@/lib/env";
import { emitAudit } from "@/lib/audit";
import { embedTexts } from "@/lib/ai/embedding-worker";
import { formatChunksForPrompt, searchChunks, type RagChunk, type RagScope } from "@/lib/ai/rag";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

/**
 * POST /api/v1/ai/copilot — a GROUNDED answer card. Unlike /ai/chat (free
 * chat), the Copilot answers ONLY from the org's indexed RAG corpus and returns
 * the actual retrieved sources as citations plus a confidence grade, so the
 * answer is auditable and never free-floating. Every call is logged to
 * ai_messages (audit trail).
 *
 * When the corpus has no relevant chunks (or embeddings aren't configured) it
 * says so and returns low confidence — it does not fabricate an answer.
 */
const BodySchema = z.object({
  question: z.string().min(3).max(2000),
  projectId: z.string().uuid().optional(),
});

const SYSTEM = [
  "You are the ATLVS Copilot. Answer the user's question USING ONLY the numbered SOURCES provided.",
  "Cite every claim with its source number in square brackets, e.g. [2].",
  "If the SOURCES do not contain the answer, say so plainly and do not guess.",
  "Respond as STRICT JSON only (no prose around it):",
  '{"answer": string, "usedSources": number[], "confidence": "high"|"medium"|"low"}',
  "usedSources are the 1-based source numbers you actually relied on. confidence reflects how well the sources support the answer.",
].join(" ");

type CopilotResult = {
  answer: string;
  usedSources: number[];
  confidence: "high" | "medium" | "low";
};

function parseModelJson(text: string): CopilotResult | null {
  // Tolerate a code fence or stray prose around the JSON object.
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const o = JSON.parse(match[0]) as Partial<CopilotResult>;
    if (typeof o.answer !== "string") return null;
    return {
      answer: o.answer,
      usedSources: Array.isArray(o.usedSources) ? o.usedSources.filter((n) => Number.isInteger(n)) : [],
      confidence: o.confidence === "high" || o.confidence === "low" ? o.confidence : "medium",
    };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const input = await parseJson(req, BodySchema);
  if (input instanceof Response) return input;

  // Rate-limit before spending: embedding + a model call.
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:copilot"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "Too many Copilot requests. Try again shortly.");

  if (!env.ANTHROPIC_API_KEY) return apiError("service_unavailable", "AI is not configured.");

  return withAuth(async (session) => {
    const loose = (await createClient()) as unknown as LooseSupabase;

    // 1. Embed the question. If embeddings aren't configured, stay honest.
    const embedded = await embedTexts([input.question]);
    if ("error" in embedded || !embedded[0]) {
      return apiOk({
        answer:
          "Grounded answers aren't available yet — the workspace document index isn't configured, so I can't cite sources. Ask an admin to enable the AI index.",
        citations: [],
        confidence: "low" as const,
        grounded: false,
      });
    }

    // 2. Retrieve the most relevant indexed chunks in scope.
    const scope: RagScope = input.projectId
      ? { kind: "project", orgId: session.orgId, projectId: input.projectId }
      : { kind: "global", orgId: session.orgId };
    const chunks: RagChunk[] = await searchChunks(loose, embedded[0], scope, { topK: 8 });

    if (chunks.length === 0) {
      await emitAudit({
        actorId: session.userId,
        orgId: session.orgId,
        actorEmail: session.email,
        action: "copilot.answered",
        metadata: { question: input.question, grounded: false, confidence: "low" },
      });
      return apiOk({
        answer:
          "I couldn't find anything in your workspace's indexed documents that answers that. Try rephrasing, or index more sources first.",
        citations: [] as unknown[],
        confidence: "low" as const,
        grounded: false,
      });
    }

    // 3. Ground the model on the numbered sources.
    const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const sourcesBlock = formatChunksForPrompt(chunks);
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM,
      messages: [{ role: "user", content: `SOURCES:\n${sourcesBlock}\n\nQUESTION: ${input.question}` }],
    });
    const text = message.content.find((b) => b.type === "text")?.text ?? "";
    const parsed = parseModelJson(text) ?? {
      answer: text || "I wasn't able to produce a grounded answer.",
      usedSources: [],
      confidence: "low" as const,
    };

    // 4. Build citations from the chunks the model actually used (fallback: all).
    const used = parsed.usedSources.length
      ? parsed.usedSources.map((n) => chunks[n - 1]).filter((c): c is RagChunk => !!c)
      : chunks.slice(0, 3);
    const citations = used.map((c) => ({
      sourceType: c.source_type,
      sourceId: c.source_id,
      excerpt: c.chunk_text.slice(0, 240),
      similarity: Math.round(c.similarity * 100) / 100,
    }));

    // 5. Temper the model's self-confidence by the best retrieval similarity.
    const topSim = Math.max(...chunks.map((c) => c.similarity));
    let confidence = parsed.confidence;
    if (topSim < 0.72 && confidence === "high") confidence = "medium";
    if (topSim < 0.68) confidence = "low";

    // 6. Audit trail.
    await emitAudit({
      actorId: session.userId,
      orgId: session.orgId,
      actorEmail: session.email,
      action: "copilot.answered",
      metadata: {
        question: input.question,
        grounded: true,
        confidence,
        citations: citations.map((c) => ({ sourceType: c.sourceType, sourceId: c.sourceId })),
      },
    });

    return apiOk({ answer: parsed.answer, citations, confidence, grounded: true });
  });
}
