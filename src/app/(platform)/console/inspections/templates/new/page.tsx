import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createInspectionTemplateAction } from "./actions";

const CATEGORIES = [
  ["rigging", "Rigging", "console.inspections.templates.new.category.rigging"],
  ["fire", "Fire", "console.inspections.templates.new.category.fire"],
  ["electrical", "Electrical", "console.inspections.templates.new.category.electrical"],
  ["ada", "ADA", "console.inspections.templates.new.category.ada"],
  ["food_safety", "Food safety", "console.inspections.templates.new.category.foodSafety"],
  ["security", "Security", "console.inspections.templates.new.category.security"],
  ["foh", "FOH", "console.inspections.templates.new.category.foh"],
  ["medical", "Medical", "console.inspections.templates.new.category.medical"],
  ["sustainability", "Sustainability", "console.inspections.templates.new.category.sustainability"],
  ["custom", "Custom", "console.inspections.templates.new.category.custom"],
] as const;

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.inspections.templates.new.eyebrow", undefined, "Safety")}
        title={t("console.inspections.templates.new.title", undefined, "New Inspection Template")}
        subtitle={t(
          "console.inspections.templates.new.subtitle",
          undefined,
          "Reusable checklist that powers scheduled inspections.",
        )}
        breadcrumbs={[
          {
            label: t("console.inspections.templates.new.breadcrumb.inspections", undefined, "Inspections"),
            href: "/console/inspections",
          },
          {
            label: t("console.inspections.templates.new.breadcrumb.templates", undefined, "Templates"),
            href: "/console/inspections/templates",
          },
          { label: t("console.inspections.templates.new.breadcrumb.new", undefined, "New") },
        ]}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createInspectionTemplateAction}
          cancelHref="/console/inspections/templates"
          submitLabel={t("console.inspections.templates.new.submit", undefined, "Create Template")}
          dirtyGuard
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label={t("console.inspections.templates.new.code.label", undefined, "Code")}
              name="code"
              required
              maxLength={40}
              placeholder="RIG-PRE"
              hint={t(
                "console.inspections.templates.new.code.hint",
                undefined,
                "Short slug — uppercase, dashes ok. Used on inspection records.",
              )}
              style={{ textTransform: "uppercase" }}
            />
            <div>
              <label className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.inspections.templates.new.category.label", undefined, "Category")}{" "}
                <span className="text-[var(--p-danger)]">*</span>
              </label>
              <select name="category" required defaultValue="custom" className="ps-input mt-1.5 w-full">
                {CATEGORIES.map(([v, l, key]) => (
                  <option key={v} value={v}>
                    {t(key, undefined, l)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label={t("console.inspections.templates.new.name.label", undefined, "Name")}
            name="name"
            required
            maxLength={200}
            placeholder={t("console.inspections.templates.new.name.placeholder", undefined, "Pre-show rigging walk")}
          />

          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.inspections.templates.new.description.label", undefined, "Description")}
            </label>
            <textarea
              name="description"
              rows={3}
              maxLength={2000}
              className="ps-input mt-1.5 w-full"
              placeholder={t(
                "console.inspections.templates.new.description.placeholder",
                undefined,
                "When to run, who runs it, what passing means.",
              )}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.inspections.templates.new.items.label", undefined, "Checklist items")}
            </label>
            <textarea
              name="items"
              rows={10}
              maxLength={20000}
              className="ps-input mt-1.5 w-full font-mono text-xs"
              placeholder={t(
                "console.inspections.templates.new.items.placeholder",
                undefined,
                `One prompt per line, e.g.\nGround support legs plumb\nMotor chains free of obstructions\nLoad cells calibrated within 30 days`,
              )}
            />
            <p className="mt-1 text-[11px] text-[var(--p-text-2)]">
              {t(
                "console.inspections.templates.new.items.hint",
                undefined,
                "Each line becomes a checklist item. Up to 200 items. Per-item options (photo required, etc.) editable after creation.",
              )}
            </p>
          </div>
        </FormShell>
      </div>
    </>
  );
}
