import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createProblem } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.ops.toc.problems.new.eyebrow", undefined, "Operations")}
        title={t("console.ops.toc.problems.new.title", undefined, "New Problem Record")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createProblem}
          cancelHref="/studio/ops/toc/problems"
          submitLabel={t("console.ops.toc.problems.new.submit", undefined, "Create Problem")}
        >
          <Input
            label={t("console.ops.toc.problems.new.codeLabel", undefined, "Code")}
            name="code"
            required
            maxLength={40}
            placeholder="PRB-001"
          />
          <Input
            label={t("console.ops.toc.problems.new.titleLabel", undefined, "Title")}
            name="title"
            required
            maxLength={200}
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.ops.toc.problems.new.descriptionLabel", undefined, "Description")}
            </label>
            <textarea
              name="description"
              rows={3}
              maxLength={4000}
              className="ps-input mt-1.5 w-full"
              placeholder={t(
                "console.ops.toc.problems.new.descriptionPlaceholder",
                undefined,
                "The recurring symptom we're investigating.",
              )}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.ops.toc.problems.new.priorityLabel", undefined, "Priority")}
            </label>
            <select name="priority" defaultValue="P3" className="ps-input mt-1.5 w-full">
              <option value="P1">{t("console.ops.toc.problems.new.priorityP1", undefined, "P1 — Critical")}</option>
              <option value="P2">{t("console.ops.toc.problems.new.priorityP2", undefined, "P2 — High")}</option>
              <option value="P3">{t("console.ops.toc.problems.new.priorityP3", undefined, "P3 — Medium")}</option>
              <option value="P4">{t("console.ops.toc.problems.new.priorityP4", undefined, "P4 — Low")}</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.ops.toc.problems.new.workaroundLabel", undefined, "Workaround")}
            </label>
            <textarea
              name="workaround"
              rows={3}
              maxLength={4000}
              className="ps-input mt-1.5 w-full"
              placeholder={t(
                "console.ops.toc.problems.new.workaroundPlaceholder",
                undefined,
                "Temporary mitigation while root cause is investigated.",
              )}
            />
          </div>
        </FormShell>
      </div>
    </>
  );
}
