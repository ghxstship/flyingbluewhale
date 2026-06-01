import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import Link from "next/link";

export const dynamic = "force-dynamic";

type OTRule = {
  id: string;
  name: string;
  daily_ot_after_hours: number;
  daily_dt_after_hours: number | null;
  weekly_ot_after_hours: number;
  ot_multiplier: number;
  dt_multiplier: number | null;
  seventh_day_rule: boolean;
  is_default: boolean;
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Settings" title="Overtime Rules" />
        <div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div>
      </>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();

  const { data: rules } = await supabase
    .from("overtime_rules")
    .select(
      "id, name, daily_ot_after_hours, daily_dt_after_hours, weekly_ot_after_hours, ot_multiplier, dt_multiplier, seventh_day_rule, is_default",
    )
    .eq("org_id", session.orgId)
    .order("is_default", { ascending: false })
    .order("name");

  const rows = (rules ?? []) as OTRule[];

  return (
    <>
      <ModuleHeader
        eyebrow="Settings"
        title="Overtime Rules"
        actions={<Button href="/console/settings/overtime-rules/new">New Rule</Button>}
      />
      <div className="page-content max-w-3xl space-y-4">
        <p className="text-sm text-[var(--text-secondary)]">
          Overtime rules automatically calculate regular, OT, and double-time minutes on time entries.
          Assign a rule to crew members in their profile. The default rule applies to everyone without a specific assignment.
        </p>

        {rows.length === 0 ? (
          <div className="surface p-8 text-center space-y-3">
            <p className="text-sm text-[var(--text-secondary)]">
              No overtime rules configured. Create one to auto-calculate OT on time entries.
            </p>
            <Button href="/console/settings/overtime-rules/new">Create first rule</Button>
          </div>
        ) : (
          <div className="surface divide-y divide-[var(--border-color)]">
            {rows.map((r) => (
              <div key={r.id} className="p-4 flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{r.name}</span>
                    {r.is_default && <Badge tone="info">Default</Badge>}
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    OT after {r.daily_ot_after_hours}h/day, {r.weekly_ot_after_hours}h/week · {r.ot_multiplier}×
                    {r.daily_dt_after_hours != null ? ` · DT after ${r.daily_dt_after_hours}h/day · ${r.dt_multiplier}×` : ""}
                    {r.seventh_day_rule ? " · 7th-day rule" : ""}
                  </p>
                </div>
                <Link href={`/console/settings/overtime-rules/${r.id}`} className="btn btn-ghost shrink-0 text-sm">
                  Edit
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
