import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { createServiceClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { record as recordUsage } from "@/lib/usage";

/** How long a cached digest stays fresh (milliseconds). */
export const DIGEST_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

export type DigestPriority = {
  category: "proposals" | "invoices" | "incidents" | "advancing" | "crew" | "projects" | "general";
  urgency: "high" | "medium" | "low";
  action: string;
  href?: string;
};

export type DigestSnapshot = {
  id: string;
  generated_at: string;
  summary: string;
  priorities: DigestPriority[];
};

/** Returns the most recent cached digest, or null if stale / missing. */
export async function getCachedDigest(userId: string, orgId: string): Promise<DigestSnapshot | null> {
  const supabase = await createServiceClient();
  const cutoff = new Date(Date.now() - DIGEST_TTL_MS).toISOString();
  const { data } = await supabase
    .from("ai_digest_snapshots")
    .select("id, generated_at, summary, priorities")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .gte("generated_at", cutoff)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id as string,
    generated_at: data.generated_at as string,
    summary: data.summary as string,
    priorities: (data.priorities as DigestPriority[]) ?? [],
  };
}

/** Pulls lightweight context from the DB to feed the digest prompt. */
async function buildContext(orgId: string, userId: string) {
  const supabase = await createServiceClient();
  const now = new Date().toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
  const threeDaysFromNow = new Date(Date.now() + 3 * 86400_000).toISOString();

  const [projects, proposals, invoices, incidents, advancing, openCalls] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, xpms_phase, end_date")
      .eq("org_id", orgId)
      .is("deleted_at", null)
      .in("xpms_phase", ["active", "production", "advance", "build", "show"])
      .limit(20),

    supabase
      .from("proposals")
      .select("id, title, state, updated_at")
      .eq("org_id", orgId)
      .is("deleted_at", null)
      .in("state", ["draft", "sent", "negotiation"])
      .lte("updated_at", sevenDaysAgo)
      .limit(10),

    supabase
      .from("invoices")
      .select("id, invoice_number, total_cents, currency, due_date, state")
      .eq("org_id", orgId)
      .is("deleted_at", null)
      .in("state", ["sent", "overdue"])
      .lte("due_date", now)
      .limit(10),

    supabase
      .from("incidents")
      .select("id, summary, severity, status, created_at, ai_triage")
      .eq("org_id", orgId)
      .eq("status", "open")
      .is("ai_triage", null)
      .order("created_at", { ascending: false })
      .limit(5),

    supabase
      .from("deliverables")
      .select("id, title, deliverable_state, due_date, assignee_id")
      .eq("org_id", orgId)
      .in("deliverable_state", ["briefed", "draft", "revision_requested"])
      .not("due_date", "is", null)
      .lte("due_date", threeDaysFromNow)
      .limit(10),

    supabase
      .from("open_calls")
      .select("id, title, kind, deadline_at, submission_count, status")
      .eq("org_id", orgId)
      .eq("status", "published")
      .not("deadline_at", "is", null)
      .lte("deadline_at", threeDaysFromNow)
      .gte("deadline_at", now)
      .limit(5),
  ]);

  return {
    active_projects: (projects.data ?? []).length,
    stale_proposals: (proposals.data ?? []).length,
    stale_proposal_titles: (proposals.data ?? []).map((p) => p.title).slice(0, 3),
    overdue_invoices: (invoices.data ?? []).length,
    overdue_invoice_total_cents: (invoices.data ?? []).reduce((s, inv) => s + (inv.total_cents ?? 0), 0),
    open_untriaged_incidents: (incidents.data ?? []).length,
    incident_summaries: (incidents.data ?? []).map((i) => `${i.severity}: ${i.summary}`).slice(0, 3),
    advancing_due_soon: (advancing.data ?? []).length,
    advancing_titles: (advancing.data ?? []).map((d) => d.title).slice(0, 3),
    closing_open_calls: (openCalls.data ?? []).length,
    open_call_titles: (openCalls.data ?? []).map((c) => c.title).slice(0, 3),
  };
}

