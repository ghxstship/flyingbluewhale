export const dynamic = "force-dynamic";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DetailShell, money } from "@/components/detail/DetailShell";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { deleteCrewMember } from "./edit/actions";

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
      breadcrumbs={[
        { label: "People" },
        { label: "Crew", href: "/console/people/crew" },
        { label: row?.name ?? "Crew" },
      ]}
      fields={
        row
          ? [
              { label: "Role", value: row.role ?? "—" },
              { label: "Email", value: row.email ?? "—" },
              { label: "Phone", value: row.phone ?? "—" },
              { label: "Day Rate", value: money(row.day_rate_cents) },
              { label: "Notes", value: row.notes ?? "—" },
            ]
          : undefined
      }
      action={
        row ? (
          <div className="flex items-center gap-2">
            <Button href={`/console/people/crew/${crewId}/edit`} size="sm" variant="secondary">
              Edit
            </Button>
            <DeleteForm
              action={deleteCrewMember.bind(null, crewId)}
              confirm={`Delete crew member "${row.name}"? This cannot be undone.`}
            />
          </div>
        ) : undefined
      }
    />
  );
}
