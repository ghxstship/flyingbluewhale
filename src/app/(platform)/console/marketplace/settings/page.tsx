import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateMarketplaceSettingsAction } from "./actions";

export const dynamic = "force-dynamic";

type Org = {
  marketplace_enabled: boolean;
  marketplace_take_rate_bps: number;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.marketplace.settings.eyebrow", undefined, "Marketplace")}
          title={t("console.marketplace.settings.title", undefined, "Settings")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.marketplace.settings.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("orgs")
    .select("marketplace_enabled, marketplace_take_rate_bps")
    .eq("id", session.orgId)
    .maybeSingle();
  const org = (data ?? { marketplace_enabled: false, marketplace_take_rate_bps: 0 }) as Org;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.marketplace.settings.eyebrow", undefined, "Marketplace")}
        title={t("console.marketplace.settings.title", undefined, "Settings")}
        subtitle={t(
          "console.marketplace.settings.subtitle",
          undefined,
          "Take rate and visibility for marketplace transactions.",
        )}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={updateMarketplaceSettingsAction}
          submitLabel={t("console.marketplace.settings.submitLabel", undefined, "Save Settings")}
        >
          <fieldset className="surface-inset flex flex-col gap-2 p-3">
            <legend className="text-xs font-medium tracking-wide uppercase">
              {t("console.marketplace.settings.visibilityLegend", undefined, "Visibility")}
            </legend>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="marketplace_enabled" defaultChecked={org.marketplace_enabled} />
              {t(
                "console.marketplace.settings.enableLabel",
                undefined,
                "Enable public marketplace surfaces for this org",
              )}
            </label>
            <p className="text-xs text-[var(--text-secondary)]">
              {t(
                "console.marketplace.settings.enableHintPrefix",
                undefined,
                "When enabled, your published postings, calls, talent, and RFQs appear under",
              )}{" "}
              <span className="font-mono">/marketplace/*</span>.
            </p>
          </fieldset>

          <Input
            label={t("console.marketplace.settings.takeRateLabel", undefined, "Take Rate (bps)")}
            name="marketplace_take_rate_bps"
            type="number"
            min={0}
            max={5000}
            defaultValue={String(org.marketplace_take_rate_bps)}
          />
          <p className="text-xs text-[var(--text-secondary)]">
            {t(
              "console.marketplace.settings.takeRateHint",
              undefined,
              "Basis points (1 bp = 0.01%). 0 = no platform fee. Max 5000 (50%).",
            )}
          </p>
        </FormShell>
      </div>
    </>
  );
}
