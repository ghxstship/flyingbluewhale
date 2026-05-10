import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { STATUS_TONE } from "@/lib/marketplace";

export const dynamic = "force-dynamic";

type Hold = { id: string; tier: number; starts_at: string; ends_at: string; label: string | null; kind: string };
type Milestone = { id: string; kind: string; occurs_at: string; label: string | null; visibility: string };

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Bookings" title="Calendar" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const [slotsResp, milestonesResp] = await Promise.all([
    supabase
      .from("availability_slots")
      .select("id, tier, starts_at, ends_at, label, kind")
      .eq("user_id", session.userId)
      .order("starts_at", { ascending: true })
      .limit(200),
    supabase
      .from("event_milestones")
      .select("id, kind, occurs_at, label, visibility")
      .eq("org_id", session.orgId)
      .gte("occurs_at", new Date(Date.now() - 7 * 86_400_000).toISOString())
      .order("occurs_at", { ascending: true })
      .limit(200),
  ]);
  const slots = (slotsResp.data ?? []) as Hold[];
  const milestones = (milestonesResp.data ?? []) as Milestone[];

  type Item = { kind: "slot"; date: string; row: Hold } | { kind: "milestone"; date: string; row: Milestone };

  const items: Item[] = [
    ...slots.map((r) => ({ kind: "slot" as const, date: r.starts_at, row: r })),
    ...milestones.map((r) => ({ kind: "milestone" as const, date: r.occurs_at, row: r })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <ModuleHeader
        eyebrow="Bookings"
        title="Calendar"
        subtitle={`${slots.length} slot${slots.length === 1 ? "" : "s"} · ${milestones.length} milestone${milestones.length === 1 ? "" : "s"}`}
      />
      <div className="page-content space-y-5">
        {items.length === 0 ? (
          <div className="surface p-6 text-sm text-[var(--text-secondary)]">No upcoming holds or milestones.</div>
        ) : (
          <ul className="space-y-2">
            {items.map((it, i) => (
              <li key={i} className="surface flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  {it.kind === "slot" ? (
                    <Badge
                      variant={it.row.kind === "confirm" ? "success" : it.row.kind === "block" ? "error" : "warning"}
                    >
                      {it.row.kind === "hold" ? `T${it.row.tier} hold` : it.row.kind}
                    </Badge>
                  ) : (
                    <Badge variant={STATUS_TONE[it.row.kind] ?? "muted"}>{it.row.kind}</Badge>
                  )}
                  <span className="text-sm">{it.row.label ?? "—"}</span>
                </div>
                <span className="font-mono text-xs text-[var(--text-secondary)]">
                  {new Date(it.date).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
