import "server-only";

/**
 * JSON strategy — Opportunity #8.
 *
 * Produces a two-space-indented JSON document with a stable envelope:
 *   { exported_at, org_id, kind, count, rows }
 * so downstream consumers can key off `kind` and compare exports over
 * time without inspecting data shape.
 */

export function rowsToJson(args: {
  orgId: string;
  kind: string;
  rows: unknown[];
}): string {
  return JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      org_id: args.orgId,
      kind: args.kind,
      count: args.rows.length,
      rows: args.rows,
    },
    null,
    2,
  );
}
