import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateEnvEvent, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("environmental_events", session.orgId, eventId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  const action = updateEnvEvent.bind(null, eventId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader eyebrow="Safety · Environmental" title="Edit Event" />
      <div className="page-content max-w-xl">
        <FormShell action={action} cancelHref={`/console/safety/environmental/${eventId}`} submitLabel="Save changes">
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Kind</label>
            <select
              name="kind"
              defaultValue={(r.kind as string | undefined) ?? "heat"}
              className="input-base mt-1.5 w-full"
              required
            >
              <option value="heat">Heat</option>
              <option value="cold">Cold</option>
              <option value="wind">Wind</option>
              <option value="storm">Storm</option>
              <option value="lightning">Lightning</option>
              <option value="air_quality">Air quality</option>
              <option value="wildlife">Wildlife</option>
              <option value="biohazard">Biohazard</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Severity</label>
            <select
              name="severity"
              defaultValue={(r.severity as string | undefined) ?? "advisory"}
              className="input-base mt-1.5 w-full"
              required
            >
              <option value="advisory">Advisory</option>
              <option value="watch">Watch</option>
              <option value="warning">Warning</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>
          <Input
            label="Started At"
            name="started_at"
            type="datetime-local"
            defaultValue={dateTimeLocal(r.started_at)}
          />
          <Input label="Ended At" name="ended_at" type="datetime-local" defaultValue={dateTimeLocal(r.ended_at)} />
        </FormShell>
      </div>
    </>
  );
}

function dateTimeLocal(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 16);
}
