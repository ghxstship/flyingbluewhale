export const dynamic = "force-dynamic";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DetailShell, money } from "@/components/detail/DetailShell";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { getRequestT } from "@/lib/i18n/request";
import { deleteCrewMember } from "./edit/actions";

export default async function Page({ params }: { params: Promise<{ crewId: string }> }) {
  const { crewId } = await params;
  const session = await requireSession();
  const { t } = await getRequestT();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("crew_members")
    .select("id, name, role, email, phone, day_rate_cents, notes")
    .eq("org_id", session.orgId)
    .eq("id", crewId)
    .maybeSingle();

  // B-24: cross-link the people stores — when this crew member's email
  // matches an org member account, surface the person record so the two
  // directories reference each other instead of living in silos.
  let matchedUserId: string | null = null;
  if (row?.email) {
    const { data: member } = await supabase
      .from("memberships")
      .select("user_id, users!inner(email)")
      .eq("org_id", session.orgId)
      .ilike("users.email", row.email)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();
    matchedUserId = (member as { user_id: string } | null)?.user_id ?? null;
  }
  return (
    <DetailShell
      row={row}
      eyebrow={t("console.people.crew.detail.eyebrow", undefined, "People")}
      title={(r) => r.name}
      subtitle={(r) => r.role}
      breadcrumbs={[
        { label: t("console.people.crew.detail.breadcrumbs.people", undefined, "People") },
        { label: t("console.people.crew.detail.breadcrumbs.crew", undefined, "Crew"), href: "/studio/people/crew" },
        { label: row?.name ?? t("console.people.crew.detail.breadcrumbs.fallback", undefined, "Crew") },
      ]}
      fields={
        row
          ? [
              { label: t("console.people.crew.detail.fields.role", undefined, "Role"), value: row.role ?? "—" },
              { label: t("console.people.crew.detail.fields.email", undefined, "Email"), value: row.email ?? "—" },
              { label: t("console.people.crew.detail.fields.phone", undefined, "Phone"), value: row.phone ?? "—" },
              {
                label: t("console.people.crew.detail.fields.dayRate", undefined, "Day Rate"),
                value: money(row.day_rate_cents),
              },
              { label: t("console.people.crew.detail.fields.notes", undefined, "Notes"), value: row.notes ?? "—" },
            ]
          : undefined
      }
      action={
        row ? (
          <div className="flex items-center gap-2">
            {matchedUserId && (
              <Button href={`/studio/people/${matchedUserId}`} size="sm" variant="ghost">
                {t("console.people.crew.detail.viewPersonRecord", undefined, "View person record")}
              </Button>
            )}
            <Button href={`/studio/people/crew/${crewId}/edit`} size="sm" variant="secondary">
              {t("common.edit", undefined, "Edit")}
            </Button>
            <DeleteForm
              action={deleteCrewMember.bind(null, crewId)}
              confirm={t(
                "console.people.crew.detail.deleteConfirm",
                { name: row.name },
                `Delete crew member "${row.name}"? This cannot be undone.`,
              )}
            />
          </div>
        ) : undefined
      }
    />
  );
}
