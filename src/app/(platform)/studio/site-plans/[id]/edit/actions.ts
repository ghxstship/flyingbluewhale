"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { SITEPLAN_SHEET_TYPES, SITEPLAN_SHELL_TYPES } from "@/lib/siteplan/types";
import { actionFail, formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

const DISCIPLINES = [
  "site",
  "rigging",
  "power",
  "audio",
  "video",
  "lighting",
  "comms",
  "evacuation",
  "hospitality",
  "accessibility",
  "sustainability",
  "other",
] as const;

const Schema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1).max(40),
  title: z.string().min(1).max(200),
  discipline: z.enum(DISCIPLINES),
  sheet_type: z.enum(SITEPLAN_SHEET_TYPES),
  primary_class: z.coerce.number().int().min(0).max(9),
  tier_primary: z.coerce.number().int().min(1).max(6).optional(),
  shell_type: z.enum(SITEPLAN_SHELL_TYPES).optional(),
  shell_length_in: z.coerce.number().min(0).optional(),
  shell_width_in: z.coerce.number().min(0).optional(),
  shell_height_in: z.coerce.number().min(0).optional(),
  orientation_deg: z.coerce.number().int().min(0).max(359).optional(),
  scale: z.string().max(40).optional(),
  sustainability_tag: z.string().max(20).optional(),
  accessibility_tag: z.string().max(20).optional(),
  weather_exposure: z.string().max(20).optional(),
  security_level: z.string().max(20).optional(),
  sensitivity: z.string().max(10).optional(),
  project_id: z.string().uuid().optional().or(z.literal("")),
  venue_id: z.string().uuid().optional().or(z.literal("")),
  event_id: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().max(2000).optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateSitePlanSheet(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const raw = Object.fromEntries(fd);
  // Drop empty optional values so they validate as absent — z.coerce.number()
  // turns "" into 0, which fails min() for tier and rejects blank shell dims.
  for (const key of ["tier_primary", "shell_length_in", "shell_width_in", "shell_height_in"]) {
    if (raw[key] === "") delete raw[key];
  }
  const parsed = Schema.safeParse(raw);
  if (!parsed.success) return formFail(parsed.error, fd);
  const { id, ...patch } = parsed.data;

  const supabase = (await createClient()) as unknown as LooseSupabase;

  if (patch.project_id) {
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", patch.project_id)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!project) return { error: actionErrorMessage("not-found.project-in-org", "Project not found in your organization") };
  }
  if (patch.venue_id) {
    const { data: venue } = await supabase
      .from("venues")
      .select("id")
      .eq("id", patch.venue_id)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (!venue) return { error: actionErrorMessage("not-found.venue-in-org", "Venue not found in your organization") };
  }
  if (patch.event_id) {
    const { data: event } = await supabase
      .from("events")
      .select("id")
      .eq("id", patch.event_id)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (!event) return { error: actionErrorMessage("not-found.event-in-org", "Event not found in your organization") };
  }

  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  if (!expectedUpdatedAt) return { error: actionErrorMessage("missing-concurrency-token-reload-the-page-and-try-again", "Missing concurrency token. Reload the page and try again.") };

  const shellDims =
    patch.shell_length_in && patch.shell_width_in
      ? {
          length_in: patch.shell_length_in,
          width_in: patch.shell_width_in,
          height_in: patch.shell_height_in ?? 0,
          gross_sqft: Math.round((patch.shell_length_in * patch.shell_width_in) / 144),
        }
      : null;

  // Manual optimistic-concurrency update — gates on `updated_at == expected`.
  const { data: updated, error } = await supabase
    .from("site_plans")
    .update({
      code: patch.code,
      title: patch.title,
      discipline: patch.discipline,
      sheet_type: patch.sheet_type,
      primary_class: patch.primary_class,
      tier_primary: patch.tier_primary ?? null,
      shell_type: patch.shell_type ?? null,
      shell_dimensions: shellDims,
      orientation_deg: patch.orientation_deg ?? null,
      scale: patch.scale || null,
      sustainability_tag: patch.sustainability_tag || null,
      accessibility_tag: patch.accessibility_tag || null,
      weather_exposure: patch.weather_exposure || null,
      security_level: patch.security_level || null,
      sensitivity: patch.sensitivity || null,
      project_id: patch.project_id || null,
      venue_id: patch.venue_id || null,
      event_id: patch.event_id || null,
      notes: patch.notes || null,
    })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .eq("updated_at", expectedUpdatedAt)
    .select("id")
    .maybeSingle();

  if (error) return actionFail(error.message, fd);
  if (!updated) {
    // Either the row no longer exists or the concurrency token didn't match.
    const { data: stillThere } = await supabase
      .from("site_plans")
      .select("id")
      .eq("id", id)
      .eq("org_id", session.orgId)
      .maybeSingle();
    return { error: stillThere ? STALE_ROW_MESSAGE : actionErrorMessage("not-found.sheet", "Sheet not found.") };
  }

  revalidatePath(`/studio/site-plans/${id}`);
  revalidatePath("/studio/site-plans");
  redirect(`/studio/site-plans/${id}`);
}
