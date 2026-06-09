"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import {
  SITEPLAN_ADJACENCY_RELS,
  SITEPLAN_BAND_TYPES,
  SITEPLAN_EDGES,
  SITEPLAN_TRANSITIONS,
  SITEPLAN_UTILITY_SERVICES,
} from "@/lib/siteplan/types";
import { actionFail, formFail } from "@/lib/forms/fail";

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

// ---------------------------------------------------------------------------
// State machine transition
// ---------------------------------------------------------------------------

const TransitionSchema = z.object({
  sheet_id: z.string().uuid(),
  transition: z.enum(SITEPLAN_TRANSITIONS),
});

// Strip the internal "siteplan:" prefix that the SQL RAISE EXCEPTIONs use
// so end users see a clean message instead of leaking the lib name.
function cleanTransitionError(msg: string): string {
  const stripped = msg.replace(/^siteplan:\s*/i, "").trim();
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

export async function transitionSheet(_: State, fd: FormData): Promise<State> {
  await requireSession();
  const parsed = TransitionSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { error } = await supabase.rpc("siteplan_transition_state", {
    p_sheet_id: parsed.data.sheet_id,
    p_transition: parsed.data.transition,
  });
  if (error) return { error: cleanTransitionError(error.message) };

  revalidatePath(`/console/site-plans/${parsed.data.sheet_id}`);
  revalidatePath(`/console/site-plans`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Zone region
// ---------------------------------------------------------------------------

const RegionSchema = z.object({
  sheet_id: z.string().uuid(),
  code: z.string().regex(/^[A-Z0-9_]{1,16}$/, "code = UPPER alphanumerics/underscore (1–16)"),
  label: z.string().min(1).max(80),
  class_tag: z.coerce.number().int().min(0).max(9).optional(),
  notes: z.string().max(500).optional(),
});

export async function addRegion(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = RegionSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { error } = await supabase.from("siteplan_zone_region").insert({
    org_id: session.orgId,
    sheet_id: parsed.data.sheet_id,
    code: parsed.data.code,
    label: parsed.data.label,
    class_tag: parsed.data.class_tag ?? null,
    notes: parsed.data.notes || null,
    created_by: session.userId,
  });
  if (error) {
    if (error.code === "23505") return { error: `Region code "${parsed.data.code}" already exists on this sheet.` };
    return actionFail(error.message, fd);
  }
  revalidatePath(`/console/site-plans/${parsed.data.sheet_id}`);
  return { ok: true };
}

const DeleteSchema = z.object({ id: z.string().uuid(), sheet_id: z.string().uuid() });

export async function deleteRegion(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = DeleteSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { error } = await supabase
    .from("siteplan_zone_region")
    .delete()
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/site-plans/${parsed.data.sheet_id}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Band
// ---------------------------------------------------------------------------

const BandSchema = z.object({
  sheet_id: z.string().uuid(),
  band_type: z.enum(SITEPLAN_BAND_TYPES),
  edge: z.enum(SITEPLAN_EDGES),
  depth_in: z.coerce.number().min(0).optional(),
  label: z.string().max(80).optional(),
});

export async function addBand(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = BandSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { error } = await supabase.from("siteplan_band").insert({
    org_id: session.orgId,
    sheet_id: parsed.data.sheet_id,
    band_type: parsed.data.band_type,
    edge: parsed.data.edge,
    depth_in: parsed.data.depth_in ?? null,
    label: parsed.data.label || null,
    created_by: session.userId,
  });
  if (error) return actionFail(error.message, fd);
  revalidatePath(`/console/site-plans/${parsed.data.sheet_id}`);
  return { ok: true };
}

export async function deleteBand(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = DeleteSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { error } = await supabase.from("siteplan_band").delete().eq("id", parsed.data.id).eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/site-plans/${parsed.data.sheet_id}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Station
// ---------------------------------------------------------------------------

const StationSchema = z.object({
  sheet_id: z.string().uuid(),
  band_id: z.string().uuid(),
  station_code: z.string().min(1).max(40),
  function: z.string().max(60).optional(),
  head_count: z.coerce.number().int().min(0).max(20).default(1),
  position_in: z.coerce.number().min(0).optional(),
});

export async function addStation(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = StationSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { error } = await supabase.from("siteplan_station").insert({
    org_id: session.orgId,
    sheet_id: parsed.data.sheet_id,
    band_id: parsed.data.band_id,
    station_code: parsed.data.station_code,
    function: parsed.data.function || null,
    head_count: parsed.data.head_count,
    position_in: parsed.data.position_in ?? null,
    created_by: session.userId,
  });
  if (error) {
    if (error.code === "23505")
      return { error: `Station code "${parsed.data.station_code}" already exists on this sheet.` };
    return actionFail(error.message, fd);
  }
  revalidatePath(`/console/site-plans/${parsed.data.sheet_id}`);
  return { ok: true };
}

export async function deleteStation(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = DeleteSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { error } = await supabase
    .from("siteplan_station")
    .delete()
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/site-plans/${parsed.data.sheet_id}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Placement
// ---------------------------------------------------------------------------

const PlacementSchema = z.object({
  sheet_id: z.string().uuid(),
  tag: z.string().min(1).max(40),
  station_id: z.string().uuid().optional().or(z.literal("")),
  band_id: z.string().uuid().optional().or(z.literal("")),
  catalog_item_id: z.string().uuid().optional().or(z.literal("")),
  uac_atom_id: z.string().max(80).optional(),
  qty: z.coerce.number().int().min(1).max(999).default(1),
  notes: z.string().max(500).optional(),
});

export async function addPlacement(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = PlacementSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { error } = await supabase.from("siteplan_placement").insert({
    org_id: session.orgId,
    sheet_id: parsed.data.sheet_id,
    tag: parsed.data.tag,
    station_id: parsed.data.station_id || null,
    band_id: parsed.data.band_id || null,
    catalog_item_id: parsed.data.catalog_item_id || null,
    uac_atom_id: parsed.data.uac_atom_id || null,
    qty: parsed.data.qty,
    notes: parsed.data.notes || null,
    created_by: session.userId,
  });
  if (error) {
    if (error.code === "23505") return { error: `Placement tag "${parsed.data.tag}" already exists on this sheet.` };
    return actionFail(error.message, fd);
  }
  revalidatePath(`/console/site-plans/${parsed.data.sheet_id}`);
  return { ok: true };
}

export async function deletePlacement(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = DeleteSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { error } = await supabase
    .from("siteplan_placement")
    .delete()
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/site-plans/${parsed.data.sheet_id}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Utility (power/gas/water/data/comms drops)
// ---------------------------------------------------------------------------

const UtilitySchema = z.object({
  sheet_id: z.string().uuid(),
  drop_code: z.string().min(1).max(40),
  service_type: z.enum(SITEPLAN_UTILITY_SERVICES),
  loads: z.string().max(400).optional(),
  circuit_id: z.string().max(40).optional(),
  notes: z.string().max(500).optional(),
});

export async function addUtility(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = UtilitySchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const loads = (parsed.data.loads ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const { error } = await supabase.from("siteplan_utility").insert({
    org_id: session.orgId,
    sheet_id: parsed.data.sheet_id,
    drop_code: parsed.data.drop_code,
    service_type: parsed.data.service_type,
    loads,
    circuit_id: parsed.data.circuit_id || null,
    notes: parsed.data.notes || null,
    created_by: session.userId,
  });
  if (error) {
    if (error.code === "23505") return { error: `Drop code "${parsed.data.drop_code}" already exists on this sheet.` };
    return actionFail(error.message, fd);
  }
  revalidatePath(`/console/site-plans/${parsed.data.sheet_id}`);
  return { ok: true };
}

export async function deleteUtility(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = DeleteSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { error } = await supabase
    .from("siteplan_utility")
    .delete()
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/site-plans/${parsed.data.sheet_id}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Adjacency
// ---------------------------------------------------------------------------

const AdjacencySchema = z.object({
  sheet_id: z.string().uuid(),
  edge: z.enum(SITEPLAN_EDGES),
  relationship: z.enum(SITEPLAN_ADJACENCY_RELS),
  adjacent_sheet_id: z.string().uuid().optional().or(z.literal("")),
  adjacent_label: z.string().max(120).optional(),
  notes: z.string().max(500).optional(),
});

export async function addAdjacency(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = AdjacencySchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { error } = await supabase.from("siteplan_adjacency").insert({
    org_id: session.orgId,
    sheet_id: parsed.data.sheet_id,
    edge: parsed.data.edge,
    relationship: parsed.data.relationship,
    adjacent_sheet_id: parsed.data.adjacent_sheet_id || null,
    adjacent_label: parsed.data.adjacent_label || null,
    notes: parsed.data.notes || null,
    created_by: session.userId,
  });
  if (error) {
    if (error.code === "23505") return { error: `Edge ${parsed.data.edge} is already declared on this sheet.` };
    return actionFail(error.message, fd);
  }
  revalidatePath(`/console/site-plans/${parsed.data.sheet_id}`);
  return { ok: true };
}

export async function deleteAdjacency(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = DeleteSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { error } = await supabase
    .from("siteplan_adjacency")
    .delete()
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/site-plans/${parsed.data.sheet_id}`);
  return { ok: true };
}
