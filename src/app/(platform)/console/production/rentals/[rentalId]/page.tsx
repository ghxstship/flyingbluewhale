export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtDateTime, money } from "@/components/detail/DetailShell";
import { getRequestT } from "@/lib/i18n/request";
import { endRentalNow, deleteRental } from "../actions";

export default async function Page({ params }: { params: Promise<{ rentalId: string }> }) {
  const { rentalId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
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
        <ModuleHeader
          eyebrow={t("console.production.rentals.detail.eyebrow", undefined, "Production")}
          title={t("console.production.rentals.detail.title", undefined, "Rental")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm text-[var(--text-muted)]">
            {t("console.production.rentals.detail.notFound", undefined, "Not found.")}
          </div>
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
        eyebrow={t("console.production.rentals.detail.eyebrow", undefined, "Production")}
        title={`${t("console.production.rentals.detail.title", undefined, "Rental")} · ${eq?.name ?? "—"}`}
        subtitle={eq?.asset_tag ?? undefined}
        breadcrumbs={[
          { label: t("console.production.rentals.detail.breadcrumbProduction", undefined, "Production") },
          {
            label: t("console.production.rentals.detail.breadcrumbRentals", undefined, "Rentals"),
            href: "/console/production/rentals",
          },
          { label: eq?.name ?? t("console.production.rentals.detail.title", undefined, "Rental") },
        ]}
        action={
          <div className="flex items-center gap-2">
            {status === "active" && (
              <form action={endRentalNow} className="inline">
                <input type="hidden" name="id" value={row.id} />
                <button
                  type="submit"
                  className="rounded-md border border-[var(--border-color)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-inset)] hover:text-[var(--text-primary)]"
                >
                  {t("console.production.rentals.detail.endRentalNow", undefined, "End rental now")}
                </button>
              </form>
            )}
            <a href={`/console/production/rentals/${row.id}/edit`} className="btn btn-secondary btn-sm">
              {t("common.edit", undefined, "Edit")}
            </a>
          </div>
        }
      />
      <div className="page-content max-w-3xl space-y-4">
        <section className="surface p-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field
              label={t("console.production.rentals.detail.fieldStatus", undefined, "Status")}
              value={
                <Badge variant={status === "active" ? "info" : status === "scheduled" ? "muted" : "success"}>
                  {status === "active"
                    ? t("console.production.rentals.detail.statusActive", undefined, "active")
                    : status === "scheduled"
                      ? t("console.production.rentals.detail.statusScheduled", undefined, "scheduled")
                      : t("console.production.rentals.detail.statusEnded", undefined, "ended")}
                </Badge>
              }
            />
            <Field
              label={t("console.production.rentals.detail.fieldStarts", undefined, "Starts")}
              value={<span className="font-mono text-xs">{fmtDateTime(row.starts_at)}</span>}
            />
            <Field
              label={t("console.production.rentals.detail.fieldEnds", undefined, "Ends")}
              value={<span className="font-mono text-xs">{fmtDateTime(row.ends_at)}</span>}
            />
            <Field
              label={t("console.production.rentals.detail.fieldRate", undefined, "Rate")}
              value={<span className="font-mono text-xs">{money(row.rate_cents)}</span>}
            />
          </div>
          {row.notes && (
            <div className="mt-4 border-t border-[var(--border-color)] pt-3 text-xs text-[var(--text-secondary)]">
              {row.notes}
            </div>
          )}
        </section>

        <section className="surface p-4 text-xs">
          <div className="flex items-center justify-between">
            <Badge variant="muted">{t("console.production.rentals.detail.lifecycle", undefined, "Lifecycle")}</Badge>
            <form action={deleteRental}>
              <input type="hidden" name="id" value={row.id} />
              <button type="submit" className="text-[color:var(--color-error)] hover:underline">
                {t("console.production.rentals.detail.deleteRental", undefined, "Delete rental")}
              </button>
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
