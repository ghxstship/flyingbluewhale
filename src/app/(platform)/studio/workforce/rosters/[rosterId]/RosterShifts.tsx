"use client";

import { FormShell } from "@/components/FormShell";
import { DeleteForm } from "@/components/DeleteForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { addShift, removeShift } from "./shifts/actions";

export type CrewOption = { id: string; name: string; role: string | null };
export type ShiftRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  role: string | null;
  attendance: string;
  checked_in_at: string | null;
  crew_name: string | null;
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  });

/**
 * The roster's shifts, and the form that creates one.
 *
 * This is the first place in the product that can put a person on a shift.
 * `shifts` had readers everywhere and no writer at all, which is why
 * /m/schedule was empty for every user and why shift-derived capability grants
 * had nothing to derive from (ADR-0015 Addendum 2, Phase C).
 */
export function RosterShifts({
  rosterId,
  shifts,
  crew,
  dayOf,
  canRoster,
}: {
  rosterId: string;
  shifts: ShiftRow[];
  crew: CrewOption[];
  dayOf: string;
  canRoster: boolean;
}) {
  // Default both ends to the roster's own day, so the common case is two time
  // edits rather than four date-and-time edits.
  const defaultStart = `${dayOf}T09:00`;
  const defaultEnd = `${dayOf}T17:00`;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-sm font-semibold">Shifts on this roster</h2>
        {shifts.length === 0 ? (
          <EmptyState
            title="Nobody is rostered yet"
            description="Add a shift below to put someone on this roster. They will see it in COMPVSS on their phone."
          />
        ) : (
          <ul className="surface divide-y divide-[var(--p-border)]">
            {shifts.map((s) => (
              <li key={s.id} className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{s.crew_name ?? "Unassigned"}</div>
                  <div className="text-xs text-[var(--p-text-2)]">
                    {fmt(s.starts_at)} to {fmt(s.ends_at)}
                    {s.role ? ` · ${s.role}` : ""}
                  </div>
                </div>
                <span className="ps-badge ps-badge--neutral">{s.attendance}</span>
                {canRoster && !s.checked_in_at && (
                  <DeleteForm
                    action={removeShift.bind(null, rosterId, s.id)}
                    confirm="Remove this shift from the roster?"
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {canRoster && (
        <section>
          <h2 className="mb-3 text-sm font-semibold">Add a shift</h2>
          {crew.length === 0 ? (
            <EmptyState
              title="No crew to roster"
              description="Add people under People, Crew before building this roster."
              action={
                <Button href="/studio/people/crew/new" size="sm">
                  Add crew
                </Button>
              }
            />
          ) : (
            <FormShell
              action={addShift.bind(null, rosterId)}
              submitLabel="Add shift"
              cancelHref={`/studio/workforce/rosters/${rosterId}`}
            >
              <div className="fld">
                <label className="wl" htmlFor="crew_member_id">
                  Who is working
                </label>
                <select id="crew_member_id" name="crew_member_id" className="ps-input w-full" required>
                  <option value="">Pick someone…</option>
                  {crew.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.role ? ` · ${c.role}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="fld">
                  <label className="wl" htmlFor="starts_at">
                    Starts
                  </label>
                  <input
                    id="starts_at"
                    name="starts_at"
                    type="datetime-local"
                    className="ps-input w-full"
                    defaultValue={defaultStart}
                    required
                  />
                </div>
                <div className="fld">
                  <label className="wl" htmlFor="ends_at">
                    Ends
                  </label>
                  <input
                    id="ends_at"
                    name="ends_at"
                    type="datetime-local"
                    className="ps-input w-full"
                    defaultValue={defaultEnd}
                    required
                  />
                </div>
              </div>
              <div className="fld">
                <label className="wl" htmlFor="role">
                  Role on this shift
                </label>
                <input
                  id="role"
                  name="role"
                  className="ps-input w-full"
                  placeholder="e.g. Warehouse"
                  defaultValue=""
                />
                <p className="mt-1 text-xs text-[var(--p-text-2)]">
                  Optional. Use this when someone is covering a role that is not their usual one.
                </p>
              </div>
            </FormShell>
          )}
        </section>
      )}
    </div>
  );
}
