import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createCredential } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.people.credentials.new.eyebrow", undefined, "People · Credentials")}
        title={t("console.people.credentials.new.title", undefined, "New Credential")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createCredential}
          cancelHref="/studio/people/credentials"
          submitLabel={t("console.people.credentials.new.submit", undefined, "Add Credential")}
        >
          <Input
            label={t("console.people.credentials.new.kindLabel", undefined, "Kind")}
            name="kind"
            maxLength={80}
            placeholder={t(
              "console.people.credentials.new.kindPlaceholder",
              undefined,
              "e.g. First-aid, Working at height, SIA",
            )}
            required
          />
          <Input
            label={t("console.people.credentials.new.numberLabel", undefined, "Number")}
            name="number"
            maxLength={120}
            placeholder={t("console.people.credentials.new.numberPlaceholder", undefined, "Reference / serial")}
          />
          <Input
            label={t("console.people.credentials.new.issuedOnLabel", undefined, "Issued On")}
            name="issued_on"
            type="date"
          />
          <Input
            label={t("console.people.credentials.new.expiresOnLabel", undefined, "Expires On")}
            name="expires_on"
            type="date"
          />
        </FormShell>
      </div>
    </>
  );
}
