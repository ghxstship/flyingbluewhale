export const dynamic = "force-dynamic";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DetailShell, money, fmtDate } from "@/components/detail/DetailShell";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default async function Page({ params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("leads")
    .select("id, name, email, phone, source, stage, estimated_value_cents, notes, assigned_to")
    .eq("org_id", session.orgId)
    .eq("id", dealId)
    .maybeSingle();
  return (
    <DetailShell
      row={row}
      eyebrow="Sales"
      title={(r) => r.name}
      subtitle={(r) => r.source}
      breadcrumbs={[{ label: "Sales" }, { label: "Pipeline", href: "/console/pipeline" }, { label: row?.name ?? "Deal" }]}
      fields={row ? [
        { label: "Stage", value: <StatusBadge status={row.stage} /> },
        { label: "Estimated value", value: money(row.estimated_value_cents) },
        { label: "Email", value: row.email ?? "—" },
        { label: "Phone", value: row.phone ?? "—" },
        { label: "Source", value: row.source ?? "—" },
        { label: "Notes", value: row.notes ?? "—" },
      ] : undefined}
    />
  );
}