/** Generates a fresh AI digest, persists it, and returns the snapshot. */
export async function generateDigest(userId: string, orgId: string): Promise<DigestSnapshot> {
  if (!env.ANTHROPIC_API_KEY) {
    return {
      id: "no-key",
      generated_at: new Date().toISOString(),
      summary: "AI digest requires ANTHROPIC_API_KEY to be configured.",
      priorities: [],
    };
  }

  const ctx = await buildContext(orgId, userId);

  const prompt = `You are an ATLVS Technologies operations AI. Generate a concise daily briefing for an event production operator.

Context (as of today):
- Active projects: ${ctx.active_projects}
- Stale proposals (no update in 7+ days): ${ctx.stale_proposals}${ctx.stale_proposal_titles.length ? ` — ${ctx.stale_proposal_titles.join(", ")}` : ""}
- Overdue invoices: ${ctx.overdue_invoices}${ctx.overdue_invoice_total_cents > 0 ? ` (${(ctx.overdue_invoice_total_cents / 100).toFixed(2)} total)` : ""}
- Open incidents needing triage: ${ctx.open_untriaged_incidents}${ctx.incident_summaries.length ? ` — ${ctx.incident_summaries.join("; ")}` : ""}
- Advancing items due within 3 days: ${ctx.advancing_due_soon}${ctx.advancing_titles.length ? ` — ${ctx.advancing_titles.join(", ")}` : ""}
- Open calls closing within 3 days: ${ctx.closing_open_calls}${ctx.open_call_titles.length ? ` — ${ctx.open_call_titles.join(", ")}` : ""}

Return JSON only, no markdown fences, matching this exact shape:
{
  "summary": "<2–3 sentence plain-English briefing>",
  "priorities": [
    { "category": "<proposals|invoices|incidents|advancing|crew|projects|general>", "urgency": "<high|medium|low>", "action": "<short action sentence>", "href": "<optional relative URL e.g. /console/proposals>" }
  ]
}

Order priorities by urgency. Include 3–6 items. Only include categories with actual items to act on. Be direct and operator-toned.`;

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const inputTokens = msg.usage?.input_tokens ?? 0;
  const outputTokens = msg.usage?.output_tokens ?? 0;

  let parsed: { summary: string; priorities: DigestPriority[] } = {
    summary: "Your workspace is up to date.",
    priorities: [],
  };

  const raw = msg.content[0]?.type === "text" ? msg.content[0].text : "";
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed.summary = raw.slice(0, 300);
  }

  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("ai_digest_snapshots")
    .insert({
      org_id: orgId,
      user_id: userId,
      summary: parsed.summary,
      priorities: parsed.priorities,
      context_digest: ctx,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
    })
    .select("id, generated_at")
    .single();

  void Promise.all([
    recordUsage({ orgId, actorId: userId, metric: "ai.tokens.input", quantity: inputTokens, unit: "tokens", metadata: { feature: "digest" } }),
    recordUsage({ orgId, actorId: userId, metric: "ai.tokens.output", quantity: outputTokens, unit: "tokens", metadata: { feature: "digest" } }),
    recordUsage({ orgId, actorId: userId, metric: "ai.request", quantity: 1, unit: "count", metadata: { feature: "digest" } }),
  ]);

  return {
    id: (data?.id as string) ?? "new",
    generated_at: (data?.generated_at as string) ?? new Date().toISOString(),
    summary: parsed.summary,
    priorities: parsed.priorities,
  };
}

/** Returns fresh-or-cached digest. Prefer cached if within TTL. */
export async function getOrGenerateDigest(userId: string, orgId: string): Promise<DigestSnapshot> {
  const cached = await getCachedDigest(userId, orgId);
  if (cached) return cached;
  return generateDigest(userId, orgId);
}
