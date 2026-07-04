import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { deleteClient } from "./edit/actions";

export const dynamic = "force-dynamic";

export default async function ClientDetail({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const client = await getOrgScoped("clients", session.orgId, clientId);
  if (!client) notFound();
  const { t } = await getRequestT();

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.clients.detail.eyebrow", undefined, "Client")}
        title={client.name}
        subtitle={client.contact_email ?? t("console.clients.detail.noEmail", undefined, "No email on file")}
        breadcrumbs={[
          { label: t("console.clients.detail.breadcrumb.commerce", undefined, "Sales"), href: "/studio/clients" },
          { label: t("console.clients.detail.breadcrumb.clients", undefined, "Clients"), href: "/studio/clients" },
          { label: client.name },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button href={`/studio/proposals/new?clientId=${client.id}`} size="sm">
              {t("console.clients.detail.newProposal", undefined, "+ New Proposal")}
            </Button>
            <Button href={`/studio/finance/invoices/new?clientId=${client.id}`} size="sm" variant="secondary">
              {t("console.clients.detail.newInvoice", undefined, "+ New Invoice")}
            </Button>
            <Button href={`/studio/clients/${clientId}/edit`} size="sm" variant="secondary">
              {t("common.edit", undefined, "Edit")}
            </Button>
            <DeleteForm
              action={deleteClient.bind(null, clientId)}
              confirm={t(
                "console.clients.detail.deleteConfirm",
                { name: client.name },
                `Delete client "${client.name}"? Linked proposals and invoices will remain but become unattached.`,
              )}
              undo={{ table: "clients", id: clientId, redirectTo: "/studio/clients" }}
            />
          </div>
        }
      />
      <div className="page-content space-y-8">
        <div className="metric-grid">
          <Field label={t("console.clients.detail.field.email", undefined, "Email")}>
            {client.contact_email ?? "—"}
          </Field>
          <Field label={t("console.clients.detail.field.phone", undefined, "Phone")}>
            {client.contact_phone ?? "—"}
          </Field>
          <Field label={t("console.clients.detail.field.website", undefined, "Website")}>{client.website ?? "—"}</Field>
          <Field label={t("console.clients.detail.field.added", undefined, "Added")}>
            {timeAgo(client.created_at)}
          </Field>
        </div>

        {client.notes && (
          <div className="surface p-5">
            <h3 className="text-sm font-semibold">{t("console.clients.detail.notes", undefined, "Notes")}</h3>
            <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--p-text-2)]">{client.notes}</p>
          </div>
        )}
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="surface p-3">
      <div className="text-[11px] font-semibold tracking-wide text-[var(--p-text-2)]">{label}</div>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}
