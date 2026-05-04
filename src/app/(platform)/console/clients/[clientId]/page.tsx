import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import { deleteClient } from "./edit/actions";

export const dynamic = "force-dynamic";

export default async function ClientDetail({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const client = await getOrgScoped("clients", session.orgId, clientId);
  if (!client) notFound();

  return (
    <>
      <ModuleHeader
        eyebrow="Client"
        title={client.name}
        subtitle={client.contact_email ?? "No email on file"}
        breadcrumbs={[
          { label: "Commerce", href: "/console/clients" },
          { label: "Clients", href: "/console/clients" },
          { label: client.name },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button href={`/console/proposals/new?clientId=${client.id}`} size="sm">
              + New Proposal
            </Button>
            <Button href={`/console/clients/${clientId}/edit`} size="sm" variant="secondary">
              Edit
            </Button>
            <DeleteForm
              action={deleteClient.bind(null, clientId)}
              confirm={`Delete client "${client.name}"? Linked proposals and invoices will remain but become unattached.`}
            />
          </div>
        }
      />
      <div className="page-content space-y-8">
        <div className="metric-grid">
          <Field label="Email">{client.contact_email ?? "—"}</Field>
          <Field label="Phone">{client.contact_phone ?? "—"}</Field>
          <Field label="Website">{client.website ?? "—"}</Field>
          <Field label="Added">{timeAgo(client.created_at)}</Field>
        </div>

        {client.notes && (
          <div className="surface p-5">
            <h3 className="text-sm font-semibold">Notes</h3>
            <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--text-secondary)]">{client.notes}</p>
          </div>
        )}
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="surface p-3">
      <div className="text-[11px] font-semibold tracking-wide text-[var(--text-muted)]">{label}</div>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}
