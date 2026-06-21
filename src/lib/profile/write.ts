import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Shared structured-profile writer for COMPVSS (settings + onboarding).
 *
 * Persists the full kit profile across the real 3NF tables added in migrations
 * `20260621120030_compvss_profile_3nf.sql` + `..._account_and_permissions.sql`:
 *
 *   • user_profiles        — 1:1 single-valued identity/contact columns
 *   • user_social_links     — one row per platform (upsert on (user_id,platform))
 *   • emergency_contacts    — replace-set per user
 *   • user_travel_profiles  — 1:1 sensitive travel attributes
 *   • user_uniform_sizes    — 1:1 sizing
 *   • user_certifications   — set
 *   • user_skills           — set
 *
 * RLS runs as the caller; every row is keyed on `user_id = auth.uid()`, so the
 * caller MUST pass `userId = session.userId`. Idempotent: re-running with the
 * same input converges to the same state (upserts for 1:1 rows, replace-sets
 * for the multi-valued tables).
 */

export type SocialPlatform = "linkedin" | "spotify" | "instagram" | "website";

export type EmergencyContactInput = {
  name: string;
  relationship?: string | null;
  phone?: string | null;
  email?: string | null;
  priority?: number;
};

export type ProfileData = {
  // ── user_profiles (1:1) ──────────────────────────────────────────────────
  displayName?: string | null;
  publicHandle?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  pronouns?: string | null;
  roleTitle?: string | null;
  dietaryRestrictions?: string | null;
  phone?: string | null;
  locationCity?: string | null;
  locationRegion?: string | null;
  country?: string | null;

  // ── user_social_links (per-platform; undefined = leave, "" = clear) ───────
  social?: Partial<Record<SocialPlatform, string | null>>;

  // ── emergency_contacts (replace-set) ─────────────────────────────────────
  emergencyContacts?: EmergencyContactInput[];

  // ── user_travel_profiles (1:1) ───────────────────────────────────────────
  travel?: {
    homeAirport?: string | null;
    dateOfBirth?: string | null;
    passportNumber?: string | null;
    knownTravelerNumber?: string | null;
    visas?: string | null;
    loyaltyPrograms?: string | null;
  };

  // ── user_uniform_sizes (1:1) ─────────────────────────────────────────────
  uniform?: {
    shirt?: string | null;
    pants?: string | null;
    shoe?: string | null;
    glove?: string | null;
    hat?: string | null;
  };

  // ── user_certifications (set) ────────────────────────────────────────────
  certifications?: { name: string; issuer?: string | null; issuedOn?: string | null; expiresOn?: string | null }[];

  // ── user_skills (set) ────────────────────────────────────────────────────
  skills?: string[];
};

const SOCIAL_PLATFORMS: SocialPlatform[] = ["linkedin", "spotify", "instagram", "website"];

function clean(v: string | null | undefined): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

/** True when at least one key of an object holds a defined value. */
function hasAny(obj: Record<string, unknown> | undefined): boolean {
  if (!obj) return false;
  return Object.values(obj).some((v) => v !== undefined);
}

/**
 * Upsert the structured profile for `userId`. Returns `{ error }` on the first
 * failing write (string message), or `null` on success.
 */
