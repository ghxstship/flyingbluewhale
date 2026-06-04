import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createDelegation } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.participants.delegations.new.eyebrow", undefined, "Participants · Delegations")}
        title={t("console.participants.delegations.new.title", undefined, "New Delegation")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createDelegation}
          cancelHref="/console/participants/delegations"
          submitLabel={t("console.participants.delegations.new.submit", undefined, "Add Delegation")}
        >
          <Input
            label={t("console.participants.delegations.new.fields.code", undefined, "Code")}
            name="code"
            maxLength={40}
            placeholder={t("console.participants.delegations.new.placeholders.code", undefined, "e.g. USA, GBR")}
            required
          />
          <Input
            label={t("console.participants.delegations.new.fields.name", undefined, "Name")}
            name="name"
            maxLength={160}
            placeholder={t(
              "console.participants.delegations.new.placeholders.name",
              undefined,
              "e.g. United States Olympic Team",
            )}
            required
          />
          <Input
            label={t("console.participants.delegations.new.fields.country", undefined, "Country")}
            name="country"
            maxLength={80}
            placeholder={t("console.participants.delegations.new.placeholders.country", undefined, "ISO-3166 name")}
          />
          <Input
            label={t("console.participants.delegations.new.fields.contactEmail", undefined, "Contact Email")}
            name="contact_email"
            type="email"
            placeholder={t(
              "console.participants.delegations.new.placeholders.contactEmail",
              undefined,
              "chef-de-mission@…",
            )}
          />
          <Input
            label={t("console.participants.delegations.new.fields.contactPhone", undefined, "Contact Phone")}
            name="contact_phone"
            maxLength={40}
          />
        </FormShell>
      </div>
    </>
  );
}
