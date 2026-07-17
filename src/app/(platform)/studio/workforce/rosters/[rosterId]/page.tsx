import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { can, requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { createClient } from "@/lib/supabase/server";
import { RosterShifts, type CrewOption, type ShiftRow } from "./RosterShifts";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { deleteRoster } from "./edit/actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ rosterId: string }> }) {
  const { t } = await getRequestT();
  const p = await params;
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={t("console.workforce.rosters.detail.title", undefined, "Record")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.workforce.rosters.detail.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const row = await getOrgScoped("rosters", session.orgId, p.rosterId);
  if (!row) notFound();
  const title = (row as Record<string, unknown>)["name"] as string | undefined;
  const dayOf = ((row as Record<string, unknown>)["day_of"] as string | undefined) ?? "";

  // The roster's shifts, and the crew who could work them. Before this the page
  // dumped Object.entries(row) as key/value pairs and showed no shifts at all —
  // a roster you could not put anybody on.
  const supabase = await createClient();
  const [{ data: shiftRows }, { data: crewRows }] = await Promise.all([
    supabase
      .from("shifts")
      .select("id, starts_at, ends_at, role, attendance, checked_in_at, crew:crew_member_id(name)")
      .eq("org_id", session.orgId)
      .eq("roster_id", p.rosterId)
      .order("starts_at", { ascending: true }),
    supabase
      .from("crew_members")
      .select("id, name, role")
      .eq("org_id", session.orgId)
      .eq("engagement_state", "active")
      .order("name", { ascending: true })
      .limit(500),
  ]);

  const shifts: ShiftRow[] = (shiftRows ?? []).map((r) => {
    const rec = r as unknown as Record<string, unknown>;
    const crewJoin = rec["crew"] as { name?: string } | null;
    return {
      id: String(rec["id"]),
      starts_at: String(rec["starts_at"]),
      ends_at: String(rec["ends_at"]),
      role: (rec["role"] as string | null) ?? null,
      attendance: String(rec["attendance"] ?? "scheduled"),
      checked_in_at: (rec["checked_in_at"] as string | null) ?? null,
      crew_name: crewJoin?.name ?? null,
    };
  });
  const crew: CrewOption[] = (crewRows ?? []).map((c) => {
    const rec = c as unknown as Record<string, unknown>;
    return { id: String(rec["id"]), name: String(rec["name"]), role: (rec["role"] as string | null) ?? null };
  });
  const canRoster = can(session, "schedule:write");

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.rosters.detail.eyebrow", undefined, "Record")}
        title={title ?? p.rosterId}
        action={
          <div className="flex items-center gap-2">
            <Button href="/studio/workforce/rosters" variant="ghost" size="sm">
              {t("console.workforce.rosters.detail.back", undefined, "Back")}
            </Button>
            <Button href={`/studio/workforce/rosters/${p.rosterId}/edit`} size="sm">
              {t("console.workforce.rosters.detail.edit", undefined, "Edit")}
            </Button>
            <DeleteForm
              action={deleteRoster.bind(null, p.rosterId)}
              confirm={t(
                "console.workforce.rosters.detail.deleteConfirm",
                undefined,
                "Delete this record? This cannot be undone.",
              )}
            />
          </div>
        }
      />
      <div className="page-content">
        <RosterShifts rosterId={p.rosterId} shifts={shifts} crew={crew} dayOf={dayOf} canRoster={canRoster} />
      </div>
    </>
  );
}