export async function saveProfileData(
  supabase: SupabaseClient<Database>,
  userId: string,
  data: ProfileData,
): Promise<{ error: string } | null> {
  // ── 1. user_profiles (1:1 upsert; only set provided fields) ───────────────
  const profileRow: Database["public"]["Tables"]["user_profiles"]["Insert"] = { user_id: userId };
  if (data.displayName !== undefined) profileRow.display_name = clean(data.displayName);
  if (data.publicHandle !== undefined) profileRow.public_handle = clean(data.publicHandle);
  if (data.bio !== undefined) profileRow.bio = clean(data.bio);
  if (data.avatarUrl !== undefined) profileRow.avatar_url = clean(data.avatarUrl);
  if (data.pronouns !== undefined) profileRow.pronouns = clean(data.pronouns);
  if (data.roleTitle !== undefined) profileRow.role_title = clean(data.roleTitle);
  if (data.dietaryRestrictions !== undefined)
    profileRow.dietary_restrictions = clean(data.dietaryRestrictions);
  if (data.phone !== undefined) profileRow.phone = clean(data.phone);
  if (data.locationCity !== undefined) profileRow.location_city = clean(data.locationCity);
  if (data.locationRegion !== undefined) profileRow.location_region = clean(data.locationRegion);
  if (data.country !== undefined) profileRow.country = clean(data.country);

  {
    const { error } = await supabase
      .from("user_profiles")
      .upsert(profileRow, { onConflict: "user_id" });
    if (error) return { error: error.message };
  }

  // ── 2. user_social_links (per-platform upsert/delete) ─────────────────────
  if (data.social) {
    for (const platform of SOCIAL_PLATFORMS) {
      if (!(platform in data.social)) continue; // not provided → leave as-is
      const url = clean(data.social[platform]);
      if (url) {
        const { error } = await supabase
          .from("user_social_links")
          .upsert({ user_id: userId, platform, url }, { onConflict: "user_id,platform" });
        if (error) return { error: error.message };
      } else {
        // cleared → delete the row for this platform
        const { error } = await supabase
          .from("user_social_links")
          .delete()
          .eq("user_id", userId)
          .eq("platform", platform);
        if (error) return { error: error.message };
      }
    }
  }

  // ── 3. emergency_contacts (replace-set) ───────────────────────────────────
  if (data.emergencyContacts !== undefined) {
    const { error: delErr } = await supabase
      .from("emergency_contacts")
      .delete()
      .eq("user_id", userId);
    if (delErr) return { error: delErr.message };

    const rows = data.emergencyContacts
      .map((c, i) => ({
        user_id: userId,
        name: clean(c.name) ?? "",
        relationship: clean(c.relationship),
        phone: clean(c.phone),
        email: clean(c.email),
        priority: c.priority ?? i + 1,
      }))
      .filter((r) => r.name.length > 0);
    if (rows.length) {
      const { error } = await supabase.from("emergency_contacts").insert(rows);
      if (error) return { error: error.message };
    }
  }

  // ── 4. user_travel_profiles (1:1 upsert) ──────────────────────────────────
  if (hasAny(data.travel)) {
    const tr = data.travel!;
    const travelRow: Database["public"]["Tables"]["user_travel_profiles"]["Insert"] = {
      user_id: userId,
    };
    if (tr.homeAirport !== undefined) travelRow.home_airport = clean(tr.homeAirport);
    if (tr.dateOfBirth !== undefined) travelRow.date_of_birth = clean(tr.dateOfBirth);
    if (tr.passportNumber !== undefined) travelRow.passport_number = clean(tr.passportNumber);
    if (tr.knownTravelerNumber !== undefined)
      travelRow.known_traveler_number = clean(tr.knownTravelerNumber);
    if (tr.visas !== undefined) travelRow.visas = clean(tr.visas);
    if (tr.loyaltyPrograms !== undefined) travelRow.loyalty_programs = clean(tr.loyaltyPrograms);
    const { error } = await supabase
      .from("user_travel_profiles")
      .upsert(travelRow, { onConflict: "user_id" });
    if (error) return { error: error.message };
  }

  // ── 5. user_uniform_sizes (1:1 upsert) ────────────────────────────────────
  if (hasAny(data.uniform)) {
    const uf = data.uniform!;
    const uniformRow: Database["public"]["Tables"]["user_uniform_sizes"]["Insert"] = {
      user_id: userId,
    };
    if (uf.shirt !== undefined) uniformRow.shirt = clean(uf.shirt);
    if (uf.pants !== undefined) uniformRow.pants = clean(uf.pants);
    if (uf.shoe !== undefined) uniformRow.shoe = clean(uf.shoe);
    if (uf.glove !== undefined) uniformRow.glove = clean(uf.glove);
    if (uf.hat !== undefined) uniformRow.hat = clean(uf.hat);
    const { error } = await supabase
      .from("user_uniform_sizes")
      .upsert(uniformRow, { onConflict: "user_id" });
    if (error) return { error: error.message };
  }

  // ── 6. user_certifications (replace-set) ──────────────────────────────────
  if (data.certifications !== undefined) {
    const { error: delErr } = await supabase
      .from("user_certifications")
      .delete()
      .eq("user_id", userId);
    if (delErr) return { error: delErr.message };

    const rows = data.certifications
      .map((c) => ({
        user_id: userId,
        name: clean(c.name) ?? "",
        issuer: clean(c.issuer),
        issued_on: clean(c.issuedOn),
        expires_on: clean(c.expiresOn),
      }))
      .filter((r) => r.name.length > 0);
    if (rows.length) {
      const { error } = await supabase.from("user_certifications").insert(rows);
      if (error) return { error: error.message };
    }
  }

  // ── 7. user_skills (replace-set; unique on (user_id, skill)) ──────────────
  if (data.skills !== undefined) {
    const { error: delErr } = await supabase.from("user_skills").delete().eq("user_id", userId);
    if (delErr) return { error: delErr.message };

    const seen = new Set<string>();
    const rows = data.skills
      .map((s) => clean(s))
      .filter((s): s is string => !!s && !seen.has(s.toLowerCase()) && (seen.add(s.toLowerCase()), true))
      .map((skill) => ({ user_id: userId, skill }));
    if (rows.length) {
      const { error } = await supabase.from("user_skills").insert(rows);
      if (error) return { error: error.message };
    }
  }

  return null;
}
