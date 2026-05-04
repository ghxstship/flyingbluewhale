import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney, formatDate } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  starts_at: string;
  ends_at: string;
  rate_cents: number | null;
  notes: string | null;
  project_id: string | null;
};

export default async function Page({ params }: { params: Promise<{ equipmentId: string }> }) {
  const { equipmentId } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("rentals")
    .select("id,starts_at,ends_at,rate_cents,notes,project_id")
    .eq("org_id", session.orgId)
    .eq("equipment_id", equipmentId)
    .order("starts_at", { ascending: false });
  const rows = (data ?? []) as Row[];

  return (
    <>
      <ModuleHeader eyebrow="Equipment" title="Rentals" subtitle="Booking history for this asset." />
      <div className="page-content">
        <DataTable<Row>
          rows={rows}
          emptyLabel="No Rentals"
          emptyDescription="No rentals recorded against this equipment yet."
          columns={[
            {
              key: "starts_at",
              header: "Starts",
              render: (r) => formatDate(r.starts_at),
              accessor: (r) => r.starts_at,
              mono: true,
              sortable: true,
            },
            {
              key: "ends_at",
              header: "Ends",
              render: (r) => formatDate(r.ends_at),
              accessor: (r) => r.ends_at,
              mono: true,
              sortable: true,
            },
            {
              key: "rate_cents",
              header: "Day Rate",
              render: (r) => (r.rate_cents != null ? formatMoney(r.rate_cents) : "—"),
              accessor: (r) => r.rate_cents ?? 0,
              tabular: true,
              sortable: true,
              className: "text-right",
              headerClassName: "text-right",
            },
            { key: "notes", header: "Notes", render: (r) => r.notes ?? "—", accessor: (r) => r.notes ?? "" },
          ]}
        />
      </div>
    </>
  );
}
