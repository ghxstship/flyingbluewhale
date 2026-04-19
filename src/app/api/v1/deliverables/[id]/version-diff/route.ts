import { z } from "zod";
import { apiError, apiOk } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/v1/deliverables/{id}/version-diff?from=N&to=M — Opportunity #19.
 *
 * Returns a structured diff { added[], removed[], changed[] } between
 * two snapshots of a deliverable.data jsonb. Reads from audit_log
 * before/after columns (SSOT trigger fills these automatically on
 * UPDATE). Renders visually on the client; no PDF dependency for the
 * diff surface itself.
 */

const ParamsSchema = z.object({ id: z.string().uuid() });
const QuerySchema = z.object({ from: z.string().optional(), to: z.string().optional() });

export const dynamic = "force-dynamic";

type Jsonish = Record<string, unknown>;

function diff(before: Jsonish | null, after: Jsonish | null) {
  const b = before ?? {};
  const a = after ?? {};
  const added: string[] = [];
  const removed: string[] = [];
  const changed: Array<{ key: string; from: unknown; to: unknown }> = [];
  const keys = new Set([...Object.keys(b), ...Object.keys(a)]);
  for (const k of keys) {
    if (!(k in b)) added.push(k);
    else if (!(k in a)) removed.push(k);
    else if (JSON.stringify(b[k]) !== JSON.stringify(a[k])) {
      changed.push({ key: k, from: b[k], to: a[k] });
    }
  }
  return { added, removed, changed };
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const parsed = ParamsSchema.safeParse({ id });
  if (!parsed.success) return apiError("bad_request", "Invalid deliverable id");
  const url = new URL(req.url);
  const q = QuerySchema.safeParse({ from: url.searchParams.get("from") ?? undefined, to: url.searchParams.get("to") ?? undefined });
  if (!q.success) return apiError("bad_request", "Invalid query parameters");

  return withAuth(async (session) => {
    const supabase = await createClient();
    const { data: log } = await supabase
      .from("audit_log")
      .select("at, before, after")
      .eq("target_table", "deliverables")
      .eq("target_id", parsed.data.id)
      .eq("org_id", session.orgId)
      .order("at", { ascending: true });

    const entries = log ?? [];
    if (entries.length === 0) return apiOk({ versions: [] as unknown[], diff: null });

    // Pick the first + last by default; accept explicit ISO timestamps via
    // ?from= and ?to= for point-in-time comparison.
    const first = q.data.from ? entries.find((e) => e.at >= q.data.from!) ?? entries[0] : entries[0];
    const last = q.data.to ? entries.slice().reverse().find((e) => e.at <= q.data.to!) ?? entries[entries.length - 1] : entries[entries.length - 1];

    return apiOk({
      versions: entries.map((e) => ({ at: e.at })),
      from: first.at,
      to: last.at,
      diff: diff(
        (first.before ?? first.after) as Jsonish | null,
        (last.after ?? last.before) as Jsonish | null,
      ),
    });
  });
}
