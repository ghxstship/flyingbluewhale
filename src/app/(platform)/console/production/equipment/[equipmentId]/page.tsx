export const dynamic = "force-dynamic";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DetailShell, money, fmtDate } from "@/components/detail/DetailShell";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default async function Page({ params }: { params: Promise<{ equipmentId: string }> }) {
  const { equipmentId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("equipment")
    .select("id, name, category, asset_tag, serial, status, daily_rate_cents, location_id, notes")
    .eq("org_id", session.orgId)
    .eq("id", equipmentId)
    .maybeSingle();
  return (
    <DetailShell
      row={row}
      eyebrow="Production"
      title={(r) => r.name}
      subtitle={(r) => r.category}
      breadcrumbs={[{ label: "Production" }, { label: "Equipment", href: "/console/production/equipment" }, { label: row?.name ?? "Equipment" }]}
      fields={row ? [
        { label: "Status", value: <StatusBadge status={row.status} /> },
        { label: "Category", value: row.category ?? "—" },
        { label: "Asset tag", value: row.asset_tag ?? "—" },
        { label: "Serial", value: row.serial ?? "—" },
        { label: "Daily rate", value: money(row.daily_rate_cents) },
        { label: "Notes", value: row.notes ?? "—" },
      ] : undefined}
    />
  );
}
