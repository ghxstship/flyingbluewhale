import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClaimButton, WithdrawButton } from "./ClaimActions";

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
};

type Claim = {
  id: string;
  open_shift_id: string;
  claim_state: string;
};

export default async function OpenShiftsMobilePage() {
  if (!hasSupabase) {
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">Configure Supabase.</div>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const [{ data: shifts }, { data: myClaims }] = await Promise.all([
    supabase
      .from("open_shifts")
      .select("id, role, starts_at, ends_at, shift_state, max_claims, hourly_rate_cents, currency, description")
      .eq("org_id", session.orgId)
      .in("shift_state", ["open", "filled"])
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(100),
    supabase
      .from("open_shift_claims")
      .select("id, open_shift_id, claim_state")
      .eq("org_id", session.orgId)
      .eq("user_id", session.userId),
  ]);

  const shiftList = (shifts ?? []) as OpenShift[];
  const myClaimMap = new Map<string, Claim>(
    ((myClaims ?? []) as Claim[]).map((c) => [c.open_shift_id, c]),
  );

  const openShifts = shiftList.filter((s) => s.shift_state === "open");
  const filledShifts = shiftList.filter((s) => s.shift_state === "filled");

  function formatRate(s: OpenShift) {
    if (!s.hourly_rate_cents) return null;
    return `${(s.hourly_rate_cents / 100).toFixed(0)} ${s.currency}/hr`;
  }

  function ShiftCard({ shift }: { shift: OpenShift }) {
    const myClaim = myClaimMap.get(shift.id);
    const rate = formatRate(shift);

    return (
      <li className="surface-raised p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">{shift.role}</p>
            {rate && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{rate}</p>}
            <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">
              {fmt.dateParts(shift.starts_at, { weekday: "short", month: "short", day: "numeric" })}
              {" · "}
              {fmt.time(shift.starts_at)}–{fmt.time(shift.ends_at)}
            </p>
            {shift.description && (
              <p className="mt-1 line-clamp-2 text-xs text-[var(--text-secondary)]">{shift.description}</p>
            )}
          </div>
          <div className="shrink-0">
            {myClaim ? (
              <Badge
                variant={
                  myClaim.claim_state === "approved"
                    ? "success"
                    : myClaim.claim_state === "declined"
                      ? "error"
                      : myClaim.claim_state === "withdrawn"
                        ? "muted"
                        : "warning"
                }
              >
                {myClaim.claim_state}
              </Badge>
            ) : shift.shift_state === "filled" ? (
              <Badge variant="muted">filled</Badge>
            ) : null}
          </div>
        </div>

        {shift.shift_state === "open" && (
          <div className="mt-3">
            {!myClaim ? (
              <ClaimButton shiftId={shift.id} />
            ) : myClaim.claim_state === "pending" ? (
              <WithdrawButton claimId={myClaim.id} />
            ) : null}
          </div>
        )}
      </li>
    );
  }

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">
        Workforce
      </div>
      <h1 className="mt-1 text-2xl font-semibold">Open Shifts</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        {openShifts.length} available · tap to claim.
      </p>

      {shiftList.length === 0 ? (
        <div className="mt-8">
          <EmptyState size="compact" title="No Open Shifts" description="Check back later." />
        </div>
      ) : (
        <>
          {openShifts.length > 0 && (
            <section className="mt-6">
              <h2 className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
                Available
              </h2>
              <ul className="mt-3 space-y-2">
                {openShifts.map((s) => (
                  <ShiftCard key={s.id} shift={s} />
                ))}
              </ul>
            </section>
          )}

          {filledShifts.length > 0 && (
            <section className="mt-6">
              <h2 className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
                Recently Filled
              </h2>
              <ul className="mt-3 space-y-2">
                {filledShifts.map((s) => (
                  <ShiftCard key={s.id} shift={s} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
