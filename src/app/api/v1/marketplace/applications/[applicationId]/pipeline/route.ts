import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

/**
 * PATCH /api/v1/marketplace/applications/[applicationId]/pipeline
 *
 * Move a job application to a new pipeline phase. Only org members
 * (managers) may advance candidates.
 */

const Schema = z.object({
  pipeline_phase: z.enum(["applied", "screening", "interview", "offer", "hired", "rejected"]),
  pipeline_note: z.string().max(500).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ applicationId: string }> }) {
  if (!hasSupabase) return apiError("service_unavailable", "Supabase not configured");
  const { applicationId } = await params;

  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  const supabase = await createClient();

  // Verify the application belongs to an org posting
  const { data: app } = await supabase
    .from("job_applications")
    .select("id, posting_id")
    .eq("id", applicationId)
    .maybeSingle();

  if (!app) return apiError("not_found", "Application not found");

  const { data: posting } = await supabase
    .from("job_postings")
    .select("org_id")
    .eq("id", app.posting_id)
    .eq("org_id", session.orgId)
    .maybeSingle();

  if (!posting) return apiError("forbidden", "Not your posting");

  const { data, error } = await supabase
    .from("job_applications")
    .update({
      pipeline_phase: input.pipeline_phase,
      pipeline_note: input.pipeline_note ?? null,
      pipeline_moved_at: new Date().toISOString(),
    })
    .eq("id", applicationId)
    .select()
    .single();

  if (error) return apiError("internal", error.message);
  return apiOk({ application: data });
}
