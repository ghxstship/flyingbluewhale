import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { createCostCode } from "./actions";

const INPUT = "w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--text-secondary)]";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Finance" title="New cost code" />
      <div className="page-content max-w-md">
        <FormShell action={createCostCode} cancelHref="/console/finance/cost-codes" submitLabel="Create">
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              Code<span className="ms-0.5 text-[var(--color-error)]">*</span>
            </span>
            <input name="code" required placeholder="02-100" className={INPUT} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              Name<span className="ms-0.5 text-[var(--color-error)]">*</span>
            </span>
            <input name="name" required placeholder="Site Prep" className={INPUT} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>Description</span>
            <textarea name="description" rows={3} className={INPUT} />
          </label>
        </FormShell>
      </div>
    </>
  );
}
