import "server-only";

/**
 * Loosely-typed Supabase client wrapper for the narrow set of call sites
 * that genuinely can't use the typed client:
 *   - Dynamic table access (table name is a row value, not a literal) —
 *     e.g. AI field agents (`src/lib/ai/agents.ts`).
 *   - SCIM endpoints whose request bodies and table column shapes are
 *     SCIM-protocol-defined, not Supabase-defined.
 *
 * RLS remains the actual authorization boundary — this type just lets
 * the dynamic call sites compile without per-call coercion.
 *
 * NOTE: as of 2026-05 the regenerated `database.types.ts` covers every
 * table in the schema. New code should use the typed client directly;
 * reach for LooseSupabase only when the typed client provably can't
 * express the call (dynamic table names, SCIM, etc.). If you find
 * yourself adding a new `as unknown as LooseSupabase` cast, double-check
 * that the table you're touching isn't already in the typed Database.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export type LooseSupabase = {
  from: (table: string) => {
    select: (cols?: string, opts?: { count?: "exact" | "planned" | "estimated"; head?: boolean }) => any;
    insert: (
      rows: Record<string, unknown> | Record<string, unknown>[],
      opts?: { count?: string; defaultToNull?: boolean },
    ) => any;
    update: (row: Record<string, unknown>) => any;
    upsert: (
      rows: Record<string, unknown> | Record<string, unknown>[],
      opts?: { onConflict?: string; ignoreDuplicates?: boolean },
    ) => any;
    delete: () => any;
  };
  auth: {
    getUser: () => Promise<{ data: { user: { id: string } | null } }>;
    admin: any;
  };
  rpc: (name: string, params?: Record<string, unknown>) => any;
};
/* eslint-enable @typescript-eslint/no-explicit-any */
