import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import type { MileageLog } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function MileagePage() {
  if (!hasSupabase) return <><ModuleHeader title="Mileage" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>;
  const session = await requireSession();
  const rows = await listOrgScoped("mileage_logs", session.orgId, { orderBy: "logged_on" });
  const totalMiles = rows.reduce((s, r) => s + Number(r.miles), 0);
  const totalCents = rows.reduce((s, r) => s + Math.round(Number(r.miles) * Number(r.rate_cents)), 0);
  return (
    <>
      <ModuleHeader eyebrow="Finance" title="Mileage" subtitle={`${totalMiles.toFixed(1)} miles · ${formatMoney(totalCents)}`}
        action={<Button href="/console/finance/mileage/new">+ Log mileage</Button>} />
      <div className="page-content">
        <DataTable<MileageLog>
          rows={rows}
          columns={[
            { key: "origin", header: "Origin", render: (r) => r.origin },
            { key: "destination", header: "Destination", render: (r) => r.destination },
            { key: "miles", header: "Miles", render: (r) => Number(r.miles).toFixed(1), className: "font-mono text-xs" },
            { key: "reimbursement", header: "Reimbursement", render: (r) => formatMoney(Math.round(Number(r.miles) * Number(r.rate_cents))), className: "font-mono text-xs" },
            { key: "date", header: "Date", render: (r) => r.logged_on, className: "font-mono text-xs" },
          ]}
        />
      </div>
    </>
  );
}
