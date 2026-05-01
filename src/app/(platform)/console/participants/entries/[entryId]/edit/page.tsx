import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateEntry, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ entryId: string }> }) {
  const { entryId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("delegation_entries", session.orgId, entryId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  const action = updateEntry.bind(null, entryId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader eyebrow="Participants · Entry" title="Edit Entry" />
      <div className="page-content max-w-xl">
        <FormShell action={action} cancelHref={`/console/participants/entries/${entryId}`} submitLabel="Save Changes">
          <Input
            label="Participant Name"
            name="participant_name"
            maxLength={200}
            defaultValue={(r.participant_name as string | undefined) ?? ""}
            required
          />
          <Input
            label="Discipline"
            name="discipline"
            maxLength={120}
            defaultValue={(r.discipline as string | undefined) ?? ""}
          />
          <Input label="Event" name="event" maxLength={120} defaultValue={(r.event as string | undefined) ?? ""} />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Status</label>
            <select
              name="status"
              defaultValue={(r.status as string | undefined) ?? "nominated"}
              className="input-base mt-1.5 w-full"
            >
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
