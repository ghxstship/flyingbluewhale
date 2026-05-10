import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { updateMarketplaceSettingsAction } from "./actions";

export const dynamic = "force-dynamic";

type Org = {
  marketplace_enabled: boolean;
  marketplace_take_rate_bps: number;
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Marketplace" title="Settings" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
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
        eyebrow="Marketplace"
        title="Settings"
        subtitle="Take rate and visibility for marketplace transactions."
      />
      <div className="page-content max-w-xl">
        <FormShell action={updateMarketplaceSettingsAction} submitLabel="Save Settings">
          <fieldset className="surface-inset flex flex-col gap-2 p-3">
            <legend className="text-xs font-medium tracking-wide uppercase">Visibility</legend>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="marketplace_enabled" defaultChecked={org.marketplace_enabled} />
              Enable public marketplace surfaces for this org
            </label>
            <p className="text-xs text-[var(--text-secondary)]">
              When enabled, your published postings, calls, talent, and RFQs appear under{" "}
              <span className="font-mono">/marketplace/*</span>.
            </p>
          </fieldset>

          <Input
            label="Take Rate (bps)"
            name="marketplace_take_rate_bps"
            type="number"
            min={0}
            max={5000}
            defaultValue={String(org.marketplace_take_rate_bps)}
          />
          <p className="text-xs text-[var(--text-secondary)]">
            Basis points (1 bp = 0.01%). 0 = no platform fee. Max 5000 (50%).
          </p>
        </FormShell>
      </div>
    </>
  );
}
