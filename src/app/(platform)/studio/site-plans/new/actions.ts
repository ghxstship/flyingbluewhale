"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { buildAtomId, SITEPLAN_ATOM_ID_RE } from "@/lib/siteplan/atom-id";
import {
  SITEPLAN_SHEET_TYPES,
  SITEPLAN_SHELL_TYPES,
  type SitePlanSheetType,
  type SitePlanShellType,
} from "@/lib/siteplan/types";
import { getPreset } from "@/lib/siteplan/presets";
import { echoValues as echo, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  code: z.string().min(1).max(40),
  title: z.string().min(1).max(200),
  notes: z.string().max(2000).optional(),
  project_id: z.string().uuid().optional().or(z.literal("")),
  venue_id: z.string().uuid().optional().or(z.literal("")),
  event_id: z.string().uuid().optional().or(z.literal("")),
  // Atom-ID segments
  org_code: z.string().regex(/^[A-Z0-9]{2,4}$/, "ORG must be 2–4 alphanumerics (UPPER)"),
  evt_code: z.string().regex(/^[A-Z0-9]{3,5}$/, "EVT must be 3–5 alphanumerics (UPPER)"),
  year: z.string().regex(/^[0-9]{2}([0-9]{2})?$/, "YY must be 2 or 4 digits"),
  ven_code: z.string().regex(/^[A-Z0-9]{3,5}$/, "VEN must be 3–5 alphanumerics (UPPER)"),
  zon_code: z.string().regex(/^[A-Z0-9]{4,8}$/, "ZON must be 4–8 alphanumerics (UPPER)"),
  seq: z.coerce.number().int().min(1).max(999).default(1),
  // Structural
  sheet_type: z.enum(SITEPLAN_SHEET_TYPES),
  primary_class: z.coerce.number().int().min(0).max(9),
  tier_primary: z.coerce.number().int().min(1).max(6).optional(),
  shell_type: z.enum(SITEPLAN_SHELL_TYPES).optional(),
  shell_length_in: z.coerce.number().min(1).optional(),
  shell_width_in: z.coerce.number().min(1).optional(),
  shell_height_in: z.coerce.number().min(0).optional(),
  orientation_deg: z.coerce.number().int().min(0).max(359).optional(),
  scale: z.string().max(40).optional(),
  preset_code: z.string().max(80).optional(),
});

export type State = { error?: string; fieldErrors?: Record<string, string>; values?: Record<string, string> } | null;

