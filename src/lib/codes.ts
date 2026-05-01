import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Generate the next per-org sequential code for a given table+prefix.
 *
 * We use a SELECT-then-format pattern (count rows + 1, zero-padded) rather
 * than a Postgres sequence so the codes stay tenant-scoped without per-org
 * sequences and so they read naturally (e.g. RFI-001, PUNCH-014).
 *
 * The trade-off is that two concurrent inserts can race to the same code.
 * The unique (org_id, code) constraint on every code-bearing table will
 * catch that — callers should retry on a duplicate-key error.
 */
export async function nextOrgCode(table: string, orgId: string, prefix: string, pad = 3): Promise<string> {
  const supabase = await createClient();
  const { count } = await (
    supabase as unknown as {
      from: (t: string) => {
        select: (
          cols: string,
          opts: { count: "exact"; head: true },
        ) => {
          eq: (col: string, val: string) => Promise<{ count: number | null }>;
        };
      };
    }
  )
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId);
  const n = (count ?? 0) + 1;
  return `${prefix}-${String(n).padStart(pad, "0")}`;
}
