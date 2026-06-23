import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { acknowledgeAttendee, addAttendee, markConducted, removeAttendee } from "./actions";
import { toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  topic: string;
  status: string;
  scheduled_for: string;
  conducted_at: string | null;
  notes: string | null;
  briefer: { name: string | null; email: string | null } | null;
  project: { id: string; name: string | null } | null;
};

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Scheduled",
  conducted: "Conducted",
  cancelled: "Cancelled",
};

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Page({ params }: { params: Promise<{ briefingId: string }> }) {
  const { briefingId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title={t("console.safety.briefings.detail.title", undefined, "Safety Briefing")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.safety.briefings.detail.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("safety_briefings")
    .select(
      "id, topic, status:briefing_state, scheduled_for, conducted_at, notes, briefer:briefer_id(name, email), project:project_id(id, name)",
    )
    .eq("id", briefingId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  const row = data as unknown as Row | null;
  if (!row) notFound();

  const brieferName = row.briefer?.name ?? row.briefer?.email ?? "—";

  // Attendance roll — was orphaned in the schema until now. Without it
  // safety_briefings is just a calendar entry with no audit trail of
  // who was actually in the room.
  const [{ data: attendeesData }, { data: membersData }, { data: crewData }] = await Promise.all([
    supabase
      .from("safety_briefing_attendees")
      .select(
        "id, acknowledged_at, notes, signature_path, user_id, crew_member_id, user:users!safety_briefing_attendees_user_id_fkey(name, email), crew:crew_members!safety_briefing_attendees_crew_member_id_fkey(name)",
      )
      .eq("briefing_id", briefingId)
      .eq("org_id", session.orgId)
      .order("acknowledged_at", { ascending: true, nullsFirst: true }),
    supabase
      .from("memberships")
      .select("user_id, users:users!inner(id, name, email)")
      .eq("org_id", session.orgId)
      .is("deleted_at", null),
    supabase.from("crew_members").select("id, name").eq("org_id", session.orgId).order("name", { ascending: true }),
  ]);
  type Attendee = {
    id: string;
    acknowledged_at: string | null;
    notes: string | null;
    signature_path: string | null;
    user_id: string | null;
    crew_member_id: string | null;
    user: { name: string | null; email: string | null } | null;
    crew: { name: string | null } | null;
  };
  const attendees = (attendeesData ?? []) as unknown as Attendee[];
  const orgMembers = (
    (membersData ?? []) as unknown as Array<{ users: { id: string; name: string | null; email: string } | null }>
  )
    .map((m) => m.users)
    .filter((u): u is { id: string; name: string | null; email: string } => !!u)
    .sort((x, y) => (x.name ?? x.email).localeCompare(y.name ?? y.email));
  const crew = (crewData ?? []) as unknown as Array<{ id: string; name: string | null }>;
  const acknowledgedCount = attendees.filter((a) => a.acknowledged_at).length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.safety.briefings.detail.eyebrow", undefined, "Safety · Briefings")}
        title={row.topic}
        subtitle={`${fmt(row.scheduled_for)} · ${brieferName}`}
        breadcrumbs={[
          { label: t("console.safety.title", undefined, "Safety"), href: "/studio/safety" },
          { label: t("console.safety.briefings.title", undefined, "Briefings"), href: "/studio/safety/briefings" },
          { label: row.topic },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button href="/studio/safety/briefings" variant="ghost" size="sm">
              {t("common.back", undefined, "Back")}
            </Button>
            {row.status === "scheduled" && (
              <form action={markConducted.bind(null, briefingId)}>
                <Button type="submit" size="sm">
                  {t("console.safety.briefings.detail.markConducted", undefined, "Mark Conducted")}
                </Button>
              </form>
            )}
          </div>
        }
      />
      <div className="page-content max-w-3xl space-y-5">
        <section className="surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">
                {t("console.safety.briefings.detail.statusHeading", undefined, "Status")}
              </h3>
              <p className="mt-1 text-xs text-[var(--p-text-2)]">
                {row.status === "scheduled"
                  ? t(
                      "console.safety.briefings.detail.statusScheduled",
                      undefined,
                      "Awaiting toolbox talk. Mark conducted once the briefing is complete.",
                    )
                  : row.status === "conducted"
                    ? t(
                        "console.safety.briefings.detail.statusConducted",
                        { date: fmt(row.conducted_at) },
                        `Conducted ${fmt(row.conducted_at)}.`,
                      )
                    : t(
                        "console.safety.briefings.detail.statusCancelled",
                        undefined,
                        "Cancelled — no further action required.",
                      )}
              </p>
            </div>
            <Badge variant={toneFor(row.status)}>
              {row.status === "scheduled"
                ? t("console.safety.briefings.status.scheduled", undefined, "Scheduled")
                : row.status === "conducted"
                  ? t("console.safety.briefings.status.conducted", undefined, "Conducted")
                  : row.status === "cancelled"
                    ? t("console.safety.briefings.status.cancelled", undefined, "Cancelled")
                    : (STATUS_LABEL[row.status] ?? row.status)}
            </Badge>
          </div>
        </section>

        <dl className="surface grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <dt className="text-xs tracking-wide text-[var(--p-text-2)] uppercase">
              {t("console.safety.briefings.detail.project", undefined, "Project")}
            </dt>
            <dd className="text-sm">{row.project?.name ?? "—"}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs tracking-wide text-[var(--p-text-2)] uppercase">
              {t("console.safety.briefings.detail.briefer", undefined, "Briefer")}
            </dt>
            <dd className="text-sm">{brieferName}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs tracking-wide text-[var(--p-text-2)] uppercase">
              {t("console.safety.briefings.detail.scheduled", undefined, "Scheduled")}
            </dt>
            <dd className="font-mono text-xs">{fmt(row.scheduled_for)}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs tracking-wide text-[var(--p-text-2)] uppercase">
              {t("console.safety.briefings.detail.conducted", undefined, "Conducted")}
            </dt>
            <dd className="font-mono text-xs">{fmt(row.conducted_at)}</dd>
          </div>
        </dl>

        {row.notes && (
          <section className="surface p-5">
            <h3 className="text-sm font-semibold">{t("console.safety.briefings.detail.notes", undefined, "Notes")}</h3>
            <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--p-text-2)]">{row.notes}</p>
          </section>
        )}

        <section className="surface p-5">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-semibold">
              {t("console.safety.briefings.detail.attendance", undefined, "Attendance")}
            </h3>
            <span className="font-mono text-xs text-[var(--p-text-2)]">
              {t(
                "console.safety.briefings.detail.acknowledgedCount",
                { acknowledged: acknowledgedCount, total: attendees.length },
                `${acknowledgedCount}/${attendees.length} acknowledged`,
              )}
            </span>
          </div>
          {attendees.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t(
                "console.safety.briefings.detail.noAttendees",
                undefined,
                "No attendees recorded. Add org members or crew below — they sign in by acknowledging the briefing.",
              )}
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--border-subtle)] text-sm">
              {attendees.map((a) => {
                const who =
                  a.user?.name ??
                  a.user?.email ??
                  a.crew?.name ??
                  t("console.safety.briefings.detail.unknown", undefined, "Unknown");
                return (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2">
                    <div>
                      <div className="font-medium">{who}</div>
                      {a.notes && <div className="text-xs text-[var(--p-text-2)]">{a.notes}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      {a.acknowledged_at ? (
                        <Badge variant="success">
                          {t(
                            "console.safety.briefings.detail.signed",
                            { date: new Date(a.acknowledged_at).toLocaleDateString() },
                            `Signed ${new Date(a.acknowledged_at).toLocaleDateString()}`,
                          )}
                        </Badge>
                      ) : (
                        <form action={acknowledgeAttendee}>
                          <input type="hidden" name="briefingId" value={briefingId} />
                          <input type="hidden" name="attendeeId" value={a.id} />
                          <Button type="submit" size="sm" variant="secondary">
                            {t("console.safety.briefings.detail.signIn", undefined, "Sign In")}
                          </Button>
                        </form>
                      )}
                      <form action={removeAttendee}>
                        <input type="hidden" name="briefingId" value={briefingId} />
                        <input type="hidden" name="attendeeId" value={a.id} />
                        <Button type="submit" size="sm" variant="ghost">
                          {t("common.remove", undefined, "Remove")}
                        </Button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <form
            action={addAttendee}
            className="surface-inset mt-4 grid grid-cols-1 gap-2 rounded-md p-3 sm:grid-cols-2"
          >
            <input type="hidden" name="briefingId" value={briefingId} />
            <select name="user_id" defaultValue="" className="ps-input">
              <option value="">
                {t("console.safety.briefings.detail.orgMemberOption", undefined, "— Org member —")}
              </option>
              {orgMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name ?? m.email}
                </option>
              ))}
            </select>
            <select name="crew_member_id" defaultValue="" className="ps-input">
              <option value="">
                {t("console.safety.briefings.detail.crewMemberOption", undefined, "— Crew member —")}
              </option>
              {crew.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name ?? c.id.slice(0, 8)}
                </option>
              ))}
            </select>
            <input
              name="notes"
              placeholder={t("console.safety.briefings.detail.notePlaceholder", undefined, "Note · Optional")}
              maxLength={500}
              className="ps-input sm:col-span-2"
            />
            <label className="flex items-center gap-2 text-xs text-[var(--p-text-2)] sm:col-span-1">
              <input type="checkbox" name="acknowledged" value="true" />
              {t("console.safety.briefings.detail.markAcknowledged", undefined, "Mark already acknowledged")}
            </label>
            <div className="flex justify-end sm:col-span-1">
              <Button type="submit" size="sm" variant="secondary">
                {t("console.safety.briefings.detail.addAttendee", undefined, "Add Attendee")}
              </Button>
            </div>
          </form>
          <p className="mt-2 text-[10px] text-[var(--p-text-2)]">
            {t(
              "console.safety.briefings.detail.pickOneHint",
              undefined,
              "Pick exactly one of org member or crew member — both nullable but the schema requires one to be set.",
            )}
          </p>
        </section>
      </div>
    </>
  );
}
