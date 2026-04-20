export const dynamic = "force-dynamic";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DetailShell, money, fmtDate } from "@/components/detail/DetailShell";


export default async function Page({ params }: { params: Promise<{ crewId: string }> }) {
  const { crewId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("crew_members")
    .select("id, name, role, email, phone, day_rate_cents, notes")
    .eq("org_id", session.orgId)
    .eq("id", crewId)
    .maybeSingle();
  return (
    <DetailShell
      row={row}
      eyebrow="People"
      title={(r) => r.name}
      subtitle={(r) => r.role}
      breadcrumbs={[{ label: "People" }, { label: "Crew", href: "/console/people/crew" }, { label: row?.name ?? "Crew" }]}
      fields={row ? [
        { label: "Role", value: row.role ?? "—" },
        { label: "Email", value: row.email ?? "—" },
        { label: "Phone", value: row.phone ?? "—" },
        { label: "Day rate", value: money(row.day_rate_cents) },
        { label: "Notes", value: row.notes ?? "—" },
      ] : undefined}
    />
  );
}
