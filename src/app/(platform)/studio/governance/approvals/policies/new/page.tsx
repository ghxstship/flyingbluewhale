import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createPolicy } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.governance.approvals.policies.new.eyebrow", undefined, "Approval Policy")}
        title={t("console.governance.approvals.policies.new.title", undefined, "New Policy")}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createPolicy}
          cancelHref="/studio/governance/approvals/policies"
          submitLabel={t("common.create", undefined, "Create")}
        >
          <Input
            label={t("console.governance.approvals.policies.new.nameLabel", undefined, "Name")}
            name="name"
            required
            maxLength={200}
            placeholder="Expense over $5k"
          />
          <Input
            label={t("console.governance.approvals.policies.new.slugLabel", undefined, "Slug")}
            name="slug"
            required
            maxLength={64}
            placeholder="expense-over-5k"
            hint={t(
              "console.governance.approvals.policies.new.slugHint",
              undefined,
              "Short identifier. Lowercase, dashes ok.",
            )}
          />
          <Input
            label={t("console.governance.approvals.policies.new.appliesToLabel", undefined, "Applies to")}
            name="applies_to"
            required
            maxLength={120}
            placeholder="expenses"
            hint={t(
              "console.governance.approvals.policies.new.appliesToHint",
              undefined,
              "The subject kind / table this policy routes (e.g. expenses, purchase_orders).",
            )}
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.governance.approvals.policies.new.descriptionLabel", undefined, "Description")}
            </label>
            <textarea name="description" rows={3} maxLength={1000} className="ps-input mt-1.5 w-full" />
          </div>
        </FormShell>
      </div>
    </>
  );
}
