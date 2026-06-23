import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateMajorIncident, type State } from "./actions";

export const dynamic = "force-dynamic";

function dateTimeLocal(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 16);
}

export default async function Page({ params }: { params: Promise<{ eventId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("major_incidents", session.orgId, p.eventId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  void r;
  const { t } = await getRequestT();
  const action = updateMajorIncident.bind(null, p.eventId) as unknown as (state: State, fd: FormData) => Promise<State>;
  const fallbackName = t("console.safety.majorIncident.edit.fallbackName", undefined, "Major incident");
  const incidentName = ((row as Record<string, unknown>)["name"] as string | undefined) ?? fallbackName;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.safety.majorIncident.edit.eyebrow", undefined, "Major Incident")}
        title={t("console.safety.majorIncident.edit.title", { name: incidentName }, `Edit ${incidentName}`)}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/studio/safety/major-incident/${p.eventId}`}
          submitLabel={t("common.saveChanges", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.safety.majorIncident.edit.nameLabel", undefined, "Name")}
            name="name"
            defaultValue={row.name ?? ""}
            required
            maxLength={200}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.safety.majorIncident.edit.statusLabel", undefined, "Status")}
            </span>
            <select
              name="incident_state"
              defaultValue={row.incident_state ?? ""}
              required
              className="ps-input focus-ring w-full"
            >
              <option value="active">active</option>
              <option value="contained">contained</option>
              <option value="stood_down">stood_down</option>
              <option value="closed">closed</option>
            </select>
          </label>
          <Input
            label={t("console.safety.majorIncident.edit.openedAtLabel", undefined, "Opened At")}
            name="opened_at"
            type="datetime-local"
            defaultValue={dateTimeLocal(row.opened_at)}
            required
          />
          <Input
            label={t("console.safety.majorIncident.edit.closedAtLabel", undefined, "Closed At")}
            name="closed_at"
            type="datetime-local"
            defaultValue={dateTimeLocal(row.closed_at)}
          />
        </FormShell>
      </div>
    </>
  );
}
