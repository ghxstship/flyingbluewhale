import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { deleteTicketType } from "./edit/actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ ticketTypeId: string }> }) {
  const p = await params;
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title="Record" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const row = await getOrgScoped("ticket_types", session.orgId, p.ticketTypeId);
  if (!row) notFound();
  const title = (row as Record<string, unknown>)["name"] as string | undefined;
  return (
    <>
      <ModuleHeader
        eyebrow="Record"
        title={title ?? p.ticketTypeId}
        action={
          <div className="flex items-center gap-2">
            <Button href="/console/commercial/tickets" variant="ghost" size="sm">
              Back
            </Button>
            <Button href={`/console/commercial/tickets/${p.ticketTypeId}/edit`} size="sm">
              Edit
            </Button>
            <DeleteForm
              action={deleteTicketType.bind(null, p.ticketTypeId)}
              confirm={`Delete this record? This cannot be undone.`}
            />
          </div>
        }
      />
      <div className="page-content">
        <dl className="surface grid grid-cols-1 gap-3 p-6 sm:grid-cols-2">
          {Object.entries(row as Record<string, unknown>).map(([k, v]) => (
            <div key={k} className="flex flex-col gap-1">
              <dt className="text-xs tracking-wide text-[var(--muted)] uppercase">{k}</dt>
              <dd className="font-mono text-xs break-all">
                {v === null || v === undefined ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}
