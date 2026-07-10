export const dynamic = "force-dynamic";

import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtDateTime, money } from "@/components/detail/DetailShell";
import { DownloadLink } from "@/components/DownloadLink";
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
      "id, asset_id, project_id, starts_at, ends_at, rate_cents, notes, created_at, assets(display_name, asset_tag)",
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
          <div className="surface p-6 text-sm text-[var(--p-text-2)]">
            {t("console.production.rentals.detail.notFound", undefined, "Not found.")}
          </div>
        </div>
      </>
    );
  }

  const asset = row.assets as { display_name?: string; asset_tag?: string | null } | null;
  const now = Date.now();
  const status =
    new Date(row.ends_at).getTime() < now ? "ended" : new Date(row.starts_at).getTime() <= now ? "active" : "scheduled";

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.production.rentals.detail.eyebrow", undefined, "Production")}
        title={`${t("console.production.rentals.detail.title", undefined, "Rental")} · ${asset?.display_name ?? "—"}`}
        subtitle={asset?.asset_tag ?? undefined}
        breadcrumbs={[
          { label: t("console.production.rentals.detail.breadcrumbProduction", undefined, "Production") },
          {
            label: t("console.production.rentals.detail.breadcrumbRentals", undefined, "Rentals"),
            href: "/studio/production/rentals",
          },
          { label: asset?.display_name ?? t("console.production.rentals.detail.title", undefined, "Rental") },
        ]}
        action={
          <div className="flex items-center gap-2">
            {status === "active" && (
              <form action={endRentalNow} className="inline">
                <input type="hidden" name="id" value={row.id} />
                <button
                  type="submit"
                  className="rounded-md border border-[var(--p-border)] px-2.5 py-1 text-xs font-medium text-[var(--p-text-2)] hover:bg-[var(--p-surface-2)] hover:text-[var(--p-text-1)]"
                >
                  {t("console.production.rentals.detail.endRentalNow", undefined, "End rental now")}
                </button>
              </form>
            )}
            <DownloadLink href={`/api/v1/rentals/${row.id}/pull-sheet`}>
              {t("console.production.rentals.detail.pullSheet", undefined, "Pull Sheet")}
            </DownloadLink>
            <a href={`/studio/production/rentals/${row.id}/edit`} className="ps-btn ps-btn--ghost ps-btn--sm">
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
              label={t("console.production.rentals.detail.fieldAsset", undefined, "Asset")}
              value={
                <Link href={`/studio/assets/${row.asset_id}`} className="hover:underline">
                  {asset?.display_name ?? row.asset_id.slice(0, 8)}
                </Link>
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
            <div className="mt-4 border-t border-[var(--p-border)] pt-3 text-xs text-[var(--p-text-2)]">
              {row.notes}
            </div>
          )}
        </section>

        <section className="surface p-4 text-xs">
          <div className="flex items-center justify-between">
            <Badge variant="muted">{t("console.production.rentals.detail.lifecycle", undefined, "Lifecycle")}</Badge>
            <form action={deleteRental}>
              <input type="hidden" name="id" value={row.id} />
              <button type="submit" className="text-[color:var(--p-danger)] hover:underline">
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
      <div className="text-[11px] tracking-[0.18em] text-[var(--p-text-2)] uppercase">{label}</div>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}
