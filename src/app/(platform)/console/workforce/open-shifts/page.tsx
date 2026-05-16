import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { OpenShiftForm } from "./OpenShiftForm";
import { DecideClaimButton, CancelShiftButton } from "./ShiftActions";

export const dynamic = "force-dynamic";

type OpenShift = {
  id: string;
  role: string;
  starts_at: string;
  ends_at: string;
  shift_state: string;
  max_claims: number;
  hourly_rate_cents: number | null;
  currency: string;
  description: string | null;
  created_at: string;
};

type Claim = {
  id: string;
  open_shift_id: string;
  user_id: string;
  claim_state: string;
  note: string | null;
  created_at: string;
};

const STATE_TONE: Record<string, "muted" | "success" | "warning" | "error" | "info"> = {
  open: "info",
  filled: "success",
  cancelled: "error",
  expired: "muted",
};

const CLAIM_TONE: Record<string, "muted" | "success" | "warning" | "error" | "info"> = {
  pending: "warning",
  approved: "success",
  declined: "error",
  withdrawn: "muted",
};

export default async function OpenShiftsPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Workforce" title="Open Shifts" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const [{ data: shifts }, { data: claims }] = await Promise.all([
    supabase
      .from("open_shifts")
      .select("id, role, starts_at, ends_at, shift_state, max_claims, hourly_rate_cents, currency, description, created_at")
      .eq("org_id", session.orgId)
      .order("starts_at", { ascending: true })
      .limit(200),
    supabase
      .from("open_shift_claims")
      .select("id, open_shift_id, user_id, claim_state, note, created_at")
      .eq("org_id", session.orgId)
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  const shiftList = (shifts ?? []) as OpenShift[];
  const claimList = (claims ?? []) as Claim[];

  const claimsByShift = new Map<string, Claim[]>();
  for (const c of claimList) {
    const arr = claimsByShift.get(c.open_shift_id) ?? [];
    arr.push(c);
    claimsByShift.set(c.open_shift_id, arr);
  }

  const openCount = shiftList.filter((s) => s.shift_state === "open").length;
  const pendingCount = claimList.filter((c) => c.claim_state === "pending").length;

  return (
    <>
      <ModuleHeader
        eyebrow="Workforce"
        title="Open Shifts"
        subtitle={`${openCount} open · ${pendingCount} pending claim${pendingCount === 1 ? "" : "s"}`}
      />
      <div className="page-content max-w-5xl space-y-6">
        {/* Post new shift */}
        <section className="surface p-5">
          <h3 className="text-sm font-semibold">Post an Open Shift</h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Crew on COMPVSS will be notified and can self-claim. You approve or decline each application.
          </p>
          <div className="mt-4">
            <OpenShiftForm />
          </div>
        </section>

        {/* Shift list */}
        {shiftList.length === 0 ? (
          <EmptyState title="No open shifts yet" description="Post a shift above and crew will be notified instantly." />
        ) : (
          <section className="space-y-4">
            {shiftList.map((shift) => {
              const shiftClaims = claimsByShift.get(shift.id) ?? [];
              const pendingClaims = shiftClaims.filter((c) => c.claim_state === "pending");
              const rate = shift.hourly_rate_cents
                ? `${(shift.hourly_rate_cents / 100).toFixed(0)} ${shift.currency}/hr`
                : null;

              return (
                <div key={shift.id} className="surface overflow-hidden">
                  <div className="flex items-start justify-between gap-4 border-b border-[var(--border-color)] px-5 py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{shift.role}</span>
                        {rate && (
                          <span className="text-xs text-[var(--text-muted)]">{rate}</span>
                        )}
                      </div>
                      <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">
                        {fmt.dateParts(shift.starts_at, { weekday: "short", month: "short", day: "numeric" })}
                        {" · "}
                        {fmt.time(shift.starts_at)} – {fmt.time(shift.ends_at)}
                      </p>
                      {shift.description && (
                        <p className="mt-1 text-xs text-[var(--text-secondary)]">{shift.description}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant={STATE_TONE[shift.shift_state] ?? "muted"}>{shift.shift_state}</Badge>
                      <span className="text-xs text-[var(--text-muted)]">
                        {shiftClaims.length}/{shift.max_claims} claim{shift.max_claims === 1 ? "" : "s"}
                      </span>
                      {shift.shift_state === "open" && (
                        <CancelShiftButton shiftId={shift.id} />
                      )}
                    </div>
                  </div>

                  {shiftClaims.length > 0 ? (
                    <table className="data-table w-full text-xs">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Note</th>
                          <th>Submitted</th>
                          <th>Status</th>
                          {pendingClaims.length > 0 && <th className="text-end">Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {shiftClaims.map((c) => (
                          <tr key={c.id}>
                            <td className="font-mono">{c.user_id.slice(0, 8)}…</td>
                            <td>{c.note ?? "—"}</td>
                            <td className="font-mono">
                              {fmt.dateParts(c.created_at, { month: "short", day: "numeric" })}
                            </td>
                            <td>
                              <Badge variant={CLAIM_TONE[c.claim_state] ?? "muted"}>{c.claim_state}</Badge>
                            </td>
                            {pendingClaims.length > 0 && (
                              <td className="text-end">
                                {c.claim_state === "pending" && (
                                  <DecideClaimButton claimId={c.id} />
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="px-5 py-3 text-xs text-[var(--text-muted)]">No claims yet.</p>
                  )}
                </div>
              );
            })}
          </section>
        )}
      </div>
    </>
  );
}
