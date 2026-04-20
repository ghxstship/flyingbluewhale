export const dynamic = "force-dynamic";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DetailShell, money, fmtDate } from "@/components/detail/DetailShell";


export default async function Page({ params }: { params: Promise<{ mileageId: string }> }) {
  const { mileageId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("mileage_logs")
    .select("id, origin, destination, miles, rate_cents, logged_on, notes, project_id, user_id")
    .eq("org_id", session.orgId)
    .eq("id", mileageId)
    .maybeSingle();
  return (
    <DetailShell
      row={row}
      eyebrow="Finance"
      title={(r) => `${r.origin} → ${r.destination}`}
      subtitle={(r) => `${r.miles} mi`}
      breadcrumbs={[{ label: "Finance", href: "/console/finance" }, { label: "Mileage", href: "/console/finance/mileage" }, { label: row ? `${row.origin} → ${row.destination}` : "Mileage" }]}
      fields={row ? [
        { label: "Miles", value: `${row.miles}` },
        { label: "Rate", value: money(row.rate_cents) },
        { label: "Total", value: money(Math.round(row.miles * row.rate_cents)) },
        { label: "Logged on", value: fmtDate(row.logged_on) },
        { label: "Notes", value: row.notes ?? "—" },
      ] : undefined}
    />
  );
}
