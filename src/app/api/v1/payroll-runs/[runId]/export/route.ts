import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiCreated, apiError, apiOk, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { loadPayrollRunBundle } from "@/lib/payroll/bundle";
import { idempotencyKeyFor, runContentDigest } from "@/lib/payroll/idempotency";
import { CsvPayrollDriver } from "@/lib/payroll/providers/csv";
import { blockingIssues, type PayrollExportDriver } from "@/lib/payroll/providers/types";

/**
 * POST /api/v1/payroll-runs/{runId}/export — send a run to a provider.
 *
 * The `csv` driver is the universal one: it works with every payroll system
 * today, with no partnership, certification, or mutual-TLS provisioning.
 * Native API drivers register here as they clear those gates.
 *
 * IDEMPOTENCY IS THE POINT. The key is derived from the run's payable
 * CONTENT, so:
 *   - retrying unchanged content returns the EXISTING export (200, not 201)
 *     and never sends twice — this is the timeout case, where you don't
 *     know whether the provider got it;
 *   - changing an hour mints a new key, so a genuine correction exports
 *     rather than being swallowed as a duplicate.
 * `UNIQUE (org_id, provider, idempotency_key)` enforces it at the database,
 * so two concurrent operators pressing Export cannot both win.
 *
 * Exporting is ADMIN band — approving hours and paying them are separate
 * authorities.
 */

const DRIVERS: Record<string, () => PayrollExportDriver> = {
  csv: () => new CsvPayrollDriver(),
};

const PostSchema = z.object({
  provider: z.string().min(1).max(40).default("csv"),
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ runId: string }> }) {
  const { runId } = await ctx.params;
  const input = await parseJson(req, PostSchema);
  if (input instanceof Response) return input;

  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const denial = assertCapability(session, "payroll:export");
    if (denial) return denial;

    const make = DRIVERS[input.provider];
    if (!make) {
      return apiError("bad_request", `No driver for "${input.provider}". Available: ${Object.keys(DRIVERS).join(", ")}`);
    }
    const driver = make();

    const supabase = await createClient();
    const bundle = await loadPayrollRunBundle(supabase, session.orgId, runId, input.provider);
    if (!bundle) return apiError("not_found", "Payroll run not found");

    // Refuse before sending. A payroll import that half-works is worse than
    // one that doesn't run.
    const blocking = blockingIssues(await driver.validate(bundle));
    if (blocking.length > 0) {
      return apiError("unprocessable", blocking[0]?.message ?? "This run can't be exported yet.", {
        code: "export_blocked",
        issues: blocking,
      });
    }

    const key = idempotencyKeyFor(bundle, input.provider);
    const db = supabase as unknown as LooseSupabase;

    // Already exported this exact content? Hand back what happened before
    // rather than doing it again.
    const { data: existing } = await db
      .from("payroll_exports")
      .select("id, export_state, external_batch_id, line_count, accepted_count, rejected_count, sent_at, created_at")
      .eq("org_id", session.orgId)
      .eq("provider", input.provider)
      .eq("idempotency_key", key)
      .maybeSingle();
    if (existing) {
      return apiOk({
        export: existing,
        idempotent: true,
        message: "This run was already exported with identical content. Returning the original export.",
      });
    }

    const { data: created, error: insErr } = await db
      .from("payroll_exports")
      .insert({
        org_id: session.orgId,
        payroll_run_id: runId,
        provider: input.provider,
        idempotency_key: key,
        request_digest: runContentDigest(bundle),
        export_state: "queued",
        line_count: bundle.lines.length,
        created_by: session.userId,
      })
      .select("id, export_state, created_at")
      .single();
    if (insErr) {
      // The unique index fired — a concurrent operator won the race. That is
      // the constraint doing its job, so report their export, not an error.
      if (insErr.code === "23505") {
        const { data: raced } = await db
          .from("payroll_exports")
          .select("id, export_state, external_batch_id, sent_at, created_at")
          .eq("org_id", session.orgId)
          .eq("provider", input.provider)
          .eq("idempotency_key", key)
          .maybeSingle();
        return apiOk({ export: raced, idempotent: true, message: "Another export of identical content is already in flight." });
      }
      return apiError("internal", insErr.message);
    }

    const exportId = (created as { id: string }).id;
    const result = await driver.export(bundle, key);

    // Record per-line outcomes so a retry can re-send ONLY the rejected
    // ones. Re-sending an accepted line is how someone gets paid twice.
    if (result.lines.length > 0) {
      await db.from("payroll_export_lines").insert(
        result.lines.map((l) => ({
          export_id: exportId,
          payroll_run_line_id: l.id,
          line_state: l.state,
          external_line_id: l.externalLineId ?? null,
          error_code: l.errorCode ?? null,
          error_message: l.errorMessage ?? null,
        })),
      );
    }

    const accepted = result.lines.filter((l) => l.state === "accepted").length;
    const rejected = result.lines.filter((l) => l.state === "rejected").length;
    await db
      .from("payroll_exports")
      .update({
        export_state: result.state,
        external_batch_id: result.externalBatchId ?? null,
        accepted_count: accepted,
        rejected_count: rejected,
        last_error: result.error ?? null,
        attempts: 1,
        sent_at: result.state === "failed" ? null : new Date().toISOString(),
      })
      .eq("id", exportId);

    return apiCreated({
      export: { id: exportId, export_state: result.state, line_count: result.lines.length },
      // File-drop drivers hand back bytes for the operator to deliver.
      artifact: result.artifact ?? null,
      idempotent: false,
    });
  });
}

/** GET — the run's export history. Any member may see that it happened. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ runId: string }> }) {
  const { runId } = await ctx.params;
  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const denial = assertCapability(session, "payroll:read");
    if (denial) return denial;

    const db = (await createClient()) as unknown as LooseSupabase;
    const { data, error } = await db
      .from("payroll_exports")
      .select(
        "id, provider, export_state, attempts, external_batch_id, line_count, accepted_count, rejected_count, last_error, sent_at, confirmed_at, created_at",
      )
      .eq("org_id", session.orgId)
      .eq("payroll_run_id", runId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return apiError("internal", error.message);
    return apiOk({ exports: data ?? [] });
  });
}
