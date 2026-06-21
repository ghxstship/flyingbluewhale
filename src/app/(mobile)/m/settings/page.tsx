import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { SettingsView, type ProfileData } from "./SettingsView";

export const dynamic = "force-dynamic";

/**
 * /m/settings — crew self-service settings + profile editor. Reads the
 * caller's identity (`users`), public crew profile (`user_profiles`:
 * tagline/bio), and contact/cert details from their `crew_members` row. The
 * surviving client `SettingsView` owns the editable form (saveProfile),
 * appearance toggles, and account pause/archive. Sign-out POSTs to the
 * canonical `/auth/signout`.
 *
 * Design truth: prototype profile (app.jsx 2842-3001) + settings (3306-3704).
 * Note: the legacy /m/settings/notifications sub-route was deleted — the
 * per-channel matrix now lives at /m/notifications.
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

  const [{ data: user }, { data: profile }, { data: crew }] = await Promise.all([
    supabase.from("users").select("id, name, email").eq("id", session.userId).maybeSingle(),
    supabase
      .from("user_profiles")
      .select("display_name, tagline, bio")
      .eq("user_id", session.userId)
      .maybeSingle(),
    supabase
      .from("crew_members")
      .select("phone, certifications")
      .eq("org_id", session.orgId)
      .eq("user_id", session.userId)
      .maybeSingle(),
  ]);

  const u = (user as { name: string | null; email: string } | null) ?? null;
  const p =
    (profile as { display_name: string | null; tagline: string | null; bio: string | null } | null) ??
    null;
  const c = (crew as { phone: string | null; certifications: string[] | null } | null) ?? null;

  const data: ProfileData = {
    name: u?.name ?? p?.display_name ?? "",
    email: u?.email ?? session.email ?? "",
    tagline: p?.tagline ?? "",
    bio: p?.bio ?? "",
    phone: c?.phone ?? "",
    certs: c?.certifications ?? [],
  };

  const labels = {
    profileHeading: t("m.settings.profile.heading", undefined, "Profile"),
    name: t("m.settings.profile.name", undefined, "Full Name"),
    tagline: t("m.settings.profile.tagline", undefined, "Tagline"),
    bio: t("m.settings.profile.bio", undefined, "Bio"),
    contact: t("m.settings.contact.heading", undefined, "Contact"),
    phone: t("m.settings.contact.phone", undefined, "Mobile"),
    email: t("m.settings.contact.email", undefined, "Work"),
    certs: t("m.settings.certs.heading", undefined, "Certifications"),
    noCerts: t("m.settings.certs.none", undefined, "No certifications on file."),
    save: t("m.settings.save", undefined, "Save"),
    saved: t("m.settings.saved", undefined, "Saved."),
    appearance: t("m.settings.appearance.heading", undefined, "Appearance"),
    theme: t("m.settings.appearance.theme", undefined, "Theme"),
    density: t("m.settings.appearance.density", undefined, "Density"),
    account: t("m.settings.account.heading", undefined, "Account"),
    accountStatus: t("m.settings.account.status", undefined, "Account Status"),
    accountStatusDesc: t(
      "m.settings.account.statusDesc",
      undefined,
      "Pause or archive · reversible pause, records preserved",
    ),
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
