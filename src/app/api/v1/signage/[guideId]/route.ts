import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api";

// 60-second ISR cache — signage screens pull on a timer, not SSE.
export const revalidate = 60;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
  "Content-Type": "application/json",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ guideId: string }> }) {
  const { guideId } = await params;

  // Service client for public read — guide must be published.
  // We intentionally do NOT use the user session here; signage
  // screens are unauthenticated displays.
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("event_guides")
    .select("id, title, persona, config, project_id, published, updated_at")
    .eq("id", guideId)
    .eq("published", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) return new Response(JSON.stringify({ error: "internal" }), { status: 500, headers: CORS });
  if (!data) return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: CORS });

  // Extract schedule/set_times/timeline sections for the signage display.
  const config = (data.config ?? {}) as Record<string, unknown>;
  const sections = (config.sections ?? []) as unknown[];

  const signageSections = (sections as Array<{ kind: string; [k: string]: unknown }>).filter((s) =>
    ["schedule", "set_times", "timeline", "overview"].includes(s.kind),
  );

  const payload = {
    guide_id: data.id,
    title: data.title,
    persona: data.persona,
    project_id: data.project_id,
    updated_at: data.updated_at,
    served_at: new Date().toISOString(),
    sections: signageSections,
  };

  return new Response(JSON.stringify(payload), { status: 200, headers: CORS });
}
