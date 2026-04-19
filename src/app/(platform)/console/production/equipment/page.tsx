import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import type { Equipment, EquipmentStatus } from "@/lib/supabase/types";

const STATUS_BG: Record<EquipmentStatus, "success"|"warning"|"info"|"muted"|"error"> = {
  available: "success", reserved: "info", in_use: "info",
  maintenance: "warning", retired: "muted",
};

export const dynamic = "force-dynamic";

export default async function EquipmentPage() {
  if (!hasSupabase) return <><ModuleHeader title="Equipment" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>;
  const session = await requireSession();
  const rows = await listOrgScoped("equipment", session.orgId, { orderBy: "name", ascending: true });
  const available = rows.filter((r) => r.status === "available").length;
  return (
    <>
      <ModuleHeader eyebrow="Production" title="Equipment" subtitle={`${rows.length} items · ${available} available`}
        action={<Button href="/console/production/equipment/new">+ Add equipment</Button>} />
      <div className="page-content">
        <DataTable<Equipment>
          rows={rows}
          columns={[
            { key: "name", header: "Name", render: (r) => r.name },
            { key: "category", header: "Category", render: (r) => r.category ?? "—", className: "font-mono text-xs" },
            { key: "tag", header: "Asset tag", render: (r) => r.asset_tag ?? "—", className: "font-mono text-xs" },
            { key: "status", header: "Status", render: (r) => <Badge variant={STATUS_BG[r.status]}>{r.status.replace("_"," ")}</Badge> },
            { key: "rate", header: "Daily rate", render: (r) => formatMoney(r.daily_rate_cents), className: "font-mono text-xs" },
          ]}
        />
      </div>
    </>
  );
}
