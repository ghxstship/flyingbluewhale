import { z } from "zod";
import { apiOk, apiCreated, apiError, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { listProjectBundles, createBundle } from "@/lib/db/assignments";

const ListSchema = z.object({
  projectId: z.string().uuid(),
});

const CreateSchema = z.object({
  project_id: z.string().uuid(),
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
});

/**
 * GET /api/v1/assignments/bundles?projectId=<uuid>
 * List all assignment bundles for a project.
 *
 * POST /api/v1/assignments/bundles
 * Create a new experience-layered bundle (Tixr competitive parity).
 * Body: { project_id, name, description? }
 */

export async function GET(req: Request) {
  const guard = await withAuth(async (s) => ({ session: s }));
  if (guard instanceof Response) return guard;

  const { searchParams } = new URL(req.url);
  const parsed = ListSchema.safeParse({ projectId: searchParams.get("projectId") });
  if (!parsed.success) return apiError("validation", "projectId is required and must be a UUID");

  const { session } = guard;
  try {
    const bundles = await listProjectBundles(session.orgId, parsed.data.projectId);
    return apiOk({ bundles });
  } catch (e) {
    return apiError("internal", e instanceof Error ? e.message : "Failed to list bundles");
  }
}

export async function POST(req: Request) {
  const guard = await withAuth(async (s) => ({ session: s }));
  if (guard instanceof Response) return guard;

  const input = await parseJson(req, CreateSchema);
  if (input instanceof Response) return input;

  const { session } = guard;
  try {
    const bundle = await createBundle(session.orgId, {
      project_id: input.project_id,
      name: input.name,
      description: input.description,
      created_by: session.userId,
    });
    return apiCreated(bundle);
  } catch (e) {
    return apiError("internal", e instanceof Error ? e.message : "Failed to create bundle");
  }
}
