import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createSubscriptionAction } from "../actions";
import { SUBSCRIPTION_KINDS } from "@/lib/subscriptions";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function NewSubscriptionPage() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.subscriptions.new.eyebrow", undefined, "Subscriptions")}
        title={t("console.subscriptions.new.title", undefined, "New Subscription")}
        subtitle={t("console.subscriptions.new.subtitle", undefined, "Recurring member, retainer, or sponsor.")}
      />
      <div className="page-content">
        <FormShell action={createSubscriptionAction}>
          <div className="grid max-w-xl gap-4">
            <label className="block">
              <span className="text-sm font-medium">
                {t("console.subscriptions.new.labelField", undefined, "Label")}
              </span>
              <Input
                name="label"
                required
                placeholder={t(
                  "console.subscriptions.new.labelPlaceholder",
                  undefined,
                  "e.g. HVRBOR Founding Member 2026",
                )}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">{t("console.subscriptions.new.kind", undefined, "Kind")}</span>
              <select name="kind" required className="input w-full">
                {SUBSCRIPTION_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">
                {t("console.subscriptions.new.party", undefined, "Party (Optional UUID)")}
              </span>
              <Input
                name="party_id"
                placeholder={t(
                  "console.subscriptions.new.partyPlaceholder",
                  undefined,
                  "UUID of the subscriber user/party",
                )}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">
                {t("console.subscriptions.new.renewalCadence", undefined, "Renewal Cadence (Months)")}
              </span>
              <Input
                name="renewal_cadence_months"
                type="number"
                min={1}
                max={120}
                placeholder={t("console.subscriptions.new.renewalCadencePlaceholder", undefined, "e.g. 12")}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">
                {t("console.subscriptions.new.trialDays", undefined, "Trial Days · Optional · Starts as TRIAL Status")}
              </span>
              <Input
                name="trial_days"
                type="number"
                min={0}
                max={365}
                placeholder={t("console.subscriptions.new.trialDaysPlaceholder", undefined, "e.g. 14")}
              />
            </label>
            <div className="flex gap-2">
              <Button type="submit">{t("console.subscriptions.new.submit", undefined, "Create Subscription")}</Button>
              <Button href="/studio/subscriptions" variant="secondary">
                {t("common.cancel", undefined, "Cancel")}
              </Button>
            </div>
          </div>
        </FormShell>
      </div>
    </>
  );
}
