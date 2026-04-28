import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateAlert, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ alertId: string }> }) {
  const { alertId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("crisis_alerts", session.orgId, alertId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  const action = updateAlert.bind(null, alertId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader eyebrow="Safety · Crisis" title="Edit Alert" />
      <div className="page-content max-w-xl">
        <FormShell action={action} cancelHref={`/console/safety/crisis/${alertId}`} submitLabel="Save changes">
          <Input
            label="Title"
            name="title"
            maxLength={200}
            defaultValue={(r.title as string | undefined) ?? ""}
            required
          />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Body</label>
            <textarea
              name="body"
              rows={5}
              maxLength={5000}
              className="input-base mt-1.5 w-full"
              defaultValue={(r.body as string | undefined) ?? ""}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Severity</label>
            <select
              name="severity"
              defaultValue={(r.severity as string | undefined) ?? "info"}
              className="input-base mt-1.5 w-full"
            >
              <option value="info">Info</option>
              <option value="advisory">Advisory</option>
              <option value="warning">Warning</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>
          <Input
            label="Scheduled At"
            name="scheduled_at"
            type="datetime-local"
            defaultValue={dateTimeLocal(r.scheduled_at)}
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
