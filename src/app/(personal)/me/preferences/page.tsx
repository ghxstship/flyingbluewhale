import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { savePreferencesAction } from "./actions";

export const dynamic = "force-dynamic";

type Prefs = {
  theme: "light" | "dark" | "system";
  density: "comfortable" | "compact" | "spacious";
  locale: string;
  timezone: string;
  consent: { essential?: boolean; analytics?: boolean; marketing?: boolean };
};

const DEFAULTS: Prefs = {
  theme: "system",
  density: "comfortable",
  locale: "en",
  timezone: "UTC",
  consent: { essential: true, analytics: false, marketing: false },
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="My Account" title="Preferences" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase to manage preferences.</div>
        </div>
      </>
    );
  }
  await requireSession();
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("user_preferences")
    .select("theme, density, locale, timezone, consent")
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
        eyebrow="My Account"
        title="Preferences"
        subtitle="Theme, density, locale, and consent."
        breadcrumbs={[{ label: "My Account", href: "/me" }, { label: "Preferences" }]}
      />
      <div className="page-content max-w-2xl">
        <FormShell action={savePreferencesAction} cancelHref="/me" submitLabel="Save Preferences">
          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
              Appearance
            </legend>

            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)]">Theme</label>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                {(["light", "dark", "system"] as const).map((t) => (
                  <label
                    key={t}
                    className="surface hover-lift flex cursor-pointer items-center gap-2 px-3 py-2 text-sm"
                  >
                    <input
                      type="radio"
                      name="theme"
                      value={t}
                      defaultChecked={prefs.theme === t}
                      className="accent-[var(--org-primary)]"
                    />
                    <span>{toTitle(t)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)]">Density</label>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                {(["compact", "comfortable", "spacious"] as const).map((d) => (
                  <label
                    key={d}
                    className="surface hover-lift flex cursor-pointer items-center gap-2 px-3 py-2 text-sm"
                  >
                    <input
                      type="radio"
                      name="density"
                      value={d}
                      defaultChecked={prefs.density === d}
                      className="accent-[var(--org-primary)]"
                    />
                    <span>{toTitle(d)}</span>
                  </label>
                ))}
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Locale</legend>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Language code"
                name="locale"
                defaultValue={prefs.locale}
                required
                maxLength={8}
                hint="e.g. en, es, fr-CA"
              />
              <Input
                label="Timezone"
                name="timezone"
                defaultValue={prefs.timezone}
                required
                maxLength={64}
                hint="IANA, e.g. America/Los_Angeles"
              />
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Consent</legend>

            <label className="surface flex cursor-not-allowed items-start gap-3 p-3 text-sm opacity-70">
              <input type="checkbox" checked disabled className="mt-0.5 accent-[var(--org-primary)]" />
              <div>
                <div className="font-medium">Essential cookies</div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  Required to keep you signed in and to remember your workspace. Cannot be disabled.
                </div>
              </div>
            </label>

            <label className="surface hover-lift flex cursor-pointer items-start gap-3 p-3 text-sm">
              <input
                type="checkbox"
                name="analytics"
                defaultChecked={prefs.consent?.analytics ?? false}
                className="mt-0.5 accent-[var(--org-primary)]"
              />
              <div>
                <div className="font-medium">Analytics</div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  Anonymous usage telemetry that helps us prioritize features and find regressions.
                </div>
              </div>
            </label>

            <label className="surface hover-lift flex cursor-pointer items-start gap-3 p-3 text-sm">
              <input
                type="checkbox"
                name="marketing"
                defaultChecked={prefs.consent?.marketing ?? false}
                className="mt-0.5 accent-[var(--org-primary)]"
              />
              <div>
                <div className="font-medium">Marketing</div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  Occasional product announcements and feature releases. Easy to unsubscribe.
                </div>
              </div>
            </label>
          </fieldset>
        </FormShell>
      </div>
    </>
  );
}
