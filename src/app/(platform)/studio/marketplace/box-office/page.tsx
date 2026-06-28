import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { getRequestT } from "@/lib/i18n/request";
import { timeAgo } from "@/lib/format";
import { rollupAttendance, type GuestEntryState } from "@/lib/box_office";

export const dynamic = "force-dynamic";

type GuestList = {
  id: string;
  name: string;
  event_id: string | null;
  created_at: string;
};

export default async function BoxOfficePage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title={t("console.boxOffice.title", undefined, "Box Office")} />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data: listData } = await supabase
    .from("guest_lists" as never)
    .select("id, name, event_id, created_at")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  const lists = (listData ?? []) as unknown as GuestList[];

  // Aggregate entry counts per list + org-wide door rollup.
  const { data: entryData } = await supabase
    .from("guest_list_entries" as never)
    .select("guest_list_id, plus_ones, entry_state")
    .eq("org_id", session.orgId)
    .is("deleted_at", null);

  const entries = (entryData ?? []) as Array<{
    guest_list_id: string;
    plus_ones: number | null;
    entry_state: GuestEntryState;
  }>;

  const perList = new Map<string, typeof entries>();
  for (const e of entries) {
    const bucket = perList.get(e.guest_list_id) ?? [];
    bucket.push(e);
    perList.set(e.guest_list_id, bucket);
  }

  const orgRollup = rollupAttendance(entries);

  const rows = lists.map((l) => {
    const r = rollupAttendance(perList.get(l.id) ?? []);
    return { ...l, ...r };
  });

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.boxOffice.eyebrow", undefined, "GVTEWAY")}
        title={t("console.boxOffice.title", undefined, "Box Office")}
        subtitle={t(
          "console.boxOffice.subtitle",
          undefined,
          "Guest lists, door scan, and live check-in. DICE/TIXR-style box office.",
        )}
        action={
          <div className="flex items-center gap-2">
            <Button href="/studio/marketplace/box-office/listings" variant="secondary" size="sm">
              {t("console.boxOffice.ticketedEvents", undefined, "Ticketed events")}
            </Button>
            <Button href="/studio/marketplace/box-office/new">
              {t("console.boxOffice.newList", undefined, "+ New Guest List")}
            </Button>
          </div>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-4">
          <MetricCard
            label={t("console.boxOffice.metrics.lists", undefined, "Guest Lists")}
            value={String(lists.length)}
            accent
          />
          <MetricCard
            label={t("console.boxOffice.metrics.expected", undefined, "Expected Heads")}
            value={String(orgRollup.expectedHeads)}
          />
          <MetricCard
            label={t("console.boxOffice.metrics.arrived", undefined, "Arrived")}
            value={String(orgRollup.arrivedHeads)}
          />
          <MetricCard
            label={t("console.boxOffice.metrics.checkedInEntries", undefined, "Checked-In Entries")}
            value={String(orgRollup.arrivedEntries)}
          />
        </div>

        <DataTable<(typeof rows)[number]>
          rows={rows}
          rowHref={(r) => `/studio/marketplace/box-office/${r.id}`}
          columns={[
            {
              key: "name",
              header: t("console.boxOffice.columns.name", undefined, "List"),
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "entries",
              header: t("console.boxOffice.columns.entries", undefined, "Entries"),
              render: (r) => String(r.totalEntries),
              accessor: (r) => r.totalEntries,
            },
            {
              key: "expected",
              header: t("console.boxOffice.columns.expected", undefined, "Expected"),
              render: (r) => String(r.expectedHeads),
              accessor: (r) => r.expectedHeads,
            },
            {
              key: "arrived",
              header: t("console.boxOffice.columns.arrived", undefined, "Arrived"),
              render: (r) => `${r.arrivedHeads} / ${r.expectedHeads}`,
              accessor: (r) => r.arrivedHeads,
            },
            {
              key: "created",
              header: t("console.boxOffice.columns.created", undefined, "Created"),
              render: (r) => timeAgo(r.created_at),
              accessor: (r) => r.created_at,
            },
          ]}
        />
      </div>
    </>
  );
}
