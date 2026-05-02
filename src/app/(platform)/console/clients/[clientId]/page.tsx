import { notFound } from "next/navigation";
import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth";
import { getOrgScoped, listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { timeAgo } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { deleteClient } from "./edit/actions";

export const dynamic = "force-dynamic";

export default async function ClientDetail({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const client = await getOrgScoped("clients", session.orgId, clientId);
  if (!client) notFound();

  const [proposals, invoices] = await Promise.all([
    listOrgScoped("proposals", session.orgId, {
      filters: [{ column: "client_id", op: "eq", value: clientId }],
      orderBy: "created_at",
    }),
    listOrgScoped("invoices", session.orgId, {
      filters: [{ column: "client_id", op: "eq", value: clientId }],
      orderBy: "created_at",
    }),
  ]);

  return (
    <>
      <ModuleHeader
        eyebrow="Client"
        title={client.name}
        subtitle={client.contact_email ?? "No email on file"}
        breadcrumbs={[
          { label: "Sales", href: "/console/clients" },
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
        {/* Field cards: switched from .surface (3px border + 8px brutal
            shadow) to .surface (3px border, no shadow). Metadata reads as
            metadata, not primary content; matches the borderless canon
            applied to data tables. */}
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

        {/* Summary tables: borderless per design canon. The canonical
            DataTable wrapper isn't used here because these are summary
            views (top-5 most recent, "View all →" links to the full list
            with sort/filter/bulk-actions). Bulk select / inline edit /
            row-level actions stay on the main list page; row-click on
            a summary navigates to that record's detail. */}
        <section>
          <header className="flex items-center justify-between pb-3">
            <h2 className="text-base font-semibold">Proposals</h2>
            <Link
              href={`/console/proposals?clientId=${client.id}`}
              className="text-xs text-[var(--org-primary)] hover:underline"
            >
              View All →
            </Link>
          </header>
          {proposals.length === 0 ? (
            <EmptyState size="compact" title="No Proposals Yet" />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th className="text-right">Amount</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {proposals.slice(0, 5).map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link
                        href={`/console/proposals/${p.id}`}
                        className="hover:text-[var(--org-primary)] hover:underline"
                      >
                        {p.title}
                      </Link>
                    </td>
                    <td className="text-right tabular-nums">{formatMoney(p.amount_cents ?? 0)}</td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td>{timeAgo(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section>
          <header className="flex items-center justify-between pb-3">
            <h2 className="text-base font-semibold">Invoices</h2>
            <Link
              href={`/console/finance/invoices?clientId=${client.id}`}
              className="text-xs text-[var(--org-primary)] hover:underline"
            >
              View All →
            </Link>
          </header>
          {invoices.length === 0 ? (
            <EmptyState size="compact" title="No Invoices Yet" />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Title</th>
                  <th className="text-right">Amount</th>
                  <th>Status</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(0, 5).map((i) => (
                  <tr key={i.id}>
                    <td className="font-mono text-xs">{i.number}</td>
                    <td>
                      <Link
                        href={`/console/finance/invoices/${i.id}`}
                        className="hover:text-[var(--org-primary)] hover:underline"
                      >
                        {i.title}
                      </Link>
                    </td>
                    <td className="text-right tabular-nums">{formatMoney(i.amount_cents, i.currency)}</td>
                    <td>
                      <StatusBadge status={i.status} />
                    </td>
                    <td>{i.due_at ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
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
