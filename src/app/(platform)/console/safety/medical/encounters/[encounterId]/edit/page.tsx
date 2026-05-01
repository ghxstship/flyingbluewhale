import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateEncounter, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ encounterId: string }> }) {
  const { encounterId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("medical_encounters", session.orgId, encounterId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  const action = updateEncounter.bind(null, encounterId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader eyebrow="Medical · Encounter" title="Edit Encounter" />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/safety/medical/encounters/${encounterId}`}
          submitLabel="Save Changes"
        >
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Triage</label>
            <select
              name="triage"
              defaultValue={(r.triage as string | undefined) ?? "green"}
              className="input-base mt-1.5 w-full"
            >
              <option value="green">Green (minor)</option>
              <option value="yellow">Yellow (urgent)</option>
              <option value="red">Red (immediate)</option>
              <option value="black">Black (deceased)</option>
            </select>
          </div>
          <Input
            label="Patient Reference"
            name="patient_ref"
            maxLength={120}
            defaultValue={(r.patient_ref as string | undefined) ?? ""}
          />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Chief Complaint</label>
            <textarea
              name="chief_complaint"
              rows={3}
              maxLength={500}
              className="input-base mt-1.5 w-full"
              defaultValue={(r.chief_complaint as string | undefined) ?? ""}
            />
          </div>
          <Input
            label="Disposition"
            name="disposition"
            maxLength={120}
            defaultValue={(r.disposition as string | undefined) ?? ""}
          />
        </FormShell>
      </div>
    </>
  );
}
