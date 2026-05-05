import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { hasSupabase } from "@/lib/env";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { addAvailabilityAction, deleteAvailabilityAction } from "./actions";

export const dynamic = "force-dynamic";

type Slot = {
  id: string;
  kind: string;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  label: string | null;
};

export default async function Page() {
  if (!hasSupabase) {
    return <div>Configure Supabase.</div>;
  }
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { data } = await supabase
    .from("availability_slots")
    .select("id, kind, starts_at, ends_at, all_day, label")
    .eq("user_id", session.userId)
    .order("starts_at", { ascending: true })
    .limit(200);
  const slots = (data ?? []) as Slot[];

  return (
    <div className="space-y-6">
      <header>
        <div className="text-label text-[var(--color-text-tertiary)]">Availability</div>
        <h1 className="text-display mt-1 text-3xl">Booking Calendar</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Holds, confirms, and blocks. Booking surfaces (gigs, talent offers) read from here when checking your fit.
        </p>
      </header>

      <section className="card-elevated p-4">
        <h2 className="text-label mb-3 text-[var(--color-text-tertiary)]">Add slot</h2>
        <FormShell action={addAvailabilityAction} submitLabel="Add">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Kind</label>
              <select name="kind" className="input-base mt-1.5 w-full" defaultValue="hold">
                <option value="hold">Hold (auto-release on TTL)</option>
                <option value="confirm">Confirm (locked)</option>
                <option value="block">Block (unavailable)</option>
              </select>
            </div>
            <Input label="Label" name="label" placeholder="MMW26 deck build" />
            <Input label="Starts" name="starts_at" type="datetime-local" required />
            <Input label="Ends" name="ends_at" type="datetime-local" required />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="all_day" /> All-day
          </label>
        </FormShell>
      </section>

      <section>
        <h2 className="text-label mb-3 text-[var(--color-text-tertiary)]">Upcoming</h2>
        {slots.length === 0 ? (
          <div className="card-elevated p-6 text-sm text-[var(--color-text-secondary)]">No availability slots yet.</div>
        ) : (
          <ul className="space-y-2">
            {slots.map((s) => (
              <li key={s.id} className="card-elevated flex items-center justify-between p-3 text-sm">
                <div>
                  <Badge variant={s.kind === "confirm" ? "success" : s.kind === "block" ? "error" : "warning"}>
                    {s.kind}
                  </Badge>
                  <span className="ml-3 font-mono text-xs">
                    {new Date(s.starts_at).toLocaleString()} → {new Date(s.ends_at).toLocaleString()}
                  </span>
                  {s.label && <span className="ml-3">{s.label}</span>}
                </div>
                <form
                  action={async (fd) => {
                    "use server";
                    await deleteAvailabilityAction(null, fd);
                  }}
                >
                  <input type="hidden" name="slot_id" value={s.id} />
                  <button type="submit" className="btn btn-ghost text-xs">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
