export const dynamic = "force-dynamic";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DetailShell, money, fmtDate } from "@/components/detail/DetailShell";


export default async function Page({ params }: { params: Promise<{ vendorId: string }> }) {
  const { vendorId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("vendors")
    .select("id, name, category, contact_email, contact_phone, coi_expires_at, notes, payout_account_id")
    .eq("org_id", session.orgId)
    .eq("id", vendorId)
    .maybeSingle();
  return (
    <DetailShell
      row={row}
      eyebrow="Procurement"
      title={(r) => r.name}
      subtitle={(r) => r.category}
      breadcrumbs={[{ label: "Procurement" }, { label: "Vendors", href: "/console/procurement/vendors" }, { label: row?.name ?? "Vendor" }]}
      fields={row ? [
        { label: "Category", value: row.category ?? "—" },
        { label: "Contact email", value: row.contact_email ?? "—" },
        { label: "Contact phone", value: row.contact_phone ?? "—" },
        { label: "COI expires", value: fmtDate(row.coi_expires_at) },
        { label: "Stripe payout", value: row.payout_account_id ? "Connected" : "Not connected" },
        { label: "Notes", value: row.notes ?? "—" },
      ] : undefined}
    />
  );
}
