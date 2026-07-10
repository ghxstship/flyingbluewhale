export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DetailShell, fmtDate } from "@/components/detail/DetailShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { getRequestT } from "@/lib/i18n/request";
import { removePerson } from "./edit/actions";

export default async function Page({ params }: { params: Promise<{ personId: string }> }) {
  const { personId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  // Person = membership + user. personId is the user id. .is("deleted_at",
  // null) so an offboarded user isn't surfaced via the people detail page —
  // their membership is soft-deleted and shouldn't act as a live record.
  // Linked-record counts make the overview a hub, not a dead end: each
  // deep-links into the matching record tab declared in ./layout.tsx
  // (Assignments · Credentials · Time · Documents render via the
  // RecordTabsProvider → ModuleHeader RecordTabsSlot chain).
  const [{ data: row }, { count: assignmentCount }, { count: openTaskCount }] = await Promise.all([
    supabase
      .from("memberships")
      .select("id, role, created_at, users:users(id, name, email)")
      .eq("org_id", session.orgId)
      .eq("user_id", personId)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("assignments")
      .select("*", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("party_user_id", personId)
      .is("deleted_at", null),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("assigned_to", personId)
      .neq("task_state", "done"),
  ]);
  type Row = {
    id: string;
    role: string;
    created_at: string;
    users: { id: string; name: string | null; email: string } | null;
  };
  const typed = row as unknown as Row | null;
  return (
    <DetailShell
      row={typed}
      eyebrow={t("console.people.detail.eyebrow", undefined, "People")}
      title={(r) => r.users?.name ?? r.users?.email ?? t("console.people.detail.fallbackTitle", undefined, "Member")}
      subtitle={(r) => r.users?.email}
      breadcrumbs={[
        { label: t("console.people.detail.breadcrumbs.people", undefined, "People") },
        { label: t("console.people.detail.breadcrumbs.directory", undefined, "Directory"), href: "/studio/people" },
        {
          label:
            typed?.users?.name ?? typed?.users?.email ?? t("console.people.detail.fallbackTitle", undefined, "Member"),
        },
      ]}
      fields={
        typed
          ? [
              {
                label: t("console.people.detail.fields.role", undefined, "Role"),
                value: <Badge variant="brand">{typed.role}</Badge>,
              },
              { label: t("console.people.detail.fields.email", undefined, "Email"), value: typed.users?.email ?? "—" },
              {
                label: t("console.people.detail.fields.joined", undefined, "Joined"),
                value: fmtDate(typed.created_at),
              },
              {
                label: t("console.people.detail.fields.assignments", undefined, "Assignments"),
                value: (
                  <Link href={`/studio/people/${personId}/assignments`} className="hover:underline">
                    {assignmentCount ?? 0}{" "}
                    <span className="text-xs text-[var(--p-text-2)]">
                      {t("console.people.detail.fields.viewAll", undefined, "View all")}
                    </span>
                  </Link>
                ),
              },
              {
                label: t("console.people.detail.fields.openTasks", undefined, "Open tasks"),
                value: openTaskCount ?? 0,
              },
            ]
          : undefined
      }
      action={
        typed ? (
          <div className="flex items-center gap-2">
            <Button href={`/studio/people/${personId}/edit`} size="sm" variant="secondary">
              {t("console.people.detail.editRole", undefined, "Edit role")}
            </Button>
            <DeleteForm
              action={removePerson.bind(null, personId)}
              confirm={t(
                "console.people.detail.removeConfirm",
                {
                  name:
                    typed.users?.name ??
                    typed.users?.email ??
                    t("console.people.detail.thisMember", undefined, "this member"),
                },
                `Remove ${typed.users?.name ?? typed.users?.email ?? "this member"} from the organization? Their account remains.`,
              )}
              label={t("console.people.detail.remove", undefined, "Remove")}
            />
          </div>
        ) : undefined
      }
    />
  );
}
