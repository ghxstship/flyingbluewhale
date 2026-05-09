/**
 * Production Phase SDK — typed wrapper for the LDP §2 Production Lifecycle.
 *
 * Schema: fabrication_orders.production_phase typed column + production_phase_transitions
 * append-only log (added 2026-05-09).
 *
 * Lifecycle: DISCOVERY -> CONCEPT -> ENGINEERING -> PRE_PRO -> FAB -> LOGISTICS -> INSTALL -> STRIKE -> ARCHIVED
 *
 * Coexists with fabrication_orders.status (text workflow-execution column:
 * open / in_progress / blocked / complete). Phase is the LDP-canonical
 * lifecycle column; status is operational workflow-execution.
 */

import "server-only";
import { createClient } from "@/lib/supabase/server";

export const PRODUCTION_PHASES = [
  "DISCOVERY",
  "CONCEPT",
  "ENGINEERING",
  "PRE_PRO",
  "FAB",
  "LOGISTICS",
  "INSTALL",
  "STRIKE",
  "ARCHIVED",
] as const;
export type ProductionPhase = (typeof PRODUCTION_PHASES)[number];

export type FabricationOrderWithPhase = {
  id: string;
  org_id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  due_at: string | null;
  status: string; // workflow-execution: open/in_progress/blocked/complete
  production_phase: ProductionPhase;
  created_at: string;
  updated_at: string;
  xpms_atom_id: string | null;
  xtc_code: number | null;
};

export type ProductionPhaseTransition = {
  id: string;
  org_id: string;
  fabrication_order_id: string;
  from_phase: ProductionPhase | null;
  to_phase: ProductionPhase;
  transitioned_at: string;
  transitioned_by: string | null;
  reason: string | null;
  correlation_id: string | null;
};

/**
 * Sequential gating per LDP §2 — phases advance forward in order. Regression
 * to an earlier phase is permitted with explicit reason logged (per LDP §1
 * critical attributes: "phase regressions are permitted with explicit reason
 * logged; not a defect, a feature").
 */
export const PRODUCTION_PHASE_GRAPH: Record<ProductionPhase, readonly ProductionPhase[]> = {
  DISCOVERY: ["CONCEPT", "ARCHIVED"],
  CONCEPT: ["ENGINEERING", "DISCOVERY", "ARCHIVED"],
  ENGINEERING: ["PRE_PRO", "CONCEPT", "ARCHIVED"],
  PRE_PRO: ["FAB", "ENGINEERING", "ARCHIVED"],
  FAB: ["LOGISTICS", "PRE_PRO", "ARCHIVED"],
  LOGISTICS: ["INSTALL", "FAB", "ARCHIVED"],
  INSTALL: ["STRIKE", "LOGISTICS", "ARCHIVED"],
  STRIKE: ["ARCHIVED"],
  ARCHIVED: [],
};

export function canTransition(from: ProductionPhase, to: ProductionPhase): boolean {
  return PRODUCTION_PHASE_GRAPH[from].includes(to);
}

export async function listFabricationOrdersByPhase(
  orgId: string,
  phase?: ProductionPhase,
): Promise<FabricationOrderWithPhase[]> {
  const supabase = await createClient();
  let query = supabase.from("fabrication_orders").select("*").eq("org_id", orgId);
  if (phase) query = query.eq("production_phase", phase);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new Error(`listFabricationOrdersByPhase: ${error.message}`);
  return (data ?? []) as FabricationOrderWithPhase[];
}

export async function getFabricationOrder(orgId: string, id: string): Promise<FabricationOrderWithPhase | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fabrication_orders")
    .select("*")
    .eq("org_id", orgId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getFabricationOrder: ${error.message}`);
  return (data ?? null) as FabricationOrderWithPhase | null;
}

export async function listProductionPhaseTransitions(
  orgId: string,
  fabricationOrderId: string,
): Promise<ProductionPhaseTransition[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("production_phase_transitions")
    .select("*")
    .eq("org_id", orgId)
    .eq("fabrication_order_id", fabricationOrderId)
    .order("transitioned_at", { ascending: false });
  if (error) throw new Error(`listProductionPhaseTransitions: ${error.message}`);
  return (data ?? []) as ProductionPhaseTransition[];
}

export async function transitionProductionPhase(args: {
  orgId: string;
  fabricationOrderId: string;
  to: ProductionPhase;
  reason?: string;
  transitionedBy?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const current = await getFabricationOrder(args.orgId, args.fabricationOrderId);
  if (!current) return { ok: false, error: "Fabrication order not found" };
  if (!canTransition(current.production_phase, args.to)) {
    return { ok: false, error: `Cannot transition ${current.production_phase} -> ${args.to}` };
  }

  const { error: updateError } = await supabase
    .from("fabrication_orders")
    .update({ production_phase: args.to })
    .eq("org_id", args.orgId)
    .eq("id", args.fabricationOrderId);
  if (updateError) return { ok: false, error: updateError.message };

  const { error: logError } = await supabase.from("production_phase_transitions").insert({
    org_id: args.orgId,
    fabrication_order_id: args.fabricationOrderId,
    from_phase: current.production_phase,
    to_phase: args.to,
    reason: args.reason ?? null,
    transitioned_by: args.transitionedBy ?? null,
  });
  if (logError) return { ok: false, error: logError.message };

  return { ok: true };
}
