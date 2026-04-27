import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
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
  const action = updateMajorIncident.bind(null, p.eventId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow="Major incident"
        title={`Edit ${((row as Record<string, unknown>)["name"] as string | undefined) ?? "Major incident"}`}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/safety/major-incident/${p.eventId}`}
          submitLabel="Save changes"
        >
          <Input label="Name" name="name" defaultValue={row.name ?? ""} required maxLength={200} />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Status</span>
            <select name="status" defaultValue={row.status ?? ""} required className="input-base focus-ring w-full">
              <option value="active">active</option>
              <option value="contained">contained</option>
              <option value="stood_down">stood_down</option>
              <option value="closed">closed</option>
            </select>
          </label>
          <Input
            label="Opened at"
            name="opened_at"
            type="datetime-local"
            defaultValue={dateTimeLocal(row.opened_at)}
            required
          />
          <Input label="Closed at" name="closed_at" type="datetime-local" defaultValue={dateTimeLocal(row.closed_at)} />
        </FormShell>
      </div>
    </>
  );
}
