import { apiOk, apiError } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** GET /api/v1/job-templates — reusable scope-checklist templates + step counts. */
export async function GET() {
  return withAuth(async (session) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("job_templates")
      .select("id, name, trade, template_state, steps:job_template_steps(count)")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) return apiError("internal", error.message);
    return apiOk({ jobTemplates: data ?? [] });
  });
}
