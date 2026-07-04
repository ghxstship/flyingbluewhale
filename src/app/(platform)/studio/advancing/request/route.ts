import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Gear & Advance Request — One Front Door resolver (v7.8).
 *
 * Advancing is per-project (`/studio/projects/[projectId]/advancing/...`),
 * but the global "+" needs a project-free entry point. This route picks the
 * caller's most recent ACTIVE production and lands them on its new-assignment
 * form; with no active production it falls back to the projects list so the
 * path teaches itself. A route handler (not a page) — intentionally not in
 * the sidebar; exempted in scripts/generate-sitemap.mjs.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/login", req.url));
  if (!session.orgId) return NextResponse.redirect(new URL("/studio", req.url));

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("org_id", session.orgId)
    .eq("project_state", "active")
    .is("deleted_at", null)
    .order("start_date", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  const target = project
    ? `/studio/projects/${project.id}/advancing/assignments/new`
    : "/studio/projects";
  return NextResponse.redirect(new URL(target, req.url));
}
