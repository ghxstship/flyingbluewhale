/**
 * POST /api/v1/projects/{projectId}/run-of-show/generate
 *
 * Competitive feature: AI Run-of-Show generator (vs Propared / Cvent CventIQ).
 * Reads project tasks, events, and crew to synthesize a structured cue list,
 * then upserts the items into run_of_show_items with source='ai_generated'.
 */
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiError, apiOk } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";
import type { LooseSupabase } from "@/lib/supabase/loose";

export const dynamic = "force-dynamic";

const Params = z.object({ projectId: z.string().uuid() });

const DEPARTMENTS = ["foh", "boh", "talent", "production", "security", "medical", "logistics", "media", "sponsor", "other"] as const;

type RosItem = {
  cue_number: string;
  label: string;
  notes: string | null;
  department: (typeof DEPARTMENTS)[number] | null;
  starts_at: string | null;
  duration_seconds: number | null;
  sort_order: number;
};

export async function POST(req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  const rl = await ratelimit({ key: keyFromRequest(req, "ros:generate"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "AI rate limit reached; try again shortly");

  if (!env.ANTHROPIC_API_KEY) return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");

  const { projectId } = await ctx.params;
  if (!Params.safeParse({ projectId }).success) return apiError("bad_request", "Invalid project id");

  return withAuth(async (session) => {
    const denial = assertCapability(session, "projects:write");
    if (denial) return denial;

    const supabase = (await createClient()) as unknown as LooseSupabase;

    const { data: project } = await supabase
      .from("projects")
      .select("id, name, description, start_date, end_date")
      .eq("id", projectId)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (!project) return apiError("not_found", "Project not found");

    const [{ data: tasks }, { data: events }, { data: crew }] = await Promise.all([
      supabase
        .from("tasks")
        .select("title, description, due_date, assignee_id")
        .eq("project_id", projectId)
        .order("due_date", { ascending: true })
        .limit(80),
      supabase
        .from("events")
        .select("name, starts_at, ends_at, description")
        .eq("project_id", projectId)
        .order("starts_at", { ascending: true })
        .limit(40),
      supabase
        .from("crew_members")
        .select("name, role")
        .eq("org_id", session.orgId)
        .limit(40),
    ]);

    const context = JSON.stringify({
      project: { name: (project as { name?: string }).name, description: (project as { description?: string }).description, start_date: (project as { start_date?: string }).start_date, end_date: (project as { end_date?: string }).end_date },
      tasks: (tasks ?? []).slice(0, 40),
      events: (events ?? []).slice(0, 20),
      crew_roles: [...new Set((crew ?? []).map((c: { role?: string }) => c.role).filter(Boolean))],
    });

    const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: `You are an expert live-event production manager for ATLVS Technologies. Given project context, generate a professional run-of-show cue list as a JSON array.

Each item must have:
- cue_number: string (e.g. "1", "1A", "2.3")
- label: string (brief cue name, max 120 chars)
- notes: string | null
- department: one of ${DEPARTMENTS.join(", ")} or null
- starts_at: ISO 8601 datetime string or null
- duration_seconds: integer or null
- sort_order: integer (0-based)

Return ONLY valid JSON array. No markdown, no explanation.`,
      messages: [
        {
          role: "user",
          content: `Generate a comprehensive run-of-show for this project:\n\n${context}`,
        },
      ],
    });

    const raw = message.content.find((b: { type: string; text?: string }) => b.type === "text")?.text ?? "[]";
    let items: RosItem[] = [];
    try {
      const parsed = JSON.parse(raw.trim());
      items = Array.isArray(parsed) ? parsed : [];
    } catch {
      return apiError("internal", "AI returned malformed JSON; please retry");
    }

    if (items.length === 0) return apiError("internal", "AI generated no cue items; please retry");

    // Soft-delete any existing AI-generated items before reinserting so the
    // user can regenerate without duplicating manual edits.
    await supabase
      .from("run_of_show_items")
      .update({ deleted_at: new Date().toISOString() })
      .eq("project_id", projectId)
      .eq("source", "ai_generated")
      .is("deleted_at", null);

    const rows = items.map((item, i) => ({
      org_id: session.orgId,
      project_id: projectId,
      cue_number: item.cue_number ?? String(i + 1),
      label: String(item.label ?? "").slice(0, 200) || "Untitled cue",
      notes: item.notes ?? null,
      department: DEPARTMENTS.includes(item.department as (typeof DEPARTMENTS)[number]) ? item.department : null,
      starts_at: item.starts_at ?? null,
      duration_seconds: typeof item.duration_seconds === "number" ? item.duration_seconds : null,
      sort_order: typeof item.sort_order === "number" ? item.sort_order : i,
      source: "ai_generated" as const,
    }));

    const { data: inserted, error } = await supabase
      .from("run_of_show_items")
      .insert(rows)
      .select("id, cue_number, label, department, starts_at, duration_seconds, sort_order");

    if (error) return apiError("internal", error.message);

    return apiOk({ generated: inserted?.length ?? 0, items: inserted ?? [] });
  });
}
