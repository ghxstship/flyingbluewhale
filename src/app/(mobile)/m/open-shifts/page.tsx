import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { applyToOpenShift } from "./actions";

export const dynamic = "force-dynamic";

type Shift = {
  id: string;
  title: string;
  description: string | null;
  role: string | null;
  required_skills: string[];
  starts_at: string;
  ends_at: string;
  rate_cents: number | null;
  rate_currency: string;
  slots_total: number;
  slots_filled: number;
  org_name: string;
};

type Application = { open_shift_id: string; application_state: string };

export default async function OpenShiftsPage() {
  if (!hasSupabase) {
    return <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">Configure Supabase.</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const [{ data: rawShifts }, { data: myApps }] = await Promise.all([
    supabase
      .from("public_open_shifts" as "open_shifts")
      .select("id, title, description, role, required_skills, starts_at, ends_at, rate_cents, rate_currency, slots_total, slots_filled, org_name")
      .order("starts_at")
      .limit(50),
    supabase
      .from("open_shift_applications")
      .select("open_shift_id, application_state")
      .eq("user_id", session.userId),
  ]);

  const shifts = (rawShifts ?? []) as Shift[];
  const appMap = new Map<string, Application>((myApps ?? []).map((a) => [a.open_shift_id, a as Application]));

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">Open Shifts</div>
      <h1 className="mt-1 text-2xl font-semibold">Available Shifts</h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">{shifts.length} open {shifts.length === 1 ? "shift" : "shifts"}</p>

      {shifts.length === 0 ? (
        <EmptyState title="No open shifts" description="Check back later for available gigs." />
      ) : (
        <ul className="mt-5 space-y-3">
          {shifts.map((s) => {
            const app = appMap.get(s.id);
            const slotsLeft = s.slots_total - s.slots_filled;
            const filled = slotsLeft === 0;

            return (
              <li key={s.id} className="surface rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{s.title}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{s.org_name}{s.role ? ` · ${s.role}` : ""}</p>
                  </div>
                  {app ? (
                    <Badge variant={app.application_state === "accepted" ? "success" : app.application_state === "rejected" ? "error" : "warning"}>
                      {app.application_state}
                    </Badge>
                  ) : filled ? (
                    <Badge variant="muted">Filled</Badge>
                  ) : null}
                </div>

                <div className="mt-3 text-sm space-y-1">
                  <p className="text-[var(--text-muted)]">
                    📅 {fmt.date(s.starts_at)} · {fmt.time(s.starts_at)} – {fmt.time(s.ends_at)}
                  </p>
                  {s.rate_cents && (
                    <p className="text-[var(--text-muted)]">
                      💵 {(s.rate_cents / 100).toLocaleString("en-US", { style: "currency", currency: s.rate_currency })}
                    </p>
                  )}
                  {s.required_skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {s.required_skills.map((sk) => (
                        <span key={sk} className="px-2 py-0.5 rounded-full bg-[var(--surface-raised)] text-xs">{sk}</span>
                      ))}
                    </div>
                  )}
                </div>

                {!app && !filled && (
                  <form action={applyToOpenShift}>
                    <input type="hidden" name="openShiftId" value={s.id} />
                    <button
                      type="submit"
                      className="mt-3 w-full py-2 rounded-lg bg-[var(--org-primary)] text-white text-sm font-medium"
                    >
                      Apply
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
