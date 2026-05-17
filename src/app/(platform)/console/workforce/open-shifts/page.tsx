import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

const STATE_TONE: Record<string, "success" | "info" | "warning" | "muted" | "error"> = {
  draft: "muted",
  open: "success",
  closed: "info",
  cancelled: "error",
};

type Row = {
  id: string;
  title: string;
  role: string | null;
  starts_at: string;
  ends_at: string;
  slots_total: number;
  slots_filled: number;
  shift_state: string;
  is_public: boolean;
  rate_cents: number | null;
  rate_currency: string;
};

export default async function OpenShiftsConsolePage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Workforce" title="Open Shifts" />
        <div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("open_shifts")
    .select("id, title, role, starts_at, ends_at, slots_total, slots_filled, shift_state, is_public, rate_cents, rate_currency")
    .eq("org_id", session.orgId)
    .order("starts_at", { ascending: false })
    .limit(200);

  const shifts = (data ?? []) as Row[];

  const openCount = shifts.filter((s) => s.shift_state === "open").length;
  const filledSlots = shifts.reduce((sum, s) => sum + s.slots_filled, 0);
  const totalSlots = shifts.reduce((sum, s) => sum + s.slots_total, 0);

  return (
    <>
      <ModuleHeader
        eyebrow="Workforce"
        title="Open Shifts"
        subtitle="Rentman Job Board parity — post and manage open crew slots"
        action={
          <Link
            href="/console/workforce/open-shifts/new"
            className="btn-primary text-sm px-4 py-2"
          >
            + Post shift
          </Link>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid">
          <div className="surface p-4 rounded-xl">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Open shifts</p>
            <p className="mt-1 text-3xl font-bold">{openCount}</p>
          </div>
          <div className="surface p-4 rounded-xl">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Slots filled</p>
            <p className="mt-1 text-3xl font-bold">{filledSlots}<span className="text-base font-normal text-[var(--text-muted)]"> / {totalSlots}</span></p>
          </div>
          <div className="surface p-4 rounded-xl">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Total postings</p>
            <p className="mt-1 text-3xl font-bold">{shifts.length}</p>
          </div>
        </div>

        <div className="surface rounded-xl overflow-hidden">
          {shifts.length === 0 ? (
            <EmptyState
              title="No open shifts posted"
              description="Post your first open shift and let qualified crew apply directly."
              action={<Link href="/console/workforce/open-shifts/new" className="btn-primary text-sm px-4 py-2">Post a shift</Link>}
            />
          ) : (
            <div className="data-table">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left">Title</th>
                    <th className="text-left">Role</th>
                    <th className="text-left">Date</th>
                    <th className="text-left">Slots</th>
                    <th className="text-left">State</th>
                    <th className="text-left">Public</th>
                  </tr>
                </thead>
                <tbody>
                  {shifts.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <Link href={`/console/workforce/open-shifts/${s.id}`} className="hover:underline font-medium">
                          {s.title}
                        </Link>
                      </td>
                      <td className="text-[var(--text-muted)]">{s.role ?? "—"}</td>
                      <td className="text-[var(--text-muted)]">{fmt.date(s.starts_at)}</td>
                      <td>{s.slots_filled} / {s.slots_total}</td>
                      <td><Badge variant={STATE_TONE[s.shift_state] ?? "muted"}>{s.shift_state}</Badge></td>
                      <td>{s.is_public ? <Badge variant="info">Public</Badge> : <span className="text-[var(--text-muted)]">Private</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
