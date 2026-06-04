import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createVolunteer } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.volunteers.new.eyebrow", undefined, "Workforce · Volunteers")}
        title={t("console.workforce.volunteers.new.title", undefined, "New Volunteer")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createVolunteer}
          cancelHref="/console/workforce/volunteers"
          submitLabel={t("console.workforce.volunteers.new.submit", undefined, "Add Volunteer")}
        >
          <Input
            label={t("console.workforce.volunteers.new.fullName", undefined, "Full Name")}
            name="full_name"
            maxLength={200}
            required
          />
          <Input label={t("console.workforce.volunteers.new.email", undefined, "Email")} name="email" type="email" />
          <Input label={t("console.workforce.volunteers.new.phone", undefined, "Phone")} name="phone" maxLength={40} />
          <Input
            label={t("console.workforce.volunteers.new.role", undefined, "Role")}
            name="role"
            maxLength={120}
            placeholder={t("console.workforce.volunteers.new.rolePlaceholder", undefined, "e.g. Wayfinding, Transport")}
          />
        </FormShell>
      </div>
    </>
  );
}
