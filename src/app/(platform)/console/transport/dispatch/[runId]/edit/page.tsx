import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateDispatchRun, type State } from "./actions";

export const dynamic = "force-dynamic";

function dateTimeLocal(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 16);
}

export default async function Page({ params }: { params: Promise<{ runId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("dispatch_runs", session.orgId, p.runId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  void r;
  const action = updateDispatchRun.bind(null, p.runId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow="Dispatch run"
        title={`Edit ${((row as Record<string, unknown>)["vehicle_ref"] as string | undefined) ?? "Dispatch run"}`}
      />
      <div className="page-content max-w-xl">
        <FormShell action={action} cancelHref={`/console/transport/dispatch/${p.runId}`} submitLabel="Save changes">
          <Input label="Vehicle reference" name="vehicle_ref" defaultValue={row.vehicle_ref ?? ""} maxLength={80} />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Fleet</span>
            <select name="fleet" defaultValue={row.fleet ?? ""} required className="input-base focus-ring w-full">
              <option value="t1">t1</option>
              <option value="t2">t2</option>
              <option value="t3">t3</option>
              <option value="media">media</option>
              <option value="workforce">workforce</option>
              <option value="spectator">spectator</option>
            </select>
          </label>
          <Input
            label="Scheduled departure"
            name="scheduled_depart"
            type="datetime-local"
            defaultValue={dateTimeLocal(row.scheduled_depart)}
            required
          />
          <Input
            label="Scheduled arrival"
            name="scheduled_arrive"
            type="datetime-local"
            defaultValue={dateTimeLocal(row.scheduled_arrive)}
          />
          <Input
            label="Actual departure"
            name="actual_depart"
            type="datetime-local"
            defaultValue={dateTimeLocal(row.actual_depart)}
          />
          <Input
            label="Actual arrival"
            name="actual_arrive"
            type="datetime-local"
            defaultValue={dateTimeLocal(row.actual_arrive)}
          />
        </FormShell>
      </div>
    </>
  );
}
