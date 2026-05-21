import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import type {
  AtomMeta,
  AtomTask,
  AtomDeliverable,
  AtomExpense,
  AtomPO,
  AtomVariance,
} from "@/components/xpms/AtomDrillIn";

/**
 * Server-side data loader for the atom drill-in dialog. Fetches the
 * atom + every artifact type pinned to it. RLS on each table enforces
 * org/project scope; we additionally pin org_id on the atom read so a
 * malformed ?atom UUID can't cross-org-leak.
 */
export async function fetchAtomDrillIn(
  orgId: string,
  atomId: string,
): Promise<{
  atom: AtomMeta;
  tasks: AtomTask[];
  deliverables: AtomDeliverable[];
  expenses: AtomExpense[];
  poLines: AtomPO[];
  variances: AtomVariance[];
} | null> {
  const supabase = await createClient();
  const loose = supabase as unknown as LooseSupabase;

  // wbs_path was added by 0058 as a generated column; it is not in the
  // typed Database yet so this read uses LooseSupabase.
  const { data: atomRow } = (await loose
    .from("xpms_atoms")
    .select("id, identifier, name, state, phase, wbs_path")
    .eq("id", atomId)
    .eq("org_id", orgId)
    .maybeSingle()) as {
    data: {
      id: string;
      identifier: string;
      name: string;
      state: "uac" | "tpc";
      phase: string;
      wbs_path: string;
    } | null;
  };
  if (!atomRow) return null;

  const [{ data: tasks }, { data: deliverables }, { data: expenses }, { data: poLines }, { data: variances }] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("id, title, status, due_at")
        .eq("org_id", orgId)
        .eq("xpms_atom_id", atomId)
        .order("due_at", { ascending: true, nullsFirst: false }),
      // `deliverables.atom_id` was added by 0058; not yet in typed Database.
      loose
        .from("deliverables")
        .select("id, title, type, deliverable_state, status, deadline")
        .eq("org_id", orgId)
        .eq("atom_id", atomId)
        .is("deleted_at", null)
        .order("deadline", { ascending: true, nullsFirst: false }),
      supabase
        .from("expenses")
        .select("id, description, amount_cents, spent_at")
        .eq("org_id", orgId)
        .eq("atom_id", atomId)
        .order("spent_at", { ascending: false }),
      supabase
        .from("po_line_items")
        .select("id, description, quantity, unit_price_cents, purchase_order_id")
        .eq("atom_id", atomId)
        .order("position", { ascending: true }),
      supabase
        .from("xpms_variance_ledger")
        .select("id, reason, cost_delta_cents, qty_delta, recorded_at, notes")
        .eq("org_id", orgId)
        .eq("tpc_atom_id", atomId)
        .order("recorded_at", { ascending: false }),
    ]);

  return {
    atom: {
      id: atomRow.id,
      identifier: atomRow.identifier,
      name: atomRow.name,
      state: atomRow.state,
      phase: atomRow.phase,
      wbs_path: atomRow.wbs_path,
    },
    tasks: (tasks ?? []) as AtomTask[],
    deliverables: (deliverables ?? []) as unknown as AtomDeliverable[],
    expenses: (expenses ?? []) as AtomExpense[],
    poLines: (poLines ?? []) as AtomPO[],
    variances: (variances ?? []) as unknown as AtomVariance[],
  };
}
