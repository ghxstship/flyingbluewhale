import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateIncident, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ incidentId: string }> }) {
  const { incidentId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("incidents", session.orgId, incidentId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  const action = updateIncident.bind(null, incidentId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader eyebrow="Operations · Incident" title="Edit Incident" />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/operations/incidents/${incidentId}`}
          submitLabel="Save changes"
        >
          <Input
            label="Summary"
            name="summary"
            maxLength={500}
            defaultValue={(r.summary as string | undefined) ?? ""}
            required
          />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Description</label>
            <textarea
              name="description"
              rows={4}
              maxLength={5000}
              className="input-base mt-1.5 w-full"
              defaultValue={(r.description as string | undefined) ?? ""}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Severity</label>
            <select
              name="severity"
              defaultValue={(r.severity as string | undefined) ?? "minor"}
              className="input-base mt-1.5 w-full"
              required
            >
              <option value="near_miss">Near miss</option>
              <option value="minor">Minor</option>
              <option value="major">Major</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Status</label>
            <select
              name="status"
              defaultValue={(r.status as string | undefined) ?? "open"}
              className="input-base mt-1.5 w-full"
              required
            >
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <Input
            label="Location"
            name="location"
            maxLength={200}
            defaultValue={(r.location as string | undefined) ?? ""}
          />
          <Input
            label="Occurred At"
            name="occurred_at"
            type="datetime-local"
            defaultValue={dateTimeLocal(r.occurred_at)}
          />
        </FormShell>
      </div>
    </>
  );
}

function dateTimeLocal(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 16);
}
