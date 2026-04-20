export const dynamic = "force-dynamic";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DetailShell, money, fmtDate } from "@/components/detail/DetailShell";


export default async function Page({ params }: { params: Promise<{ reqId: string }> }) {
  const { reqId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("requisitions")
    .select("id, description, estimated_cents, project_id, created_at")
    .eq("org_id", session.orgId)
    .eq("id", reqId)
    .maybeSingle();
  return (
    <DetailShell
      row={row}
      eyebrow="Procurement"
      title={(r) => r.description ?? "Requisition"}
      subtitle={(r) => `${money(r.estimated_cents)}`}
      breadcrumbs={[{ label: "Procurement" }, { label: "Requisitions", href: "/console/procurement/requisitions" }, { label: row?.description ?? "Requisition" }]}
      fields={row ? [
        { label: "Estimated", value: money(row.estimated_cents) },
        { label: "Description", value: row.description ?? "—" },
        { label: "Created", value: fmtDate(row.created_at) },
      ] : undefined}
    />
  );
}
