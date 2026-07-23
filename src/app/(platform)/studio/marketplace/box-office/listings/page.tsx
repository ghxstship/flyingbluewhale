import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { DataView } from "@/components/views/DataViewServer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/commerce_store";
import { formatDateParts } from "@/lib/i18n/format";
import { countLabel } from "@/lib/format";
import {
  listFirstPartyListings,
  listTicketTypes,
  getEventRevenue,
} from "@/lib/box_office_ticketing";

export const dynamic = "force-dynamic";

type ListingRow = {
  id: string;
  title: string;
  startsAt: string | null;
  listingState: string;
  sold: number;
  capacity: number;
  grossCents: number;
  currency: string;
};

function formatEventDate(value: string | null): string {
  if (!value) return "TBD";
  return formatDateParts(new Date(value), { month: "short", day: "numeric", year: "numeric" });
}

/**
 * /studio/marketplace/box-office/listings — index of the org's FIRST-PARTY
 * event listings. Each row's gross figure comes from `v_event_revenue` (the
 * SSOT), never recomputed from order rows.
 */
export default async function BoxOfficeListingsPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Box Office" title="Listings" />
        <ConfigureSupabase />
      </>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();

  const listings = await listFirstPartyListings(supabase, session.orgId);

  const rows: ListingRow[] = await Promise.all(
    listings.map(async (listing) => {
      const [types, revenue] = await Promise.all([
        listTicketTypes(supabase, listing.id),
        getEventRevenue(supabase, session.orgId, listing.id),
      ]);
      const sold = types.reduce((sum, t) => sum + (t.quantity_sold ?? 0), 0);
      const capacity = types.reduce((sum, t) => sum + (t.quantity_total ?? 0), 0);
      return {
        id: listing.id,
        title: listing.title,
        startsAt: listing.starts_at,
        listingState: listing.listing_state,
        sold,
        capacity,
        grossCents: revenue?.gross_cents ?? 0,
        currency: "USD",
      };
    }),
  );

  return (
    <>
      <ModuleHeader
        eyebrow="Box Office"
        title="Listings"
        subtitle={countLabel(rows.length, "First-Party Event")}
        breadcrumbs={[{ label: "Marketplace" }, { label: "Box Office" }, { label: "Listings" }]}
      />
      <div className="page-content">
        {rows.length === 0 ? (
          <EmptyState
            title="No first-party events yet"
            description="Self-fulfilled ticketed events show up here once you create a first-party listing."
          />
        ) : (
          <DataView<ListingRow>
            rows={rows}
            columns={[
              {
                key: "title",
                header: "Event",
                render: (r) => (
                  <Link
                    href={`/studio/marketplace/box-office/listings/${r.id}`}
                    className="font-medium text-[var(--p-accent-text)] hover:underline"
                  >
                    {r.title}
                  </Link>
                ),
                accessor: (r) => r.title,
              },
              {
                key: "date",
                header: "Date",
                render: (r) => formatEventDate(r.startsAt),
                accessor: (r) => r.startsAt ?? "",
              },
              {
                key: "state",
                header: "Status",
                render: (r) => <StatusBadge status={r.listingState} />,
                accessor: (r) => r.listingState,
                filterable: true,
              },
              {
                key: "sold",
                header: "Sold / Capacity",
                render: (r) => `${r.sold} / ${r.capacity}`,
                accessor: (r) => r.sold,
                tabular: true,
              },
              {
                key: "gross",
                header: "Gross",
                render: (r) => formatMoney(r.grossCents, r.currency),
                accessor: (r) => r.grossCents,
                tabular: true,
              },
            ]}
          />
        )}
      </div>
    </>
  );
}
