import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiCreated, apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";


/** /api/v1/risks — RAID register (WF-006). */

const LIKELIHOOD = ["rare", "unlikely", "possible", "likely", "almost_certain"] as const;
const IMPACT = ["insignificant", "minor", "moderate", "major", "severe"] as const;

const PostSchema = z.object({
  projectId: z.string().uuid().optional(),
  kind: z.enum(["risk", "assumption", "issue", "dependency"]).default("risk"),
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  category: z.string().max(80).optional(),
  likelihood: z.enum(LIKELIHOOD).default("possible"),
  impact: z.enum(IMPACT).default("moderate"),
  ownerId: z.string().uuid().optional(),
  treatment: z.string().max(4000).optional(),
  dueOn: z.string().optional(),
});

export async function GET() {
  return withAuth(async (session) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("risks")
      .select("id, kind, title, category, likelihood, impact, inherent_score, residual_score, status, owner_id, due_on, created_at")
      .eq("org_id", session.orgId)
      .order("inherent_score", { ascending: false })
      .limit(500);
    if (error) return apiError("internal", error.message);
    return apiOk({ risks: data ?? [] });
  });
}

export async function POST(req: NextRequest) {
  const input = await parseJson(req, PostSchema);
  if (input instanceof Response) return input;
  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("risks")
      .insert({
        org_id: session.orgId,
        project_id: input.projectId ?? null,
        kind: input.kind,
        title: input.title,
        description: input.description ?? null,
        category: input.category ?? null,
        likelihood: input.likelihood,
        impact: input.impact,
        owner_id: input.ownerId ?? null,
        treatment: input.treatment ?? null,
        due_on: input.dueOn ?? null,
        created_by: session.userId,
      })
      .select("id, title, inherent_score, status")
      .single();
    if (error) return apiError("internal", error.message);
    return apiCreated({ risk: data });
  });
}
