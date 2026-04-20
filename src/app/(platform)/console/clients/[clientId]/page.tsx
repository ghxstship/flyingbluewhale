import { notFound } from "next/navigation";
import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { getOrgScoped, listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { timeAgo } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function ClientDetail({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const client = await getOrgScoped("clients", session.orgId, clientId);
  if (!client) notFound();

  const [proposals, invoices] = await Promise.all([
    listOrgScoped("proposals", session.orgId, { filters: [{ column: "client_id", op: "eq", value: clientId }], orderBy: "created_at" }),
    listOrgScoped("invoices", session.orgId, { filters: [{ column: "client_id", op: "eq", value: clientId }], orderBy: "created_at" }),
  ]);

  return (
    <>
      <ModuleHeader
        eyebrow="Client"
        title={client.name}
        subtitle={client.contact_email ?? "No email on file"}
        action={<Button href={`/console/proposals/new?clientId=${client.id}`}>+ New proposal</Button>}
      />
      <div className="page-content space-y-6">
        <div className="metric-grid">
          <Field label="Email">{client.contact_email ?? "—"}</Field>
          <Field label="Phone">{client.contact_phone ?? "—"}</Field>
          <Field label="Website">{client.website ?? "—"}</Field>
          <Field label="Added">{timeAgo(client.created_at)}</Field>
        </div>

        {client.notes && (
          <div className="surface p-5">
            <h3 className="text-sm font-semibold">Notes</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text-secondary)]">{client.notes}</p>
          </div>
        )}

        <section className="surface">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] px-5 py-3">
            <h2 className="text-sm font-semibold">Proposals</h2>
            <Link href={`/console/proposals?clientId=${client.id}`} className="text-xs text-[var(--org-primary)]">View all →</Link>
          </div>
          {proposals.length === 0 ? (
            <EmptyState size="compact" title="No proposals yet" />
          ) : (
            <table className="data-table">
              <thead><tr><th>Title</th><th>Amount</th><th>Status</th><th>Created</th></tr></thead>
              <tbody>
                {proposals.slice(0, 5).map((p) => (
                  <tr key={p.id}>
                    <td><Link href={`/console/proposals/${p.id}`}>{p.title}</Link></td>
                    <td className="font-mono text-xs">{formatMoney(p.amount_cents ?? 0)}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td className="font-mono text-xs">{timeAgo(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="surface">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] px-5 py-3">
            <h2 className="text-sm font-semibold">Invoices</h2>
            <Link href={`/console/finance/invoices?clientId=${client.id}`} className="text-xs text-[var(--org-primary)]">View all →</Link>
          </div>
          {invoices.length === 0 ? (
            <EmptyState size="compact" title="No invoices yet" />
          ) : (
            <table className="data-table">
              <thead><tr><th>Number</th><th>Title</th><th>Amount</th><th>Status</th><th>Due</th></tr></thead>
              <tbody>
                {invoices.slice(0, 5).map((i) => (
                  <tr key={i.id}>
                    <td className="font-mono text-xs">{i.number}</td>
                    <td><Link href={`/console/finance/invoices/${i.id}`}>{i.title}</Link></td>
                    <td className="font-mono text-xs">{formatMoney(i.amount_cents, i.currency)}</td>
                    <td><StatusBadge status={i.status} /></td>
                    <td className="font-mono text-xs">{i.due_at ?? "—"}</td>
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
    <div className="surface-raised p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{label}</div>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}
