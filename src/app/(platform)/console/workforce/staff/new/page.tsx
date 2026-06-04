import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createStaff } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.staff.new.eyebrow", undefined, "Workforce · Staff")}
        title={t("console.workforce.staff.new.title", undefined, "New Staff Member")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createStaff}
          cancelHref="/console/workforce/staff"
          submitLabel={t("console.workforce.staff.new.submit", undefined, "Add Staff")}
        >
          <Input
            label={t("console.workforce.staff.new.fullName", undefined, "Full Name")}
            name="full_name"
            maxLength={200}
            required
          />
          <Input label={t("console.workforce.staff.new.email", undefined, "Email")} name="email" type="email" />
          <Input label={t("console.workforce.staff.new.phone", undefined, "Phone")} name="phone" maxLength={40} />
          <Input
            label={t("console.workforce.staff.new.role", undefined, "Role")}
            name="role"
            maxLength={120}
            placeholder={t(
              "console.workforce.staff.new.rolePlaceholder",
              undefined,
              "e.g. Production Manager, Steward Lead",
            )}
          />
        </FormShell>
      </div>
    </>
  );
}
