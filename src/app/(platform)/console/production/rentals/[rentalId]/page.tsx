export const dynamic = "force-dynamic";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DetailShell, money, fmtDate } from "@/components/detail/DetailShell";
import { fmtDateTime } from "@/components/detail/DetailShell";

export default async function Page({ params }: { params: Promise<{ rentalId: string }> }) {
  const { rentalId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("rentals")
    .select("id, equipment_id, project_id, starts_at, ends_at, rate_cents, notes")
    .eq("org_id", session.orgId)
    .eq("id", rentalId)
    .maybeSingle();
  return (
    <DetailShell
      row={row}
      eyebrow="Production"
      title={() => "Rental"}
      subtitle={(r) => r.notes}
      breadcrumbs={[{ label: "Production" }, { label: "Rentals", href: "/console/production/rentals" }, { label: "Rental" }]}
      fields={row ? [
        { label: "Starts", value: fmtDateTime(row.starts_at) },
        { label: "Ends", value: fmtDateTime(row.ends_at) },
        { label: "Rate", value: money(row.rate_cents) },
        { label: "Notes", value: row.notes ?? "—" },
      ] : undefined}
    />
  );
}
