import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { addApplicantAction } from "./actions";

export default async function Page({ params }: { params: Promise<{ positionId: string }> }) {
  const { positionId } = await params;
  return (
    <>
      <ModuleHeader eyebrow="Hiring" title="Add Applicant" />
      <div className="page-content max-w-2xl">
        <FormShell
          action={addApplicantAction.bind(null, positionId)}
          cancelHref={`/console/workforce/hiring/${positionId}`}
          submitLabel="Add Applicant"
        >
          <Input label="Full name" name="full_name" required maxLength={160} />
          <Input label="Email" name="email" type="email" maxLength={254} />
          <Input label="Phone" name="phone" type="tel" maxLength={40} />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Notes</label>
            <textarea name="notes" rows={3} maxLength={4000} className="input-base mt-1.5 w-full" />
          </div>
        </FormShell>
      </div>
    </>
  );
}
