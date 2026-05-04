import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateRoster, type State } from "./actions";

export const dynamic = "force-dynamic";

function dateOnly(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 10);
}

export default async function Page({ params }: { params: Promise<{ rosterId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("rosters", session.orgId, p.rosterId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  void r;
  const action = updateRoster.bind(null, p.rosterId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow="Roster"
        title={`Edit ${((row as Record<string, unknown>)["name"] as string | undefined) ?? "Roster"}`}
      />
      <div className="page-content max-w-xl">
        <FormShell action={action} cancelHref={`/console/workforce/rosters/${p.rosterId}`} submitLabel="Save Changes">
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input label="Name" name="name" defaultValue={row.name ?? ""} required maxLength={200} />
          <Input label="Day Of" name="day_of" type="date" defaultValue={dateOnly(row.day_of)} required />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">State</span>
            <select name="state" defaultValue={row.state ?? ""} required className="input-base focus-ring w-full">
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="locked">locked</option>
            </select>
          </label>
        </FormShell>
      </div>
    </>
  );
}
