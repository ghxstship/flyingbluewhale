import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createCampaign } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.campaigns.new.eyebrow", undefined, "Workspace")}
        title={t("console.campaigns.new.title", undefined, "New Campaign")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createCampaign}
          cancelHref="/studio/campaigns"
          submitLabel={t("console.campaigns.new.submit", undefined, "Create Campaign")}
        >
          <Input
            label={t("console.campaigns.new.fields.name", undefined, "Name")}
            name="name"
            maxLength={200}
            placeholder={t("console.campaigns.new.placeholders.name", undefined, "Spring launch · 2026")}
            required
          />
          <div>
            <label htmlFor="description" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.campaigns.new.fields.description", undefined, "Description")}
            </label>
            <textarea id="description"
              name="description"
              rows={3}
              maxLength={2000}
              className="ps-input mt-1.5 w-full"
              placeholder={t(
                "console.campaigns.new.placeholders.description",
                undefined,
                "What this campaign is for; success metric.",
              )}
            />
          </div>
          <div>
            <label htmlFor="channel" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.campaigns.new.fields.channel", undefined, "Channel")}
            </label>
            <select id="channel" name="channel" defaultValue="multi" className="ps-input mt-1.5 w-full">
              <option value="email">{t("console.campaigns.new.channel.email", undefined, "Email")}</option>
              <option value="social">{t("console.campaigns.new.channel.social", undefined, "Social")}</option>
              <option value="paid">{t("console.campaigns.new.channel.paid", undefined, "Paid")}</option>
              <option value="owned">{t("console.campaigns.new.channel.owned", undefined, "Owned")}</option>
              <option value="earned">{t("console.campaigns.new.channel.earned", undefined, "Earned")}</option>
              <option value="multi">{t("console.campaigns.new.channel.multi", undefined, "Multi-channel")}</option>
            </select>
          </div>
          <div>
            <label htmlFor="kind" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.campaigns.new.fields.kind", undefined, "Kind")}
            </label>
            <select id="kind" name="kind" defaultValue="awareness" className="ps-input mt-1.5 w-full">
              <option value="awareness">{t("console.campaigns.new.kind.awareness", undefined, "Awareness")}</option>
              <option value="conversion">{t("console.campaigns.new.kind.conversion", undefined, "Conversion")}</option>
              <option value="loyalty">{t("console.campaigns.new.kind.loyalty", undefined, "Loyalty")}</option>
              <option value="recruitment">
                {t("console.campaigns.new.kind.recruitment", undefined, "Recruitment")}
              </option>
              <option value="launch">{t("console.campaigns.new.kind.launch", undefined, "Launch")}</option>
            </select>
          </div>
          <Input
            label={t("console.campaigns.new.fields.startsOn", undefined, "Starts On")}
            name="starts_on"
            type="date"
          />
          <Input label={t("console.campaigns.new.fields.endsOn", undefined, "Ends On")} name="ends_on" type="date" />
          <Input
            label={t("console.campaigns.new.fields.budgetCents", undefined, "Budget (Cents)")}
            name="budget_cents"
            type="number"
            min={0}
            step={1}
            defaultValue={0}
            placeholder={t("console.campaigns.new.placeholders.budgetCents", undefined, "500000 = $5,000")}
          />
        </FormShell>
      </div>
    </>
  );
}
