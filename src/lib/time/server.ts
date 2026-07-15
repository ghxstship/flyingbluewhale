import "server-only";
import type { createClient } from "@/lib/supabase/server";
import { DEFAULT_ORG_TIME_SETTINGS, type OrgTimeSettings, type PolicyZone } from "./policy";

/**
 * Server-side loader for the geofence policy context.
 *
 * Both punch routes (`/api/v1/time/clock`, `/api/v1/shifts/checkin`) and
 * the client policy endpoint (`/api/v1/time/policy`) read through here, so
 * "what is this org's policy" has one answer.
 */

/** The request-scoped RLS client, typed as the routes hold it. */
type Db = Awaited<ReturnType<typeof createClient>>;

/**
 * An org with no `org_time_settings` row gets the documented defaults,
 * which reproduce pre-Phase-1 behaviour (record_only). The row is created
 * lazily by the settings surface — its absence is normal, not an error.
 */
export async function loadOrgTimeSettings(supabase: Db, orgId: string): Promise<OrgTimeSettings> {
  const { data } = await supabase
    .from("org_time_settings")
    .select("geofence_policy, accuracy_threshold_m, grace_radius_m, allow_offline_punch_when_blocking")
    .eq("org_id", orgId)
    .maybeSingle();
  if (!data) return DEFAULT_ORG_TIME_SETTINGS;
  return {
    geofence_policy: data.geofence_policy as OrgTimeSettings["geofence_policy"],
    accuracy_threshold_m: data.accuracy_threshold_m,
    grace_radius_m: data.grace_radius_m,
    allow_offline_punch_when_blocking: data.allow_offline_punch_when_blocking,
  };
}

/** Active, non-deleted zones with their per-zone policy overrides. */
export async function loadPolicyZones(supabase: Db, orgId: string): Promise<PolicyZone[]> {
  const { data } = await supabase
    .from("time_clock_zones")
    .select("id, name, center_lat, center_lng, radius_m, geofence_policy, accuracy_threshold_m, grace_radius_m")
    .eq("org_id", orgId)
    .eq("lifecycle_state", "active")
    .is("deleted_at", null);
  return (data ?? []) as unknown as PolicyZone[];
}

export async function loadPunchPolicyContext(
  supabase: Db,
  orgId: string,
): Promise<{ settings: OrgTimeSettings; zones: PolicyZone[] }> {
  const [settings, zones] = await Promise.all([loadOrgTimeSettings(supabase, orgId), loadPolicyZones(supabase, orgId)]);
  return { settings, zones };
}
