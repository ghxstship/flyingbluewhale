import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updatePolicy, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ policyId: string }> }) {
  const { policyId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("insurance_policies", session.orgId, policyId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  const action = updatePolicy.bind(null, policyId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader eyebrow="Legal · Insurance" title={`Edit ${(r.policy_no as string | undefined) ?? "Policy"}`} />
      <div className="page-content max-w-xl">
        <FormShell action={action} cancelHref={`/console/legal/insurance/${policyId}`} submitLabel="Save Changes">
          <Input
            label="Carrier"
            name="carrier"
            maxLength={160}
            defaultValue={(r.carrier as string | undefined) ?? ""}
            required
          />
          <Input
            label="Policy Number"
            name="policy_no"
            maxLength={120}
            defaultValue={(r.policy_no as string | undefined) ?? ""}
            required
          />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Kind</label>
            <select
              name="kind"
              defaultValue={(r.kind as string | undefined) ?? "general_liability"}
              className="input-base mt-1.5 w-full"
              required
            >
              <option value="general_liability">General Liability</option>
              <option value="motor">Motor</option>
              <option value="professional_indemnity">Professional Indemnity</option>
              <option value="event_cancellation">Event Cancellation</option>
              <option value="workers_compensation">Workers Compensation</option>
              <option value="property">Property</option>
              <option value="other">Other</option>
            </select>
          </div>
          <Input label="Effective On" name="effective_on" type="date" defaultValue={dateOnly(r.effective_on)} />
          <Input label="Expires On" name="expires_on" type="date" defaultValue={dateOnly(r.expires_on)} />
        </FormShell>
      </div>
    </>
  );
}

function dateOnly(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 10);
}
