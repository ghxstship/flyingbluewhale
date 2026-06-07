import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateSettings } from "./actions";

export const dynamic = "force-dynamic";

export default async function PersonalSettings() {
  const { t } = await getRequestT();
  let prefs: { density?: string | null; locale?: string | null; timezone?: string | null } = {};
  if (hasSupabase) {
    const session = await requireSession();
    const supabase = await createClient();
    const { data } = await supabase
      .from("user_preferences")
      .select("density, locale, timezone")
      .eq("user_id", session.userId)
      .maybeSingle();
    if (data) prefs = data;
  }
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{t("me.settings.title", undefined, "Settings")}</h1>
      <div className="surface mt-6 p-6">
        <div className="text-sm font-semibold">{t("me.settings.appearance.title", undefined, "Appearance")}</div>
        <div className="mt-3">
          <ThemeToggle />
        </div>
      </div>
      <div className="surface mt-6 p-6">
        <h2 className="text-sm font-semibold">
          {t("me.settings.workspace.title", undefined, "Workspace Preferences")}
        </h2>
        <p className="mt-1 text-xs text-[var(--p-text-2)]">
          {t(
            "me.settings.workspace.blurb",
            undefined,
            "Density, locale, and timezone apply across every workspace you belong to.",
          )}
        </p>
        <div className="mt-4 max-w-md">
          <FormShell
            action={updateSettings}
            submitLabel={t("me.settings.workspace.submit", undefined, "Save Preferences")}
          >
            <div>
              <label className="text-xs font-medium text-[var(--p-text-2)]">
                {t("me.settings.workspace.density.label", undefined, "Density")}
              </label>
              <select name="density" defaultValue={prefs.density ?? "comfortable"} className="ps-input mt-1.5 w-full">
                <option value="compact">{t("me.settings.workspace.density.compact", undefined, "Compact")}</option>
                <option value="comfortable">
                  {t("me.settings.workspace.density.comfortable", undefined, "Comfortable")}
                </option>
                <option value="spacious">{t("me.settings.workspace.density.spacious", undefined, "Spacious")}</option>
              </select>
            </div>
            <Input
              label={t("me.settings.workspace.locale.label", undefined, "Locale — e.g. en, en-US, es")}
              name="locale"
              maxLength={8}
              defaultValue={prefs.locale ?? "en-US"}
            />
            <Input
              label={t("me.settings.workspace.timezone.label", undefined, "Timezone — IANA, e.g. America/New_York")}
              name="timezone"
              maxLength={64}
              defaultValue={prefs.timezone ?? ""}
              placeholder={t("me.settings.workspace.timezone.placeholder", undefined, "Auto-detected if blank")}
            />
          </FormShell>
        </div>
      </div>
    </div>
  );
}
