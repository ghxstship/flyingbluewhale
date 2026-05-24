import { z } from "zod";
import { registerAction } from "../registry";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Whitelist of tables that automations are allowed to mutate.
 *
 * Every entry MUST have an `org_id` column AND an `id` column — the runner
 * filters on both to prevent cross-org writes even though we're using the
 * service-role client. Add tables here only after auditing for hidden side
 * effects (cascading triggers, audit-log emission, etc.).
 */
const ALLOWED_TABLES = [
  "assignments",
  "tasks",
  "deliverables",
  "incidents",
  "punch_items",
  "rfis",
  "submittals",
] as const;

type AllowedTable = (typeof ALLOWED_TABLES)[number];

const Schema = z.object({
  table: z.enum(ALLOWED_TABLES),
  id: z.string().uuid(),
  /** Field-level patch. Keys MUST be column names; values are JSON-serializable. */
  patch: z.record(z.string(), z.unknown()).refine((p) => Object.keys(p).length > 0, {
    message: "patch must contain at least one field",
  }),
});

/** Columns that automations may not touch even if the table is whitelisted. */
const FORBIDDEN_COLUMNS = new Set(["id", "org_id", "created_by", "created_at"]);

registerAction({
  type: "record.update",
  schema: Schema,
  label: "Update Record",
  description: "Patches a record in an allowlisted table, scoped to the run's org.",
  async run(input, ctx) {
    const safePatch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input.patch)) {
      if (FORBIDDEN_COLUMNS.has(key)) continue;
      safePatch[key] = value;
    }
    if (Object.keys(safePatch).length === 0) {
      throw new Error("record.update: patch contained only forbidden columns");
    }

    const svc = createServiceClient();
    // The Supabase typed client can't infer arbitrary table updates from a
    // dynamic string. Use a `never` cast at the boundary; we've already
    // gated `table` to a typed enum upstream.
    const table: AllowedTable = input.table;
    const { data, error } = await svc
      .from(table)
      .update(safePatch as never)
      .eq("id", input.id)
      .eq("org_id", ctx.orgId)
      .select("id")
      .maybeSingle();

    if (error) throw new Error(`record.update: ${error.message}`);
    if (!data) throw new Error(`record.update: row ${input.id} not found in ${table} (or wrong org)`);

    return { output: { updated: true, id: (data as { id: string }).id, table } };
  },
});

export { ALLOWED_TABLES };
