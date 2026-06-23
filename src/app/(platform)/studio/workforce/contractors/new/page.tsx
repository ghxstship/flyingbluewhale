import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createContractor } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.contractors.new.eyebrow", undefined, "Workforce · Contractors")}
        title={t("console.workforce.contractors.new.title", undefined, "New Contractor")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createContractor}
          cancelHref="/studio/workforce/contractors"
          submitLabel={t("console.workforce.contractors.new.submit", undefined, "Add Contractor")}
        >
          <Input
            label={t("console.workforce.contractors.new.fullName", undefined, "Full Name")}
            name="full_name"
            maxLength={200}
            required
          />
          <Input label={t("console.workforce.contractors.new.email", undefined, "Email")} name="email" type="email" />
          <Input label={t("console.workforce.contractors.new.phone", undefined, "Phone")} name="phone" maxLength={40} />
          <Input
            label={t("console.workforce.contractors.new.role", undefined, "Role")}
            name="role"
            maxLength={120}
            placeholder={t("console.workforce.contractors.new.rolePlaceholder", undefined, "e.g. AV Engineer, Rigger")}
          />
        </FormShell>
      </div>
    </>
  );
}
