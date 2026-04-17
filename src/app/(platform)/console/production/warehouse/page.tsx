import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { MetricCard } from "@/components/ui/MetricCard";

export const dynamic = "force-dynamic";

export default async function WarehousePage() {
  if (!hasSupabase) return <><ModuleHeader title="Warehouse" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>;
  const session = await requireSession();
  const equipment = await listOrgScoped("equipment", session.orgId);
  const byStatus = { available: 0, reserved: 0, in_use: 0, maintenance: 0, retired: 0 } as Record<string, number>;
  for (const e of equipment) byStatus[e.status]++;
  return (
    <>
      <ModuleHeader eyebrow="Production" title="Warehouse" subtitle="Inventory by status" />
      <div className="page-content">
        <div className="metric-grid-5">
          <MetricCard label="Available" value={byStatus.available} accent />
          <MetricCard label="Reserved" value={byStatus.reserved} />
          <MetricCard label="In use" value={byStatus.in_use} />
          <MetricCard label="Maintenance" value={byStatus.maintenance} />
          <MetricCard label="Retired" value={byStatus.retired} />
        </div>
      </div>
    </>
  );
}
