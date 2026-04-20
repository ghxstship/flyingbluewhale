export const dynamic = "force-dynamic";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DetailShell, money, fmtDate } from "@/components/detail/DetailShell";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default async function Page({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("fabrication_orders")
    .select("id, title, description, status, due_at, project_id")
    .eq("org_id", session.orgId)
    .eq("id", orderId)
    .maybeSingle();
  return (
    <DetailShell
      row={row}
      eyebrow="Production"
      title={(r) => r.title}
      subtitle={(r) => r.description}
      breadcrumbs={[{ label: "Production" }, { label: "Fabrication", href: "/console/production/fabrication" }, { label: row?.title ?? "Order" }]}
      fields={row ? [
        { label: "Status", value: <StatusBadge status={row.status} /> },
        { label: "Due", value: fmtDate(row.due_at) },
        { label: "Description", value: row.description ?? "—" },
      ] : undefined}
    />
  );
}
