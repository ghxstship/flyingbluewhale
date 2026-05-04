import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateMeeting, type State } from "./actions";

export const dynamic = "force-dynamic";

function dateTimeLocal(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 16);
}

export default async function Page({ params }: { params: Promise<{ meetingId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("events", session.orgId, p.meetingId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  void r;
  const action = updateMeeting.bind(null, p.meetingId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow="Meeting"
        title={`Edit ${((row as Record<string, unknown>)["name"] as string | undefined) ?? "Meeting"}`}
      />
      <div className="page-content max-w-xl">
        <FormShell action={action} cancelHref={`/console/meetings/${p.meetingId}`} submitLabel="Save Changes">
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input label="Title" name="name" defaultValue={row.name ?? ""} required maxLength={200} />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Description</span>
            <textarea
              name="description"
              defaultValue={row.description ?? ""}
              rows={5}
              className="input-base focus-ring w-full"
            />
          </label>
          <Input
            label="Starts At"
            name="starts_at"
            type="datetime-local"
            defaultValue={dateTimeLocal(row.starts_at)}
            required
          />
          <Input
            label="Ends At"
            name="ends_at"
            type="datetime-local"
            defaultValue={dateTimeLocal(row.ends_at)}
            required
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Status</span>
            <select name="status" defaultValue={row.status ?? ""} required className="input-base focus-ring w-full">
              <option value="draft">draft</option>
              <option value="scheduled">scheduled</option>
              <option value="live">live</option>
              <option value="complete">complete</option>
              <option value="cancelled">cancelled</option>
            </select>
          </label>
        </FormShell>
      </div>
    </>
  );
}
