import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { acknowledgeAttendee, addAttendee, markConducted, removeAttendee } from "./actions";

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

const STATUS_TONE: Record<string, "muted" | "info" | "success"> = {
  scheduled: "info",
  conducted: "success",
  cancelled: "muted",
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
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title="Safety Briefing" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("safety_briefings")
    .select(
      "id, topic, status, scheduled_for, conducted_at, notes, briefer:briefer_id(name, email), project:project_id(id, name)",
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
        eyebrow="Safety · Briefings"
        title={row.topic}
        subtitle={`${fmt(row.scheduled_for)} · ${brieferName}`}
        breadcrumbs={[
          { label: "Safety", href: "/console/safety" },
          { label: "Briefings", href: "/console/safety/briefings" },
          { label: row.topic },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button href="/console/safety/briefings" variant="ghost" size="sm">
              Back
            </Button>
            {row.status === "scheduled" && (
              <form action={markConducted.bind(null, briefingId)}>
                <Button type="submit" size="sm">
                  Mark Conducted
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
              <h3 className="text-sm font-semibold">Status</h3>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {row.status === "scheduled"
                  ? "Awaiting toolbox talk. Mark conducted once the briefing is complete."
                  : row.status === "conducted"
                    ? `Conducted ${fmt(row.conducted_at)}.`
                    : "Cancelled — no further action required."}
              </p>
            </div>
            <Badge variant={STATUS_TONE[row.status] ?? "muted"}>{STATUS_LABEL[row.status] ?? row.status}</Badge>
          </div>
        </section>

        <dl className="surface grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <dt className="text-xs tracking-wide text-[var(--text-muted)] uppercase">Project</dt>
            <dd className="text-sm">{row.project?.name ?? "—"}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs tracking-wide text-[var(--text-muted)] uppercase">Briefer</dt>
            <dd className="text-sm">{brieferName}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs tracking-wide text-[var(--text-muted)] uppercase">Scheduled</dt>
            <dd className="font-mono text-xs">{fmt(row.scheduled_for)}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs tracking-wide text-[var(--text-muted)] uppercase">Conducted</dt>
            <dd className="font-mono text-xs">{fmt(row.conducted_at)}</dd>
          </div>
        </dl>

        {row.notes && (
          <section className="surface p-5">
            <h3 className="text-sm font-semibold">Notes</h3>
            <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--text-secondary)]">{row.notes}</p>
          </section>
        )}

        <section className="surface p-5">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-semibold">Attendance</h3>
            <span className="font-mono text-xs text-[var(--text-muted)]">
              {acknowledgedCount}/{attendees.length} acknowledged
            </span>
          </div>
          {attendees.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              No attendees recorded. Add org members or crew below — they sign in by acknowledging the briefing.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--border-subtle)] text-sm">
              {attendees.map((a) => {
                const who = a.user?.name ?? a.user?.email ?? a.crew?.name ?? "Unknown";
                return (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2">
                    <div>
                      <div className="font-medium">{who}</div>
                      {a.notes && <div className="text-xs text-[var(--text-muted)]">{a.notes}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      {a.acknowledged_at ? (
                        <Badge variant="success">Signed {new Date(a.acknowledged_at).toLocaleDateString()}</Badge>
                      ) : (
                        <form action={acknowledgeAttendee}>
                          <input type="hidden" name="briefingId" value={briefingId} />
                          <input type="hidden" name="attendeeId" value={a.id} />
                          <Button type="submit" size="sm" variant="secondary">
                            Sign In
                          </Button>
                        </form>
                      )}
                      <form action={removeAttendee}>
                        <input type="hidden" name="briefingId" value={briefingId} />
                        <input type="hidden" name="attendeeId" value={a.id} />
                        <Button type="submit" size="sm" variant="ghost">
                          Remove
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
            <select name="user_id" defaultValue="" className="input-base">
              <option value="">— Org member —</option>
              {orgMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name ?? m.email}
                </option>
              ))}
            </select>
            <select name="crew_member_id" defaultValue="" className="input-base">
              <option value="">— Crew member —</option>
              {crew.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name ?? c.id.slice(0, 8)}
                </option>
              ))}
            </select>
            <input name="notes" placeholder="Note (optional)" maxLength={500} className="input-base sm:col-span-2" />
            <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] sm:col-span-1">
              <input type="checkbox" name="acknowledged" value="true" />
              Mark already acknowledged
            </label>
            <div className="flex justify-end sm:col-span-1">
              <Button type="submit" size="sm" variant="secondary">
                Add Attendee
              </Button>
            </div>
          </form>
          <p className="mt-2 text-[10px] text-[var(--text-muted)]">
            Pick exactly one of org member or crew member — both nullable but the schema requires one to be set.
          </p>
        </section>
      </div>
    </>
  );
}
