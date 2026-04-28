import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { createEntry } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const delegations = (await listOrgScoped("delegations", session.orgId, {
    orderBy: "name",
    ascending: true,
    limit: 500,
  })) as Array<{ id: string; name: string; code: string | null }>;

  if (delegations.length === 0) {
    return (
      <>
        <ModuleHeader eyebrow="Participants · Entries" title="New Entry" />
        <div className="page-content max-w-xl">
          <div className="surface space-y-3 p-6 text-sm">
            <p>You need at least one delegation before you can add an entry.</p>
            <Button href="/console/participants/delegations/new" size="sm">
              + Create delegation
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ModuleHeader eyebrow="Participants · Entries" title="New Entry" />
      <div className="page-content max-w-xl">
        <FormShell action={createEntry} cancelHref="/console/participants/entries" submitLabel="Add entry">
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Delegation</label>
            <select name="delegation_id" className="input-base mt-1.5 w-full" required>
              {delegations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code ? `${d.code} — ${d.name}` : d.name}
                </option>
              ))}
            </select>
          </div>
          <Input label="Participant Name" name="participant_name" maxLength={200} required />
          <Input label="Discipline" name="discipline" maxLength={120} placeholder="e.g. Athletics, Swimming" />
          <Input label="Event" name="event" maxLength={120} placeholder="e.g. 100m freestyle" />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Status</label>
            <select name="status" defaultValue="nominated" className="input-base mt-1.5 w-full">
              <option value="nominated">Nominated</option>
              <option value="confirmed">Confirmed</option>
              <option value="on_site">On site</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>
        </FormShell>
      </div>
    </>
  );
}
