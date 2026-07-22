export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DataView } from "@/components/views/DataViewServer";
import { fmtDateTime, money } from "@/components/detail/DetailShell";
import { getRequestT } from "@/lib/i18n/request";

type RentalRow = {
  id: string;
  asset_id: string;
  project_id: string | null;
  starts_at: string;
  ends_at: string;
  rate_cents: number | null;
  notes: string | null;
};

/**
 * Logistics = rentals whose window overlaps today + next 7 days. Each
 * row is a prospective move (load-out at `starts_at`, load-in back at
 * `ends_at`). No shipments table yet — this is the scheduling surface
 * that would feed one when it's built.
 */
export default async function LogisticsPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  const now = new Date();
  const nowIso = now.toISOString();
  const in7d = new Date(now.getTime() + 7 * 864e5).toISOString();
  const { data: rentals } = await supabase
    .from("rentals")
    .select("id, asset_id, project_id, starts_at, ends_at, rate_cents, notes")
    .eq("org_id", session.orgId)
    .or(`and(starts_at.lte.${in7d},ends_at.gte.${nowIso})`)
    .order("starts_at", { ascending: true })
    .limit(50);
  const rows = (rentals ?? []) as RentalRow[];
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.production.logistics.eyebrow", undefined, "Production")}
        title={t("console.production.logistics.title", undefined, "Logistics")}
        subtitle={
          rows.length === 1
            ? t(
                "console.production.logistics.subtitleOne",
                { count: rows.length },
                `${rows.length} Active  rental window across the next 7 days`,
              )
            : t(
                "console.production.logistics.subtitleOther",
                { count: rows.length },
                `${rows.length} Active  rental windows across the next 7 days`,
              )
        }
      />
      <div className="page-content max-w-5xl">
        <DataView<RentalRow>
          rows={rows}
          tableId="console:production:logistics"
          rowHref={(r) => `/studio/production/rentals/${r.id}`}
          emptyLabel={t("console.production.logistics.empty.title", undefined, "Nothing Moving This Week")}
          emptyDescription={t(
            "console.production.logistics.empty.description",
            undefined,
            "Rentals with overlapping windows surface here as load-out / load-in candidates. Seed a rental against an asset to see it appear.",
          )}
          columns={[
            {
              key: "rental",
              header: t("console.production.logistics.table.rental", undefined, "Rental"),
              render: (r) => r.id.slice(0, 8),
              accessor: (r) => r.id,
              mono: true,
            },
            {
              key: "load_out",
              header: t("console.production.logistics.table.loadOut", undefined, "Load-out"),
              render: (r) => fmtDateTime(r.starts_at),
              accessor: (r) => r.starts_at,
              mono: true,
            },
            {
              key: "load_in",
              header: t("console.production.logistics.table.loadIn", undefined, "Load-in"),
              render: (r) => fmtDateTime(r.ends_at),
              accessor: (r) => r.ends_at,
              mono: true,
            },
            {
              key: "rate",
              header: t("console.production.logistics.table.rate", undefined, "Rate"),
              render: (r) => money(r.rate_cents),
              accessor: (r) => r.rate_cents ?? null,
              mono: true,
              tabular: true,
            },
            {
              key: "notes",
              header: t("console.production.logistics.table.notes", undefined, "Notes"),
              render: (r) => <span className="text-[var(--p-text-2)]">{r.notes ?? "—"}</span>,
              accessor: (r) => r.notes ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
