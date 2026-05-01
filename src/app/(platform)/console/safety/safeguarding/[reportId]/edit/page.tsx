import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateSafeguardingReport, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ reportId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("safeguarding_reports", session.orgId, p.reportId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  void r;
  const action = updateSafeguardingReport.bind(null, p.reportId) as unknown as (
    state: State,
    fd: FormData,
  ) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow="Safeguarding Report"
        title={`Edit ${((row as Record<string, unknown>)["subject_ref"] as string | undefined) ?? "Safeguarding report"}`}
      />
      <div className="page-content max-w-xl">
        <FormShell action={action} cancelHref={`/console/safety/safeguarding/${p.reportId}`} submitLabel="Save Changes">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Narrative</span>
            <textarea
              name="narrative"
              defaultValue={row.narrative ?? ""}
              rows={8}
              required
              className="input-base focus-ring w-full"
            />
          </label>
          <Input label="Subject Reference" name="subject_ref" defaultValue={row.subject_ref ?? ""} maxLength={200} />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Status</span>
            <select name="status" defaultValue={row.status ?? ""} required className="input-base focus-ring w-full">
              <option value="new">new</option>
              <option value="triage">triage</option>
              <option value="investigating">investigating</option>
              <option value="referred">referred</option>
              <option value="closed">closed</option>
            </select>
          </label>
        </FormShell>
      </div>
    </>
  );
}
