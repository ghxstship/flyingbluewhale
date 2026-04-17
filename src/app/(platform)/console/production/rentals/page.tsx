import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatDate, formatMoney } from "@/lib/format";
import type { Rental } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function RentalsPage() {
  if (!hasSupabase) return <><ModuleHeader title="Rentals" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>;
  const session = await requireSession();
  const rows = await listOrgScoped("rentals", session.orgId, { orderBy: "starts_at" });
  return (
    <>
      <ModuleHeader eyebrow="Production" title="Rentals" subtitle={`${rows.length} active rentals`}
        action={<Button href="/console/production/rentals/new">+ New rental</Button>} />
      <div className="page-content">
        <DataTable<Rental>
          rows={rows}
          columns={[
            { key: "equipment_id", header: "Equipment", render: (r) => <span className="font-mono text-xs">{r.equipment_id.slice(0, 8)}</span> },
            { key: "starts", header: "Starts", render: (r) => formatDate(r.starts_at, "long"), className: "font-mono text-xs" },
            { key: "ends", header: "Ends", render: (r) => formatDate(r.ends_at, "long"), className: "font-mono text-xs" },
            { key: "rate", header: "Rate", render: (r) => formatMoney(r.rate_cents), className: "font-mono text-xs" },
          ]}
        />
      </div>
    </>
  );
}
