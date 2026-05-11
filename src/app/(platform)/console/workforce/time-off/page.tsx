import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { decideTimeOff } from "./actions";

export const dynamic = "force-dynamic";

type Req = {
  id: string;
  user_id: string;
  policy_id: string;
  starts_on: string;
  ends_on: string;
  hours_requested: number;
  request_state: string;
  reason: string | null;
  created_at: string;
};

export default async function TimeOffAdminPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Workforce" title="Time Off" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data: requests } = await supabase
    .from("time_off_requests")
    .select("id, user_id, policy_id, starts_on, ends_on, hours_requested, request_state, reason, created_at")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (requests ?? []) as Req[];
  const pending = rows.filter((r) => r.request_state === "pending");

  const policyIds = Array.from(new Set(rows.map((r) => r.policy_id)));
  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const [{ data: policies }, { data: users }] = await Promise.all([
    policyIds.length
      ? supabase.from("time_off_policies").select("id, name").in("id", policyIds)
      : Promise.resolve({ data: [] }),
    userIds.length ? supabase.from("users").select("id, email, name").in("id", userIds) : Promise.resolve({ data: [] }),
  ]);
  const policyMap = new Map(((policies ?? []) as Array<{ id: string; name: string }>).map((p) => [p.id, p.name]));
  const userMap = new Map(
    ((users ?? []) as unknown as Array<{ id: string; email: string; name: string | null }>).map((u) => [
      u.id,
      u.name ?? u.email,
    ]),
  );

  return (
    <>
      <ModuleHeader
        eyebrow="Workforce"
        title="Time Off"
        subtitle={`${pending.length} pending of ${rows.length} total`}
      />
      <div className="page-content space-y-4">
        {rows.length === 0 ? (
          <div className="surface p-6 text-sm">No time-off requests yet.</div>
        ) : (
          rows.map((r) => {
            const tone =
              r.request_state === "approved"
                ? "success"
                : r.request_state === "denied"
                  ? "error"
                  : r.request_state === "cancelled"
                    ? "muted"
                    : "info";
            return (
              <div key={r.id} className="surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge variant={tone}>{r.request_state}</Badge>
                    <h3 className="mt-2 text-sm font-semibold">{userMap.get(r.user_id) ?? "Unknown"}</h3>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {policyMap.get(r.policy_id) ?? "Policy"} · {r.hours_requested}h
                    </p>
                    <p className="font-mono text-xs text-[var(--text-muted)]">
                      {fmt.date(r.starts_on)} → {fmt.date(r.ends_on)}
                    </p>
                    {r.reason && <p className="mt-2 text-xs">{r.reason}</p>}
                  </div>
                  {r.request_state === "pending" && (
                    <div className="flex flex-col gap-2">
                      <form action={decideTimeOff}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="decision" value="approved" />
                        <Button type="submit" size="sm" className="w-full">Approve</Button>
                      </form>
                      <form action={decideTimeOff}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="decision" value="denied" />
                        <Button type="submit" size="sm" variant="secondary" className="w-full">Deny</Button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
