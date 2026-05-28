import { z } from "zod";
import { apiCreated, apiError, apiOk, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

export const dynamic = "force-dynamic";

const Params = z.object({ projectId: z.string().uuid() });

const CreateItem = z.object({
  cue_number: z.string().max(16).optional().default(""),
  label: z.string().min(1).max(200),
  notes: z.string().max(2000).optional(),
  department: z
    .enum(["foh", "boh", "talent", "production", "security", "medical", "logistics", "media", "sponsor", "other"])
    .optional(),
  assignee_id: z.string().uuid().optional(),
  starts_at: z.string().datetime().optional(),
  duration_seconds: z.number().int().min(0).optional(),
  sort_order: z.number().int().optional().default(0),
});

async function resolveProject(
  supabase: LooseSupabase,
  projectId: string,
  orgId: string,
): Promise<{ id: string; name: string } | null> {
  const { data } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .eq("org_id", orgId)
    .maybeSingle();
  return (data as { id: string; name: string } | null);
}

export async function GET(_req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await ctx.params;
  if (!Params.safeParse({ projectId }).success) return apiError("bad_request", "Invalid project id");

  return withAuth(async (session) => {
    const denial = assertCapability(session, "projects:read");
    if (denial) return denial;

    const supabase = (await createClient()) as unknown as LooseSupabase;
    const project = await resolveProject(supabase, projectId, session.orgId);
    if (!project) return apiError("not_found", "Project not found");

    const { data, error } = await supabase
      .from("run_of_show_items")
      .select("*")
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .order("starts_at", { ascending: true });

    if (error) return apiError("internal", error.message);
    return apiOk({ items: data ?? [] });
  });
}

export async function POST(req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await ctx.params;
  if (!Params.safeParse({ projectId }).success) return apiError("bad_request", "Invalid project id");

  const body = await parseJson(req, CreateItem);
  if (body instanceof Response) return body;

  return withAuth(async (session) => {
    const denial = assertCapability(session, "projects:write");
    if (denial) return denial;

    const supabase = (await createClient()) as unknown as LooseSupabase;
    const project = await resolveProject(supabase, projectId, session.orgId);
    if (!project) return apiError("not_found", "Project not found");

    const { data, error } = await supabase
      .from("run_of_show_items")
      .insert({
        ...body,
        org_id: session.orgId,
        project_id: projectId,
        source: "manual",
      })
      .select()
      .single();

    if (error) return apiError("internal", error.message);
    return apiCreated(data);
  });
}
