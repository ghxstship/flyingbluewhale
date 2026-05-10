export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtDateTime, money } from "@/components/detail/DetailShell";
import { endRentalNow, deleteRental } from "../actions";

export default async function Page({ params }: { params: Promise<{ rentalId: string }> }) {
  const { rentalId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("rentals")
    .select(
      "id, equipment_id, project_id, starts_at, ends_at, rate_cents, notes, created_at, equipment(name, asset_tag)",
    )
    .eq("org_id", session.orgId)
    .eq("id", rentalId)
    .maybeSingle();

  if (!row) {
    return (
      <>
        <ModuleHeader eyebrow="Production" title="Rental" />
        <div className="page-content">
          <div className="surface p-6 text-sm text-[var(--text-muted)]">Not found.</div>
        </div>
      </>
    );
  }

  const eq = row.equipment as { name?: string; asset_tag?: string | null } | null;
  const now = Date.now();
  const status =
    new Date(row.ends_at).getTime() < now ? "ended" : new Date(row.starts_at).getTime() <= now ? "active" : "scheduled";

  return (
    <>
      <ModuleHeader
        eyebrow="Production"
        title={`Rental · ${eq?.name ?? "—"}`}
        subtitle={eq?.asset_tag ?? undefined}
        breadcrumbs={[
          { label: "Production" },
          { label: "Rentals", href: "/console/production/rentals" },
          { label: eq?.name ?? "Rental" },
        ]}
        action={
          <div className="flex items-center gap-2">
            {status === "active" && (
              <form action={endRentalNow} className="inline">
                <input type="hidden" name="id" value={row.id} />
                <Button type="submit" variant="secondary" size="sm">
                  End rental now
                </Button>
              </form>
            )}
            <a href={`/console/production/rentals/${row.id}/edit`} className="btn btn-secondary btn-sm">
              Edit
            </a>
          </div>
        }
      />
      <div className="page-content max-w-3xl space-y-4">
        <section className="surface p-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field
              label="Status"
              value={
                <Badge variant={status === "active" ? "info" : status === "scheduled" ? "muted" : "success"}>
                  {status}
                </Badge>
              }
            />
            <Field label="Starts" value={<span className="font-mono text-xs">{fmtDateTime(row.starts_at)}</span>} />
            <Field label="Ends" value={<span className="font-mono text-xs">{fmtDateTime(row.ends_at)}</span>} />
            <Field label="Rate" value={<span className="font-mono text-xs">{money(row.rate_cents)}</span>} />
          </div>
          {row.notes && (
            <div className="mt-4 border-t border-[var(--border-color)] pt-3 text-xs text-[var(--text-secondary)]">
              {row.notes}
            </div>
          )}
        </section>

        <section className="surface p-4 text-xs">
          <div className="flex items-center justify-between">
            <Badge variant="muted">Lifecycle</Badge>
            <form action={deleteRental}>
              <input type="hidden" name="id" value={row.id} />
              <Button type="submit" variant="ghost" size="sm" className="text-[var(--color-error)]">
                Delete rental
              </Button>
            </form>
          </div>
        </section>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.18em] text-[var(--text-muted)] uppercase">{label}</div>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}
