import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateTimeEntry, type State } from "./actions";

export const dynamic = "force-dynamic";

function dateTimeLocal(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 16);
}

export default async function Page({ params }: { params: Promise<{ entryId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("time_entries", session.orgId, p.entryId);
  if (!row) notFound();
  const action = updateTimeEntry.bind(null, p.entryId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader eyebrow="Time Entry" title={`Edit ${row.description ?? "time entry"}`} />
      <div className="page-content max-w-xl">
        <FormShell action={action} cancelHref={`/console/finance/time/${p.entryId}`} submitLabel="Save Changes">
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input label="Description" name="description" defaultValue={row.description ?? ""} maxLength={500} />
          <Input
            label="Started At"
            name="started_at"
            type="datetime-local"
            defaultValue={dateTimeLocal(row.started_at)}
            required
          />
          <Input label="Ended At" name="ended_at" type="datetime-local" defaultValue={dateTimeLocal(row.ended_at)} />
          <Input
            label="Duration (minutes)"
            name="duration_minutes"
            type="number"
            defaultValue={row.duration_minutes != null ? String(row.duration_minutes) : ""}
          />
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="billable"
              defaultChecked={!!row.billable}
              className="rounded border-[var(--border-color)]"
            />
            <span>Billable</span>
          </label>
        </FormShell>
      </div>
    </>
  );
}
