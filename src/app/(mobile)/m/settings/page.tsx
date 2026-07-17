import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { SettingsView, type ProfileData } from "./SettingsView";

export const dynamic = "force-dynamic";

/**
 * /m/settings — crew self-service settings + structured profile editor. Reads
 * the caller's identity (`users`) and the real 3NF profile tables added in the
 * COMPVSS profile migration: `user_profiles` (identity/contact/dietary),
 * `user_social_links`, `emergency_contacts`, `user_travel_profiles`,
 * `user_uniform_sizes`, `user_certifications`, `user_skills`. The client
 * `SettingsView` owns the editable form (saveProfile → saveProfileData),
 * appearance toggles, and links to the account pause/archive lifecycle.
 *
 * Design truth: prototype profile (app.jsx) + settings.
 */

export default async function MobileSettingsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="screen screen-anim">
        <div className="scr-eye">{t("m.settings.eyebrow", undefined, "Account")}</div>
        <h1 className="scr-h">{t("m.settings.title", undefined, "Settings")}</h1>
        <p className="form-intro">{t("common.configureSupabase", undefined, "Configure Supabase.")}</p>
      </div>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();

  const [
    { data: user },
    { data: profile },
    { data: social },
    { data: emergency },
    { data: travel },
    { data: uniform },
    { data: certs },
    { data: skills },
  ] = await Promise.all([
    supabase.from("users").select("id, name, email").eq("id", session.userId).maybeSingle(),
    supabase
      .from("user_profiles")
      .select(
        "display_name, tagline, bio, pronouns, role_title, dietary_restrictions, phone, location_city, location_region, country",
      )
      .eq("user_id", session.userId)
      .maybeSingle(),
    supabase.from("user_social_links").select("platform, url").eq("user_id", session.userId),
    supabase
      .from("emergency_contacts")
      .select("name, relationship, phone, priority")
      .eq("user_id", session.userId)
      .order("priority", { ascending: true }),
    supabase
      .from("user_travel_profiles")
      .select("home_airport, date_of_birth, passport_number, known_traveler_number, visas, loyalty_programs")
      .eq("user_id", session.userId)
      .maybeSingle(),
    supabase
      .from("user_uniform_sizes")
      .select("shirt, pants, shoe, glove, hat")
      .eq("user_id", session.userId)
      .maybeSingle(),
    supabase.from("user_certifications").select("name").eq("user_id", session.userId),
    supabase.from("user_skills").select("skill").eq("user_id", session.userId),
  ]);

  const u = (user as { name: string | null; email: string } | null) ?? null;
  const p = profile ?? null;
  const socialMap: Record<string, string> = {};
  for (const row of (social ?? []) as { platform: string; url: string }[]) socialMap[row.platform] = row.url;
  const ec = ((emergency ?? []) as { name: string; relationship: string | null; phone: string | null }[]).slice(0, 2);

  const data: ProfileData = {
    name: u?.name ?? p?.display_name ?? "",
    email: u?.email ?? session.email ?? "",
    pronouns: p?.pronouns ?? "",
    roleTitle: p?.role_title ?? "",
    tagline: p?.tagline ?? "",
    bio: p?.bio ?? "",
    phone: p?.phone ?? "",
    locationCity: p?.location_city ?? "",
    locationRegion: p?.location_region ?? "",
    country: p?.country ?? "",
    dietaryRestrictions: p?.dietary_restrictions ?? "",
    linkedin: socialMap.linkedin ?? "",
    spotify: socialMap.spotify ?? "",
    instagram: socialMap.instagram ?? "",
    website: socialMap.website ?? "",
    emergency1Name: ec[0]?.name ?? "",
    emergency1Relationship: ec[0]?.relationship ?? "",
    emergency1Phone: ec[0]?.phone ?? "",
    emergency2Name: ec[1]?.name ?? "",
    emergency2Relationship: ec[1]?.relationship ?? "",
    emergency2Phone: ec[1]?.phone ?? "",
    homeAirport: travel?.home_airport ?? "",
    dateOfBirth: travel?.date_of_birth ?? "",
    passportNumber: travel?.passport_number ?? "",
    knownTravelerNumber: travel?.known_traveler_number ?? "",
    visas: travel?.visas ?? "",
    loyaltyPrograms: travel?.loyalty_programs ?? "",
    shirt: uniform?.shirt ?? "",
    pants: uniform?.pants ?? "",
    shoe: uniform?.shoe ?? "",
    glove: uniform?.glove ?? "",
    hat: uniform?.hat ?? "",
    certifications: ((certs ?? []) as { name: string }[]).map((c) => c.name).join(" · "),
    skills: ((skills ?? []) as { skill: string }[]).map((s) => s.skill).join(" · "),
  };

  const labels = {
    profileHeading: t("m.settings.profile.heading", undefined, "Identity"),
    name: t("m.settings.profile.name", undefined, "Full Name"),
    pronouns: t("m.settings.profile.pronouns", undefined, "Pronouns"),
    roleTitle: t("m.settings.profile.role", undefined, "Role / Title"),
    tagline: t("m.settings.profile.tagline", undefined, "Tagline"),
    bio: t("m.settings.profile.bio", undefined, "Bio"),
    contact: t("m.settings.contact.heading", undefined, "Contact"),
    phone: t("m.settings.contact.phone", undefined, "Mobile"),
    email: t("m.settings.contact.email", undefined, "Work Email"),
    city: t("m.settings.contact.city", undefined, "City"),
    region: t("m.settings.contact.region", undefined, "Region / State"),
    country: t("m.settings.contact.country", undefined, "Country"),
    emergency: t("m.settings.emergency.heading", undefined, "Emergency Contacts"),
    contactName: t("m.settings.emergency.name", undefined, "Name"),
    relationship: t("m.settings.emergency.relationship", undefined, "Relationship"),
    social: t("m.settings.social.heading", undefined, "Social"),
    linkedin: t("m.settings.social.linkedin", undefined, "LinkedIn"),
    spotify: t("m.settings.social.spotify", undefined, "Spotify"),
    instagram: t("m.settings.social.instagram", undefined, "Instagram"),
    website: t("m.settings.social.website", undefined, "Website"),
    dietary: t("m.settings.dietary.heading", undefined, "Dietary"),
    dietaryLabel: t("m.settings.dietary.label", undefined, "Dietary Restrictions"),
    travel: t("m.settings.travel.heading", undefined, "Travel"),
    homeAirport: t("m.settings.travel.airport", undefined, "Home Airport"),
    dob: t("m.settings.travel.dob", undefined, "Date of Birth"),
    passport: t("m.settings.travel.passport", undefined, "Passport No."),
    knownTraveler: t("m.settings.travel.knownTraveler", undefined, "Known Traveler"),
    visas: t("m.settings.travel.visas", undefined, "Visas"),
    loyalty: t("m.settings.travel.loyalty", undefined, "Loyalty Programs"),
    uniform: t("m.settings.uniform.heading", undefined, "Uniform"),
    shirt: t("m.settings.uniform.shirt", undefined, "Shirt"),
    pants: t("m.settings.uniform.pants", undefined, "Pants"),
    shoe: t("m.settings.uniform.shoe", undefined, "Shoe"),
    glove: t("m.settings.uniform.glove", undefined, "Glove"),
    hat: t("m.settings.uniform.hat", undefined, "Hat"),
    credentials: t("m.settings.credentials.heading", undefined, "Credentials"),
    certs: t("m.settings.certs.label", undefined, "Certifications"),
    skills: t("m.settings.skills.label", undefined, "Skills & Tags"),
    setHint: t("m.settings.setHint", undefined, "Separate with · or commas"),
    save: t("m.settings.save", undefined, "Save"),
    saved: t("m.settings.saved", undefined, "Saved."),
    appearance: t("m.settings.appearance.heading", undefined, "Appearance"),
    theme: t("m.settings.appearance.theme", undefined, "Theme"),
    density: t("m.settings.appearance.density", undefined, "Density"),
    account: t("m.settings.account.heading", undefined, "Account"),
    accountStatus: t("m.settings.account.status", undefined, "Account Status"),
    notifPrefs: t("m.settings.notifPrefs", undefined, "Notification Preferences"),
    notifPrefsDesc: t("m.settings.notifPrefsDesc", undefined, "Choose What Pings You, Per Kind"),
    accountStatusDesc: t(
      "m.settings.account.statusDesc",
      undefined,
      "Pause, export or delete · reversible pause, records preserved",
    ),
    changelog: t("m.settings.changelog.title", undefined, "What's New"),
    changelogDesc: t("m.settings.changelog.desc", undefined, "Recent Releases & Field Notes"),
    about: t("m.settings.about.title", undefined, "About · Legal"),
    aboutDesc: t("m.settings.about.desc", undefined, "Version, licenses, privacy & terms"),
    support: t("m.settings.support.title", undefined, "Help & Support"),
    supportDesc: t("m.settings.support.desc", undefined, "FAQs, contact, report a problem"),
    signOut: t("m.settings.signOut", undefined, "Sign Out"),
  };

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.settings.eyebrow", undefined, "Account")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.settings.title", undefined, "Settings")}
      </h1>
      <SettingsView data={data} labels={labels} />
    </div>
  );
}
