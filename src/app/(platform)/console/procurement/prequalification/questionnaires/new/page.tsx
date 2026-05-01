import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { createQuestionnaire } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--text-secondary)]";

export default function Page() {
  return (
    <>
      <ModuleHeader
        eyebrow="Procurement"
        breadcrumbs={[
          { label: "Prequalification", href: "/console/procurement/prequalification" },
          { label: "Questionnaires", href: "/console/procurement/prequalification/questionnaires" },
          { label: "New" },
        ]}
        title="New Questionnaire"
        subtitle="Define the questions vendors must answer to be approved. Add questions on the detail page."
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createQuestionnaire}
          cancelHref="/console/procurement/prequalification/questionnaires"
          submitLabel="Create"
        >
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                Code<span className="ms-0.5 text-[var(--color-error)]">*</span>
              </span>
              <input name="code" required placeholder="GENERAL-2026" className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                Name<span className="ms-0.5 text-[var(--color-error)]">*</span>
              </span>
              <input name="name" required placeholder="General trades — annual prequal" className={INPUT} />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>Description</span>
            <textarea name="description" rows={3} className={INPUT} />
          </label>
        </FormShell>
      </div>
    </>
  );
}
