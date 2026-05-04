import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateBlock, type State } from "./actions";

export const dynamic = "force-dynamic";

function dateOnly(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 10);
}

export default async function Page({ params }: { params: Promise<{ blockId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("accommodation_blocks", session.orgId, p.blockId);
  if (!row) notFound();
  const action = updateBlock.bind(null, p.blockId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader eyebrow="Accommodation" title={`Edit ${row.name}`} />
      <div className="page-content max-w-xl">
        <FormShell action={action} cancelHref={`/console/accommodation/blocks/${p.blockId}`} submitLabel="Save Changes">
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input label="Name" name="name" defaultValue={row.name} required maxLength={200} />
          <Input label="Property" name="property" defaultValue={row.property} required maxLength={200} />
          <Input label="City" name="city" defaultValue={row.city ?? ""} maxLength={120} />
          <Input
            label="Stakeholder Group"
            name="stakeholder_group"
            defaultValue={row.stakeholder_group ?? ""}
            maxLength={120}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Rooms Reserved"
              name="rooms_reserved"
              type="number"
              defaultValue={String(row.rooms_reserved ?? 0)}
            />
            <Input
              label="Rooms Confirmed"
              name="rooms_confirmed"
              type="number"
              defaultValue={String(row.rooms_confirmed ?? 0)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Starts On" name="starts_on" type="date" defaultValue={dateOnly(row.starts_on)} />
            <Input label="Ends On" name="ends_on" type="date" defaultValue={dateOnly(row.ends_on)} />
          </div>
        </FormShell>
      </div>
    </>
  );
}
