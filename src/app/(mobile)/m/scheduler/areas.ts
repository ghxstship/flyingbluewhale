import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Kit 32 · Shift Scheduler — the Area / Zone option list.
 *
 * The kit's FORMS.shift `area` select carries seed labels ("Gate 3 · Fort
 * Charles"); the repo resolves the same shape from the org's real
 * `venue_zones` × `venues` (zone label = `Zone · Venue`, plus venue-only
 * entries for venues without zones). Shared by the page (renders the select)
 * and the create action (maps the submitted label back to ids) so the two
 * can never disagree about what a label means.
 */
export type AreaOption = { label: string; venueId: string | null; zoneId: string | null };

export async function listAreaOptions(
  supabase: SupabaseClient<Database>,
  orgId: string,
): Promise<AreaOption[]> {
  const [{ data: zones }, { data: venues }] = await Promise.all([
    supabase
      .from("venue_zones")
      .select("id, name, venue_id, venue:venue_id(name)")
      .eq("org_id", orgId)
      .order("name")
      .limit(200),
    supabase.from("venues").select("id, name").eq("org_id", orgId).order("name").limit(100),
  ]);

  const out: AreaOption[] = [];
  const seen = new Set<string>();
  const zonedVenues = new Set<string>();
  for (const z of zones ?? []) {
    const venueName = (z.venue as { name: string | null } | null)?.name ?? null;
    const label = venueName ? `${z.name} · ${venueName}` : z.name;
    if (seen.has(label)) continue;
    seen.add(label);
    zonedVenues.add(z.venue_id);
    out.push({ label, venueId: z.venue_id, zoneId: z.id });
  }
  for (const v of venues ?? []) {
    if (seen.has(v.name)) continue;
    seen.add(v.name);
    out.push({ label: v.name, venueId: v.id, zoneId: null });
  }
  return out;
}
