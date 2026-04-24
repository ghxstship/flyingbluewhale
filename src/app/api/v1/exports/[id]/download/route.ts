import { type NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";

/**
 * Re-mint a short-lived signed URL for a completed export run. Lets the
 * Export Centre UI offer "download again" without keeping old URLs
 * around. Expires in 10 minutes.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const supabase = await createClient();
    const { data: run, error } = await supabase
      .from("export_runs")
      .select("id, file_path, status, org_id")
      .eq("id", id)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (error) return apiError("internal", error.message);
    if (!run) return apiError("not_found", "Export run not found");
    if (run.status !== "done" || !run.file_path) {
      return apiError("bad_request", "Run is not complete");
    }
    // Signed URLs for storage require service role on private buckets
      if (!isServiceClientAvailable()) {
        return apiError(
          "service_unavailable",
          "This endpoint requires SUPABASE_SERVICE_ROLE_KEY in the runtime environment.",
        );
      }
    const svc = createServiceClient();
    const { data: signed, error: signErr } = await svc.storage
      .from("exports")
      .createSignedUrl(run.file_path, 600);
    if (signErr) return apiError("internal", signErr.message);
    return apiOk({ signedUrl: signed?.signedUrl ?? null });
  });
}
