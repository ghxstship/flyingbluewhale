import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateTicketType, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ ticketTypeId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("ticket_types", session.orgId, p.ticketTypeId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  void r;
  const action = updateTicketType.bind(null, p.ticketTypeId) as unknown as (
    state: State,
    fd: FormData,
  ) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow="Ticket Type"
        title={`Edit ${((row as Record<string, unknown>)["name"] as string | undefined) ?? "Ticket type"}`}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/commercial/tickets/${p.ticketTypeId}`}
          submitLabel="Save Changes"
        >
          <Input label="Name" name="name" defaultValue={row.name ?? ""} required maxLength={200} />
          <Input label="Channel" name="channel" defaultValue={row.channel ?? ""} required maxLength={80} />
          <Input
            label="Price (cents)"
            name="price_cents"
            type="number"
            defaultValue={row.price_cents != null ? String(row.price_cents) : ""}
          />
          <Input label="Currency" name="currency" defaultValue={row.currency ?? ""} required maxLength={3} />
          <Input
            label="Allocation"
            name="allocation"
            type="number"
            defaultValue={row.allocation != null ? String(row.allocation) : ""}
          />
        </FormShell>
      </div>
    </>
  );
}
