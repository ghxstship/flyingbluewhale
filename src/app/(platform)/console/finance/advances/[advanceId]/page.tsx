export const dynamic = "force-dynamic";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DetailShell, money, fmtDate } from "@/components/detail/DetailShell";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default async function Page({ params }: { params: Promise<{ advanceId: string }> }) {
  const { advanceId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("advances")
    .select("id, amount_cents, currency, status, reason, requested_at, decided_at, project_id, requester_id")
    .eq("org_id", session.orgId)
    .eq("id", advanceId)
    .maybeSingle();
  return (
    <DetailShell
      row={row}
      eyebrow="Finance"
      title={(r) => `Advance · ${money(r.amount_cents)}`}
      subtitle={(r) => r.reason}
      breadcrumbs={[
        { label: "Finance", href: "/console/finance" },
        { label: "Advances", href: "/console/finance/advances" },
        { label: row ? money(row.amount_cents) : "Advance" },
      ]}
      fields={row ? [
        { label: "Status", value: <StatusBadge status={row.status ?? "pending"} /> },
        { label: "Amount", value: money(row.amount_cents) },
        { label: "Currency", value: row.currency },
        { label: "Requested", value: fmtDate(row.requested_at) },
        { label: "Decided", value: fmtDate(row.decided_at) },
        { label: "Reason", value: row.reason ?? "—" },
      ] : undefined}
    />
  );
}
