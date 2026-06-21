"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { saveProfileData, type EmergencyContactInput } from "@/lib/profile/write";

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

/**
 * Save the full structured crew profile. Writes:
 *   • `users.name`        — canonical identity display name
 *   • the 3NF profile tables via `saveProfileData` — user_profiles (identity +
 *     contact + dietary), user_social_links, emergency_contacts,
 *     user_travel_profiles, user_uniform_sizes, user_certifications, user_skills.
 *
 * The legacy `user_profiles.links` jsonb bag is retired.
 */
const ProfileInput = z.object({
  name: z.string().min(1, "Name is required.").max(120),
  pronouns: z.string().max(80).optional().default(""),
  role_title: z.string().max(120).optional().default(""),
  tagline: z.string().max(160).optional().default(""),
  bio: z.string().max(2000).optional().default(""),
  phone: z.string().max(40).optional().default(""),
  location_city: z.string().max(120).optional().default(""),
  location_region: z.string().max(120).optional().default(""),
  country: z.string().max(80).optional().default(""),
  dietary_restrictions: z.string().max(280).optional().default(""),
  // social
  linkedin: z.string().max(300).optional().default(""),
  spotify: z.string().max(300).optional().default(""),
  instagram: z.string().max(300).optional().default(""),
  website: z.string().max(300).optional().default(""),
  // emergency (two slots)
  emergency_1_name: z.string().max(120).optional().default(""),
  emergency_1_relationship: z.string().max(80).optional().default(""),
  emergency_1_phone: z.string().max(40).optional().default(""),
  emergency_2_name: z.string().max(120).optional().default(""),
  emergency_2_relationship: z.string().max(80).optional().default(""),
  emergency_2_phone: z.string().max(40).optional().default(""),
  // travel
  home_airport: z.string().max(40).optional().default(""),
  date_of_birth: z.string().max(40).optional().default(""),
  passport_number: z.string().max(80).optional().default(""),
  known_traveler_number: z.string().max(80).optional().default(""),
  visas: z.string().max(200).optional().default(""),
  loyalty_programs: z.string().max(200).optional().default(""),
  // uniform
  shirt: z.string().max(40).optional().default(""),
  pants: z.string().max(40).optional().default(""),
  shoe: z.string().max(40).optional().default(""),
  glove: z.string().max(40).optional().default(""),
  hat: z.string().max(40).optional().default(""),
  // sets (delimited)
  certifications: z.string().max(2000).optional().default(""),
  skills: z.string().max(2000).optional().default(""),
});

function tokens(v: string | undefined): string[] {
  if (!v) return [];
  return v
    .split(/[·,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function saveProfile(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = ProfileInput.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) if (i.path[0]) fieldErrors[String(i.path[0])] = i.message;
    return {
      error: "Please fix the errors below.",
      fieldErrors,
      values: Object.fromEntries(fd) as Record<string, string>,
    };
  }
  const d = parsed.data;
  const supabase = await createClient();

  // users.name — the canonical identity row.
  const { error: uErr } = await supabase.from("users").update({ name: d.name }).eq("id", session.userId);
  if (uErr) return { error: uErr.message };

  const emergencyContacts: EmergencyContactInput[] = [];
  if (d.emergency_1_name.trim()) {
    emergencyContacts.push({
      name: d.emergency_1_name,
      relationship: d.emergency_1_relationship || null,
      phone: d.emergency_1_phone || null,
      priority: 1,
    });
  }
  if (d.emergency_2_name.trim()) {
    emergencyContacts.push({
      name: d.emergency_2_name,
      relationship: d.emergency_2_relationship || null,
      phone: d.emergency_2_phone || null,
      priority: 2,
    });
  }

  const res = await saveProfileData(supabase, session.userId, {
    displayName: d.name,
    bio: d.bio,
    pronouns: d.pronouns,
    roleTitle: d.role_title,
    dietaryRestrictions: d.dietary_restrictions,
    phone: d.phone,
    locationCity: d.location_city,
    locationRegion: d.location_region,
    country: d.country,
    social: {
      linkedin: d.linkedin,
      spotify: d.spotify,
      instagram: d.instagram,
      website: d.website,
    },
    emergencyContacts,
    travel: {
      homeAirport: d.home_airport,
      dateOfBirth: d.date_of_birth,
      passportNumber: d.passport_number,
      knownTravelerNumber: d.known_traveler_number,
      visas: d.visas,
      loyaltyPrograms: d.loyalty_programs,
    },
    uniform: {
      shirt: d.shirt,
      pants: d.pants,
      shoe: d.shoe,
      glove: d.glove,
      hat: d.hat,
    },
    certifications: tokens(d.certifications).map((name) => ({ name })),
    skills: tokens(d.skills),
  });
  if (res) return { error: res.error };

  // Note: the `tagline` field is part of user_profiles too; preserve it.
  if (d.tagline !== undefined) {
    const { error: tErr } = await supabase
      .from("user_profiles")
      .upsert({ user_id: session.userId, tagline: d.tagline || null }, { onConflict: "user_id" });
    if (tErr) return { error: tErr.message };
  }

  revalidatePath("/m/settings");
  return { ok: true };
}

// The account lifecycle (pause / resume / archive-request) lives on its own
// dedicated surface — see `src/app/(mobile)/m/settings/account/actions.ts`,
// now backed by the real `user_account_status` table.
