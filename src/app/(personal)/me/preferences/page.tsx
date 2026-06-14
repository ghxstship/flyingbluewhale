import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { savePreferencesAction } from "./actions";

export const dynamic = "force-dynamic";

type Prefs = {
  theme: "light" | "dark" | "system";
  density: "cozy" | "compact" | "spacious";
  locale: string;
  timezone: string;
  consent: { essential?: boolean; analytics?: boolean; marketing?: boolean };
};

const DEFAULTS: Prefs = {
  theme: "system",
  density: "cozy",
  locale: "en",
  timezone: "UTC",
  consent: { essential: true, analytics: false, marketing: false },
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("me.preferences.eyebrow", undefined, "My Account")}
          title={t("me.preferences.title", undefined, "Preferences")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("me.preferences.supabaseRequired", undefined, "Configure Supabase to manage preferences.")}
          </div>
        </div>
      </>
    );
  }
  await requireSession();
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("user_preferences")
    .select("theme, density, locale, timezone, consent, ui_state")
    .eq("user_id", u.user!.id)
    .maybeSingle();

  const prefs: Prefs = {
    theme: (data?.theme as Prefs["theme"]) ?? DEFAULTS.theme,
    density: (data?.density as Prefs["density"]) ?? DEFAULTS.density,
    locale: data?.locale ?? DEFAULTS.locale,
    timezone: data?.timezone ?? DEFAULTS.timezone,
    consent: (data?.consent as Prefs["consent"]) ?? DEFAULTS.consent,
  };

  return (
    <>
      <ModuleHeader
        eyebrow={t("me.preferences.eyebrow", undefined, "My Account")}
        title={t("me.preferences.title", undefined, "Preferences")}
        subtitle={t("me.preferences.subtitle", undefined, "Theme, density, locale, and consent.")}
        breadcrumbs={[
          { label: t("me.preferences.breadcrumbs.account", undefined, "My Account"), href: "/me" },
          { label: t("me.preferences.title", undefined, "Preferences") },
        ]}
      />
      <div className="page-content max-w-2xl space-y-6">
        <FormShell
          action={savePreferencesAction}
          cancelHref="/me"
          submitLabel={t("me.preferences.submit", undefined, "Save Preferences")}
        >
          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
              {t("me.preferences.appearance.legend", undefined, "Appearance")}
            </legend>

            <div>
              <label className="text-xs font-medium text-[var(--p-text-2)]">
                {t("me.preferences.appearance.theme", undefined, "Theme")}
              </label>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                {(["light", "dark", "system"] as const).map((themeOption) => (
                  <label
                    key={themeOption}
                    className="surface hover-lift flex cursor-pointer items-center gap-2 px-3 py-2 text-sm"
                  >
                    <input
                      type="radio"
                      name="theme"
                      value={themeOption}
                      defaultChecked={prefs.theme === themeOption}
                      className="accent-[var(--p-accent)]"
                    />
                    <span>{toTitle(themeOption)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--p-text-2)]">
                {t("me.preferences.appearance.density", undefined, "Density")}
              </label>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                {(["compact", "cozy", "spacious"] as const).map((d) => (
                  <label
                    key={d}
                    className="surface hover-lift flex cursor-pointer items-center gap-2 px-3 py-2 text-sm"
                  >
                    <input
                      type="radio"
                      name="density"
                      value={d}
                      defaultChecked={prefs.density === d}
                      className="accent-[var(--p-accent)]"
                    />
                    <span>{toTitle(d)}</span>
                  </label>
                ))}
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
              {t("me.preferences.locale.legend", undefined, "Locale")}
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t("me.preferences.locale.languageCode", undefined, "Language code")}
                name="locale"
                defaultValue={prefs.locale}
                required
                maxLength={8}
                hint={t("me.preferences.locale.languageHint", undefined, "e.g. en, es, fr-CA")}
              />
              <Input
                label={t("me.preferences.locale.timezone", undefined, "Timezone")}
                name="timezone"
                defaultValue={prefs.timezone}
                required
                maxLength={64}
                hint={t("me.preferences.locale.timezoneHint", undefined, "IANA, e.g. America/Los_Angeles")}
              />
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
              {t("me.preferences.consent.legend", undefined, "Consent")}
            </legend>

            <label className="surface flex cursor-not-allowed items-start gap-3 p-3 text-sm opacity-70">
              <input type="checkbox" checked disabled className="mt-0.5 accent-[var(--p-accent)]" />
              <div>
                <div className="font-medium">
                  {t("me.preferences.consent.essential.label", undefined, "Essential cookies")}
                </div>
                <div className="text-[11px] text-[var(--p-text-2)]">
                  {t(
                    "me.preferences.consent.essential.description",
                    undefined,
                    "Required to keep you signed in and to remember your workspace. Cannot be disabled.",
                  )}
                </div>
              </div>
            </label>

            <label className="surface hover-lift flex cursor-pointer items-start gap-3 p-3 text-sm">
              <input
                type="checkbox"
                name="analytics"
                defaultChecked={prefs.consent?.analytics ?? false}
                className="mt-0.5 accent-[var(--p-accent)]"
              />
              <div>
                <div className="font-medium">{t("me.preferences.consent.analytics.label", undefined, "Analytics")}</div>
                <div className="text-[11px] text-[var(--p-text-2)]">
                  {t(
                    "me.preferences.consent.analytics.description",
                    undefined,
                    "Anonymous usage telemetry that helps us prioritize features and find regressions.",
                  )}
                </div>
              </div>
            </label>

            <label className="surface hover-lift flex cursor-pointer items-start gap-3 p-3 text-sm">
              <input
                type="checkbox"
                name="marketing"
                defaultChecked={prefs.consent?.marketing ?? false}
                className="mt-0.5 accent-[var(--p-accent)]"
              />
              <div>
                <div className="font-medium">{t("me.preferences.consent.marketing.label", undefined, "Marketing")}</div>
                <div className="text-[11px] text-[var(--p-text-2)]">
                  {t(
                    "me.preferences.consent.marketing.description",
                    undefined,
                    "Occasional product announcements and feature releases. Easy to unsubscribe.",
                  )}
                </div>
              </div>
            </label>
          </fieldset>
        </FormShell>
      </div>
    </>
  );
}
