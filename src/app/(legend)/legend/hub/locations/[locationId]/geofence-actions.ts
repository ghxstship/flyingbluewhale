"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";

/**
 * Capture-geofence admin (T1-5) — the write surface for `venue_geofences`,
 * living on the LEG3ND hub location detail (the space registry's canonical
 * home). RLS holds the real gate (manager band writes); these actions add
 * the org/location boundary checks and field validation.
 */

export type GeofenceState = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

const CreateSchema = z.object({
  label: z.string().max(120).optional(),
  center_lat: z.coerce.number().min(-90).max(90),
  center_lng: z.coerce.number().min(-180).max(180),
  radius_m: z.coerce.number().int().min(10).max(10000),
  project_id: z.string().uuid().optional().or(z.literal("")),
});

export async function createGeofence(locationId: string, _prev: GeofenceState, fd: FormData): Promise<GeofenceState> {
  const session = await requireSession();
  const parsed = CreateSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const v = parsed.data;

  const supabase = await createClient();
  const { data: loc } = await supabase
    .from("locations")
    .select("id")
    .eq("id", locationId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!loc) return actionFail("That location is not in your organization.", fd);

  const { error } = await supabase.from("venue_geofences").insert({
    org_id: session.orgId,
    location_id: locationId,
    project_id: v.project_id || null,
    label: v.label || null,
    center_lat: v.center_lat,
    center_lng: v.center_lng,
    radius_m: v.radius_m,
  });
  if (error) return actionFail(error.message, fd);

  revalidatePath(`/legend/hub/locations/${locationId}`);
  return { ok: true };
}

/** Flip a fence's `active` flag. Plain-form action (no field errors possible). */
export async function toggleGeofence(geofenceId: string, locationId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("venue_geofences")
    .select("id, active")
    .eq("id", geofenceId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!row) return;
  await supabase
    .from("venue_geofences")
    .update({ active: !row.active })
    .eq("id", geofenceId)
    .eq("org_id", session.orgId);
  revalidatePath(`/legend/hub/locations/${locationId}`);
}

export async function deleteGeofence(geofenceId: string, locationId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("venue_geofences").delete().eq("id", geofenceId).eq("org_id", session.orgId);
  revalidatePath(`/legend/hub/locations/${locationId}`);
}
