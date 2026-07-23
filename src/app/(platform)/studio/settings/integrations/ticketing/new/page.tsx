import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { TICKETING_PROVIDERS } from "@/lib/marketplace";
import { getRequestT } from "@/lib/i18n/request";
import { createTicketingConnectionAction } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.settings.integrations.ticketing.new.eyebrow", undefined, "Settings")}
        title={t("console.settings.integrations.ticketing.new.title", undefined, "New Ticketing Connection")}
        subtitle={t("console.settings.integrations.ticketing.new.subtitle", undefined, "Connect a ticketing provider.")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createTicketingConnectionAction}
          cancelHref="/studio/settings/integrations/ticketing"
          submitLabel={t("console.settings.integrations.ticketing.new.submitLabel", undefined, "Connect")}
        >
          <div>
            <label htmlFor="provider" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.settings.integrations.ticketing.new.providerLabel", undefined, "Provider")}
            </label>
            <select id="provider" name="provider" className="ps-input mt-1.5 w-full" required>
              {TICKETING_PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <Input
            label={t(
              "console.settings.integrations.ticketing.new.externalEventIdLabel",
              undefined,
              "External Event ID · Optional",
            )}
            name="external_event_id"
            placeholder={t(
              "console.settings.integrations.ticketing.new.externalEventIdPlaceholder",
              undefined,
              "evt_xxx",
            )}
          />
          <Input
            label={t("console.settings.integrations.ticketing.new.labelFieldLabel", undefined, "Label")}
            name="label"
            placeholder={t(
              "console.settings.integrations.ticketing.new.labelFieldPlaceholder",
              undefined,
              "MMW26 mainstage on Etix",
            )}
          />
          <Input
            label={t("console.settings.integrations.ticketing.new.apiKeyLabel", undefined, "API Key (Encrypted)")}
            name="api_key"
            type="password"
            placeholder="••••"
          />
        </FormShell>
      </div>
    </>
  );
}