export async function createSitePlanSheet(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const raw = Object.fromEntries(fd);
  // Drop empty optional values so they validate as absent — z.coerce.number()
  // turns "" into 0, which fails min() and made the form unsubmittable when
  // Tier / Shell dimensions were left blank.
  for (const key of ["preset_code", "tier_primary", "shell_length_in", "shell_width_in", "shell_height_in"]) {
    if (raw[key] === "") delete raw[key];
  }

  const parsed = Schema.safeParse(raw);
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const projectId = parsed.data.project_id || null;
  const venueId = parsed.data.venue_id || null;
  const eventId = parsed.data.event_id || null;

  // Cross-tenant guards.
  if (projectId) {
    const { data } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!data) return { error: "Project not found in your organization", values: echo(fd) };
  }
  if (venueId) {
    const { data } = await supabase
      .from("venues")
      .select("id")
      .eq("id", venueId)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (!data) return { error: "Venue not found in your organization", values: echo(fd) };
  }
  if (eventId) {
    const { data } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (!data) return { error: "Event not found in your organization", values: echo(fd) };
  }

  // Build the canonical Atom ID per protocol §3.
  let atomId: string;
  try {
    atomId = buildAtomId({
      org: parsed.data.org_code,
      evt: parsed.data.evt_code,
      year: parsed.data.year,
      ven: parsed.data.ven_code,
      primaryClass: parsed.data.primary_class,
      sheetType: parsed.data.sheet_type as SitePlanSheetType,
      zon: parsed.data.zon_code,
      seq: parsed.data.seq,
      rev: "A",
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to build atom ID", values: echo(fd) };
  }
  // Belt-and-suspenders — should be unreachable when builder accepts.
  if (!SITEPLAN_ATOM_ID_RE.test(atomId)) {
    return { error: `Built atom id is malformed: ${atomId}`, values: echo(fd) };
  }

  const shellDims =
    parsed.data.shell_length_in && parsed.data.shell_width_in
      ? {
          length_in: parsed.data.shell_length_in,
          width_in: parsed.data.shell_width_in,
          height_in: parsed.data.shell_height_in ?? 0,
          gross_sqft: Math.round((parsed.data.shell_length_in * parsed.data.shell_width_in) / 144),
        }
      : null;

  const { data: sheet, error } = await supabase
    .from("site_plans")
    .insert({
      org_id: session.orgId,
      project_id: projectId,
      venue_id: venueId,
      event_id: eventId,
      code: parsed.data.code,
      title: parsed.data.title,
      notes: parsed.data.notes || null,
      created_by: session.userId,
      // Atom-ID enrichment
      atom_id: atomId,
      sheet_type: parsed.data.sheet_type,
      primary_class: parsed.data.primary_class,
      tier_primary: parsed.data.tier_primary ?? null,
      shell_type: (parsed.data.shell_type as SitePlanShellType | undefined) ?? null,
      shell_dimensions: shellDims,
      orientation_deg: parsed.data.orientation_deg ?? null,
      scale: parsed.data.scale || null,
      zone_code: parsed.data.zon_code,
      preset_code: parsed.data.preset_code || null,
      document_state: "draft",
      revision_letter: "A",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      if (error.message.includes("atom_id")) {
        return { error: `Atom ID "${atomId}" already exists. Bump SEQ or revise codes.`, values: echo(fd) };
      }
      return { error: `Sheet code "${parsed.data.code}" already exists in this scope.`, values: echo(fd) };
    }
    return { error: error.message, values: echo(fd) };
  }

  // Instantiate preset ps-skel (regions/bands/stations) when one was selected.
  if (parsed.data.preset_code) {
    const preset = getPreset(parsed.data.preset_code);
    if (preset) {
      const presetResult = await instantiatePreset(supabase, session.orgId, sheet.id, preset);
      if (presetResult?.error) return { error: presetResult.error, values: echo(fd) };
    }
  }

  revalidatePath("/studio/site-plans");
  redirect(`/studio/site-plans/${sheet.id}`);
}

type PresetArg = NonNullable<ReturnType<typeof getPreset>>;

async function instantiatePreset(supabase: LooseSupabase, orgId: string, sheetId: string, preset: PresetArg) {
  if (preset.regions.length > 0) {
    const { error: insertError2 } = await supabase.from("siteplan_zone_region").insert(
      preset.regions.map((r) => ({
        org_id: orgId,
        sheet_id: sheetId,
        code: r.code,
        label: r.label,
        class_tag: r.class_tag ?? null,
      })),
    );
    if (insertError2) return { error: insertError2.message };
  }

  const bandIds: string[] = [];
  if (preset.bands.length > 0) {
    const { error: insertError, data: bandRows } = await supabase
      .from("siteplan_band")
      .insert(
        preset.bands.map((b) => ({
          org_id: orgId,
          sheet_id: sheetId,
          band_type: b.band_type,
          edge: b.edge,
          depth_in: b.depth_in,
          label: b.label ?? null,
        })),
      )
      .select("id");
    if (insertError) return { error: insertError.message };
    for (const row of (bandRows ?? []) as Array<{ id: string }>) {
      bandIds.push(row.id);
    }
  }

  if (preset.stations.length > 0) {
    const { error } = await supabase.from("siteplan_station").insert(
      preset.stations.map((s) => ({
        org_id: orgId,
        sheet_id: sheetId,
        band_id: bandIds[s.band_index ?? 0] ?? bandIds[0],
        station_code: s.station_code,
        function: s.function,
        head_count: s.head_count ?? 1,
      })),
    );
    if (error) return { error: error.message };
  }
}
