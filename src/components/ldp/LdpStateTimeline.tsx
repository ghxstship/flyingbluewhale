import "server-only";

import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { toTitle } from "@/lib/format";

/**
 * Generic timeline renderer for any LDP `*_state_transitions` audit
 * table. The append-only ledger pattern is the same across the schema
 * (id, from_state, to_state, transitioned_at, transitioned_by, reason)
 * — this component reads N rows for a given parent entity, hydrates
 * the actor's name when present, and renders a reverse-chronological
 * scroll.
 *
 * Why a single component vs. per-table code:
 *
 *   - Several transition tables exist (msa_state_transitions,
 *     engagement_state_transitions, subscription_state_transitions,
 *     onboarding_step_state_transitions, uis_role_state_transitions,
 *     period_state_transitions). Without consolidation every detail
 *     page would copy-paste the same fetch + render shape.
 *
 *   - All such tables were SECURITY-INVOKER select-only-via-RLS — we
 *     query through the typed client when we can and fall back to the
 *     loose client for tables whose generated types lag the schema.
 *
 *   - Keeps the rendering canon in one place: a transition timeline
 *     always shows "from → to · actor · timeAgo" with optional reason.
 *
 * For new transition tables, just call this with the table name and
 * the parent-id column. RLS enforces access control downstream.
 */

export type LdpTransitionRow = {
  id: string;
  from_state: string | null;
  to_state: string;
  transitioned_at: string;
  transitioned_by: string | null;
  reason: string | null;
  actor_name?: string | null;
  actor_email?: string | null;
};

type LdpStateTimelineProps = {
  /** Transition-log table name (e.g. `msa_state_transitions`). */
  table: string;
  /** Column on the transition table that points back to the parent (e.g. `msa_id`). */
  parentColumn: string;
  /** Parent entity id to filter on. */
  parentId: string;
  /** Caller's org_id; used for the org_id filter on the transition row. */
  orgId: string;
  /** Optional cap; defaults to 50. */
  limit?: number;
  /** Optional heading override. */
  heading?: string;
  /** Optional muted subhead — usually "Append-only ledger of state changes." */
  subhead?: string;
};

export async function LdpStateTimeline({
  table,
  parentColumn,
  parentId,
  orgId,
  limit = 50,
  heading = "Lifecycle Timeline",
  subhead = "Append-only ledger — every state transition with actor + timestamp.",
}: LdpStateTimelineProps) {
  const supabase = await createClient();
  // LooseSupabase: transition tables are passed as runtime strings so the
  // typed `from(t)` literal-narrowing can't help. RLS still gates the
  // read — org_id filter is belt-and-suspenders.
  const loose = supabase as unknown as LooseSupabase;
  const { data, error } = await loose
    .from(table)
    .select("id, from_state, to_state, transitioned_at, transitioned_by, reason")
    .eq(parentColumn, parentId)
    .eq("org_id", orgId)
    .order("transitioned_at", { ascending: false })
    .limit(limit);
  if (error) {
    return (
      <section className="surface p-4">
        <h2 className="text-sm font-semibold">{heading}</h2>
        <p className="mt-2 text-xs text-[var(--p-text-2)]">Couldn&rsquo;t load transitions: {error.message}</p>
      </section>
    );
  }
  const rows = (data ?? []) as LdpTransitionRow[];

  // Hydrate actor display labels in a second round-trip. Skipped when
  // every row has transitioned_by NULL (system-only transitions).
  const actorIds = Array.from(new Set(rows.map((r) => r.transitioned_by).filter((v): v is string => !!v)));
  if (actorIds.length > 0) {
    const { data: users } = await supabase.from("users").select("id, name, email").in("id", actorIds);
    const byId = new Map(
      ((users ?? []) as Array<{ id: string; name: string | null; email: string }>).map((u) => [u.id, u]),
    );
    rows.forEach((r) => {
      if (r.transitioned_by) {
        const u = byId.get(r.transitioned_by);
        r.actor_name = u?.name ?? null;
        r.actor_email = u?.email ?? null;
      }
    });
  }

  return (
    <section className="surface p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">{heading}</h2>
        <span className="font-mono text-xs text-[var(--p-text-2)]">
          {rows.length} transition{rows.length === 1 ? "" : "s"}
        </span>
      </div>
      <p className="mt-1 text-xs text-[var(--p-text-2)]">{subhead}</p>
      {rows.length === 0 ? (
        <p className="mt-3 text-xs text-[var(--p-text-2)]">No transitions recorded yet.</p>
      ) : (
        <ol className="mt-3 space-y-2 text-xs">
          {rows.map((r) => {
            const who = r.actor_name ?? r.actor_email ?? (r.transitioned_by ? r.transitioned_by.slice(0, 8) : "system");
            return (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-2 last:border-0"
              >
                <span className="flex flex-wrap items-center gap-2">
                  {r.from_state ? (
                    <>
                      <Badge variant="muted">{toTitle(r.from_state)}</Badge> →{" "}
                      <Badge variant="info">{toTitle(r.to_state)}</Badge>
                    </>
                  ) : (
                    <>
                      <Badge variant="muted">initial</Badge> → <Badge variant="info">{toTitle(r.to_state)}</Badge>
                    </>
                  )}
                  <span className="text-[var(--p-text-2)]">by {who}</span>
                  {r.reason && <span className="text-[var(--p-text-2)]">— {r.reason}</span>}
                </span>
                <span className="font-mono text-[var(--p-text-2)]">{new Date(r.transitioned_at).toLocaleString()}</span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
