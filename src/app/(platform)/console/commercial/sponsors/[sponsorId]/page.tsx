import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { deleteSponsorEntitlement } from "./edit/actions";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning"> = {
  open: "warning",
  in_progress: "info",
  delivered: "success",
  waived: "muted",
};

function fmtDate(v: unknown): string {
  if (typeof v !== "string" || !v) return "—";
  return v.slice(0, 10);
}

export default async function Page({ params }: { params: Promise<{ sponsorId: string }> }) {
  const p = await params;
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader eyebrow="Commercial · Sponsors" title="Entitlement" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const row = await getOrgScoped("sponsor_entitlements", session.orgId, p.sponsorId);
  if (!row) notFound();

  const r = row as Record<string, unknown>;
  const title = (r.title as string | undefined) ?? p.sponsorId;
  const status = (r.status as string | undefined) ?? "open";
  const quantity = r.quantity as number | undefined;
  const dueBy = r.due_by as string | undefined;
  const notes = r.notes as string | undefined;

  return (
    <>
      <ModuleHeader
        eyebrow="Commercial · Sponsor Entitlements"
        title={title}
        subtitle={
          quantity != null
            ? `Qty ${quantity}${dueBy ? ` · Due ${fmtDate(dueBy)}` : ""}`
            : dueBy
              ? `Due ${fmtDate(dueBy)}`
              : undefined
        }
        breadcrumbs={[
          { label: "Commercial", href: "/console" },
          { label: "Sponsors", href: "/console/commercial/sponsors" },
          { label: title },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_TONE[status] ?? "muted"}>{toTitle(status)}</Badge>
            <Button href={`/console/commercial/sponsors/${p.sponsorId}/edit`} size="sm" variant="secondary">
              Edit
            </Button>
            <DeleteForm
              action={deleteSponsorEntitlement.bind(null, p.sponsorId)}
              confirm="Delete this entitlement? This cannot be undone."
            />
          </div>
        }
      />
      <div className="page-content space-y-4">
        <section className="surface p-6">
          <h2 className="mb-3 text-xs font-semibold tracking-[0.16em] text-[var(--text-muted)] uppercase">
            Entitlement
          </h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Title">{title}</Field>
            <Field label="Status">{toTitle(status)}</Field>
            <Field label="Quantity">{quantity ?? "—"}</Field>
            <Field label="Due By">{fmtDate(dueBy)}</Field>
          </dl>
          {notes && (
            <div className="mt-4">
              <div className="text-xs font-semibold tracking-[0.16em] text-[var(--text-muted)] uppercase">Notes</div>
              <p className="mt-2 text-sm whitespace-pre-wrap">{notes}</p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-[var(--text-secondary)]">{label}</dt>
      <dd className="mt-1 text-sm">{children}</dd>
    </div>
  );
}
