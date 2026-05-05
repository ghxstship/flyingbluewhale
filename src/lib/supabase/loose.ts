import "server-only";

/**
 * Loosely-typed Supabase client wrapper for tables that haven't yet made it
 * into the generated `database.types.ts` snapshot. Used by phases of the
 * SmartSuite parity roadmap that ship new tables before types are regenerated
 * (Teams, record_grants, SCIM tokens, IP allowlist, Slack workspaces, etc.).
 *
 * RLS remains the actual authorization boundary — the type loosening here
 * just lets new-table code compile without coercing each call site.
 *
 * Once `npm run gen:types` pulls the new tables into the typed client, the
 * `as unknown as LooseSupabase` casts at call sites become redundant and can
 * be deleted.
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
