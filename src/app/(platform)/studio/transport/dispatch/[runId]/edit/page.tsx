import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
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
  const { t } = await getRequestT();
  const action = updateDispatchRun.bind(null, p.runId) as unknown as (state: State, fd: FormData) => Promise<State>;
  const vehicleRef = (row as Record<string, unknown>)["vehicle_ref"] as string | undefined;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.transport.dispatch.edit.eyebrow", undefined, "Dispatch Run")}
        title={
          vehicleRef
            ? t("console.transport.dispatch.edit.titleNamed", { name: vehicleRef }, `Edit ${vehicleRef}`)
            : t("console.transport.dispatch.edit.titleFallback", undefined, "Edit Dispatch run")
        }
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/studio/transport/dispatch/${p.runId}`}
          submitLabel={t("common.saveChanges", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.transport.dispatch.edit.vehicleRefLabel", undefined, "Vehicle Reference")}
            name="vehicle_ref"
            defaultValue={row.vehicle_ref ?? ""}
            maxLength={80}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.transport.dispatch.edit.fleetLabel", undefined, "Fleet")}
            </span>
            <select name="fleet" defaultValue={row.fleet ?? ""} required className="ps-input focus-ring w-full">
              <option value="t1">t1</option>
              <option value="t2">t2</option>
              <option value="t3">t3</option>
              <option value="media">media</option>
              <option value="workforce">workforce</option>
              <option value="spectator">spectator</option>
            </select>
          </label>
          <Input
            label={t("console.transport.dispatch.edit.scheduledDepartLabel", undefined, "Scheduled Departure")}
            name="scheduled_depart"
            type="datetime-local"
            defaultValue={dateTimeLocal(row.scheduled_depart)}
            required
          />
          <Input
            label={t("console.transport.dispatch.edit.scheduledArriveLabel", undefined, "Scheduled Arrival")}
            name="scheduled_arrive"
            type="datetime-local"
            defaultValue={dateTimeLocal(row.scheduled_arrive)}
          />
          <Input
            label={t("console.transport.dispatch.edit.actualDepartLabel", undefined, "Actual Departure")}
            name="actual_depart"
            type="datetime-local"
            defaultValue={dateTimeLocal(row.actual_depart)}
          />
          <Input
            label={t("console.transport.dispatch.edit.actualArriveLabel", undefined, "Actual Arrival")}
            name="actual_arrive"
            type="datetime-local"
            defaultValue={dateTimeLocal(row.actual_arrive)}
          />
        </FormShell>
      </div>
    </>
  );
}
