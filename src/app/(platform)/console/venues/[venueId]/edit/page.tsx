import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateVenue, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ venueId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("venues", session.orgId, p.venueId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  void r;
  const action = updateVenue.bind(null, p.venueId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow="Venue"
        title={`Edit ${((row as Record<string, unknown>)["name"] as string | undefined) ?? "Venue"}`}
      />
      <div className="page-content max-w-xl">
        <FormShell action={action} cancelHref={`/console/venues/${p.venueId}`} submitLabel="Save Changes">
          <Input label="Name" name="name" defaultValue={row.name ?? ""} required maxLength={200} />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Kind</span>
            <select name="kind" defaultValue={row.kind ?? ""} required className="input-base focus-ring w-full">
              <option value="competition">competition</option>
              <option value="training">training</option>
              <option value="live_site">live_site</option>
              <option value="ibc">ibc</option>
              <option value="mpc">mpc</option>
              <option value="village">village</option>
              <option value="support">support</option>
            </select>
          </label>
          <Input label="Cluster" name="cluster" defaultValue={row.cluster ?? ""} maxLength={120} />
          <Input
            label="Capacity"
            name="capacity"
            type="number"
            defaultValue={row.capacity != null ? String(row.capacity) : ""}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Handover state</span>
            <select
              name="handover_state"
              defaultValue={row.handover_state ?? ""}
              required
              className="input-base focus-ring w-full"
            >
              <option value="not_started">not_started</option>
              <option value="inspection">inspection</option>
              <option value="snag">snag</option>
              <option value="sign_off">sign_off</option>
              <option value="accepted">accepted</option>
              <option value="closeout">closeout</option>
            </select>
          </label>
        </FormShell>
      </div>
    </>
  );
}
