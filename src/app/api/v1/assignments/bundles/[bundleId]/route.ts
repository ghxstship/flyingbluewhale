import { z } from "zod";
import { apiOk, apiError, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getBundle } from "@/lib/db/assignments";

const PatchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).nullable().optional(),
});

/**
 * GET  /api/v1/assignments/bundles/[bundleId]
 * PATCH /api/v1/assignments/bundles/[bundleId]  — rename / redescribe
 * DELETE /api/v1/assignments/bundles/[bundleId] — soft-delete
 *
 * Bundle membership (which assignments belong to a bundle) is managed via
 * PATCH /api/v1/assignments/[assignmentId] setting bundle_id.
 */

export async function GET(_req: Request, { params }: { params: Promise<{ bundleId: string }> }) {
  const guard = await withAuth(async (s) => ({ session: s }));
  if (guard instanceof Response) return guard;

  const { bundleId } = await params;
  const { session } = guard;

  try {
    const bundle = await getBundle(session.orgId, bundleId);
    if (!bundle) return apiError("not_found", "Bundle not found");
    return apiOk(bundle);
  } catch (e) {
    return apiError("internal", e instanceof Error ? e.message : "Failed to fetch bundle");
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ bundleId: string }> }) {
  const guard = await withAuth(async (s) => ({ session: s }));
  if (guard instanceof Response) return guard;

  const { bundleId } = await params;
  const input = await parseJson(req, PatchSchema);
  if (input instanceof Response) return input;
  if (Object.keys(input).length === 0) return apiError("validation", "At least one field required");

  const { session } = guard;
  const supabase = await createClient();

  const update: Record<string, unknown> = {};
  if (input.name !== undefined) update.name = input.name;
  if ("description" in input) update.description = input.description;

  const { data, error } = await supabase
    .from("assignment_bundles")
    .update(update as never)
    .eq("id", bundleId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .select("id, name, description, updated_at")
    .single();

  if (error) return apiError("internal", error.message);
  if (!data) return apiError("not_found", "Bundle not found");
  return apiOk(data);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ bundleId: string }> }) {
  const guard = await withAuth(async (s) => ({ session: s }));
  if (guard instanceof Response) return guard;

  const { bundleId } = await params;
  const { session } = guard;
  const supabase = await createClient();

  const { error } = await supabase
    .from("assignment_bundles")
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq("id", bundleId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);

  if (error) return apiError("internal", error.message);
  return apiOk({ deleted: true });
}
