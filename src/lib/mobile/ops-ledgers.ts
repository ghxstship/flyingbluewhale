import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import type {
  OpsReport,
  OpsInspection,
  OpsLogistics,
  OpsTravel,
  OpsPermit,
  DockSlot,
  GateEntry,
  DeliveryTicket,
} from "./ops-seed";

/**
 * Server-only resolvers for the 8 COMPVSS Operations/Logistics field ledgers,
 * reading the real org-scoped `field_*` tables (migration
 * 20260721040956_compvss_field_ops_ledgers_backing) and mapping each row onto
 * the existing `Ops*` view shapes so the surface configs are unchanged. RLS is
 * the authorization boundary; the explicit `.eq("org_id", …)` narrows the read.
 * Loose client because these tables aren't in the generated Database types yet.
 */

const hhmm = (iso: string): string => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

async function readTable<T>(table: string, orgId: string): Promise<T[]> {
  const supabase = await createClient();
  const db = supabase as unknown as LooseSupabase;
  const { data } = await db.from(table).select("*").eq("org_id", orgId).order("created_at", { ascending: false });
  return (data ?? []) as T[];
}

type ReportRow = { id: string; title: string; report_kind: string; severity: string | null; filed_by: string | null; area: string | null; report_state: string; icon: string | null; created_at: string };
type InspectionRow = { id: string; title: string; category: string | null; area: string | null; done: number; checks: number; inspector: string | null; inspection_state: string; icon: string | null; created_at: string };
type ShipmentRow = { id: string; title: string; carrier: string | null; dock: string | null; window_label: string | null; direction: string; shipment_state: string };
type TravelRow = { id: string; title: string; detail: string | null; when_label: string | null; travel_state: string; icon: string | null };
type PermitRow = { id: string; title: string; authority: string | null; validity_label: string | null; permit_state: string; icon: string | null };
type DockRow = { id: string; dock: string; slot_time: string | null; duration_label: string | null; label: string | null; direction: string; dock_state: string };
type GateRow = { id: string; vehicle: string; carrier: string | null; driver: string | null; dock: string | null; credential_label: string | null; gate_state: string; eta_label: string | null };
type DeliveryRow = { id: string; ref: string | null; title: string; from_loc: string | null; to_loc: string | null; pieces: number; runner: string | null; need_label: string | null; delivery_state: string; eta_label: string | null };

export async function listFieldReports(orgId: string): Promise<OpsReport[]> {
  const rows = await readTable<ReportRow>("field_reports", orgId);
  return rows.map((r) => ({
    id: r.id, t: r.title, type: r.report_kind, sev: r.severity ?? undefined,
    by: r.filed_by ?? "", area: r.area ?? "", time: hhmm(r.created_at),
    status: r.report_state, icon: r.icon ?? "ClipboardList",
  }));
}

export async function listFieldInspections(orgId: string): Promise<OpsInspection[]> {
  const rows = await readTable<InspectionRow>("field_inspections", orgId);
  return rows.map((r) => ({
    id: r.id, t: r.title, cat: r.category ?? "custom", area: r.area ?? "",
    done: r.done, checks: r.checks, by: r.inspector ?? "", time: hhmm(r.created_at),
    status: r.inspection_state, icon: r.icon ?? "ClipboardCheck",
  }));
}

export async function listFieldShipments(orgId: string): Promise<OpsLogistics[]> {
  const rows = await readTable<ShipmentRow>("field_shipments", orgId);
  return rows.map((r) => ({
    id: r.id, t: r.title, carrier: r.carrier ?? "", dock: r.dock ?? "",
    when: r.window_label ?? "", dir: r.direction === "out" ? "out" : "in", status: r.shipment_state,
  }));
}

export async function listFieldTravel(orgId: string): Promise<OpsTravel[]> {
  const rows = await readTable<TravelRow>("field_travel", orgId);
  return rows.map((r) => ({
    id: r.id, t: r.title, detail: r.detail ?? "", when: r.when_label ?? "",
    status: r.travel_state, icon: r.icon ?? "Plane",
  }));
}

export async function listFieldPermits(orgId: string): Promise<OpsPermit[]> {
  const rows = await readTable<PermitRow>("field_permits", orgId);
  return rows.map((r) => ({
    id: r.id, t: r.title, auth: r.authority ?? "", exp: r.validity_label ?? "",
    status: r.permit_state, icon: r.icon ?? "ShieldCheck",
  }));
}

export async function listFieldDockSlots(orgId: string): Promise<DockSlot[]> {
  const rows = await readTable<DockRow>("field_dock_slots", orgId);
  return rows.map((r) => ({
    id: r.id, dock: r.dock, time: r.slot_time ?? "", dur: r.duration_label ?? "",
    label: r.label ?? "", dir: r.direction === "out" ? "out" : "in", status: r.dock_state,
  }));
}

export async function listFieldGateQueue(orgId: string): Promise<GateEntry[]> {
  const rows = await readTable<GateRow>("field_gate_queue", orgId);
  return rows.map((r) => ({
    id: r.id, vehicle: r.vehicle, carrier: r.carrier ?? "", driver: r.driver ?? "",
    dock: r.dock ?? "", cred: r.credential_label ?? "", status: r.gate_state, eta: r.eta_label ?? "",
  }));
}

export async function listFieldDeliveries(orgId: string): Promise<DeliveryTicket[]> {
  const rows = await readTable<DeliveryRow>("field_deliveries", orgId);
  return rows.map((r) => ({
    id: r.id, ref: r.ref ?? "", t: r.title, from: r.from_loc ?? "", to: r.to_loc ?? "",
    pieces: r.pieces, runner: r.runner ?? "", need: r.need_label ?? "", status: r.delivery_state, eta: r.eta_label ?? "",
  }));
}
