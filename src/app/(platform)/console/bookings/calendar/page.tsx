import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { STATUS_TONE } from "@/lib/marketplace";

export const dynamic = "force-dynamic";

type Hold = { id: string; tier: number; starts_at: string; ends_at: string; label: string | null; kind: string };
type Milestone = { id: string; kind: string; occurs_at: string; label: string | null; visibility: string };

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.bookings.calendar.eyebrow", undefined, "Bookings")}
          title={t("console.bookings.calendar.title", undefined, "Calendar")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.bookings.calendar.configureSupabase", undefined, "Configure Supabase.")}
          </div>
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
        eyebrow={t("console.bookings.calendar.eyebrow", undefined, "Bookings")}
        title={t("console.bookings.calendar.title", undefined, "Calendar")}
        subtitle={`${slots.length} ${slots.length === 1 ? t("console.bookings.calendar.slotSingular", undefined, "slot") : t("console.bookings.calendar.slotPlural", undefined, "slots")} · ${milestones.length} ${milestones.length === 1 ? t("console.bookings.calendar.milestoneSingular", undefined, "milestone") : t("console.bookings.calendar.milestonePlural", undefined, "milestones")}`}
      />
      <div className="page-content space-y-5">
        {items.length === 0 ? (
          <div className="surface p-6 text-sm text-[var(--p-text-2)]">
            {t("console.bookings.calendar.empty", undefined, "No upcoming holds or milestones.")}
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((it, i) => (
              <li key={i} className="surface flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  {it.kind === "slot" ? (
                    <Badge
                      variant={it.row.kind === "confirm" ? "success" : it.row.kind === "block" ? "error" : "warning"}
                    >
                      {it.row.kind === "hold"
                        ? t("console.bookings.calendar.tierHold", { tier: it.row.tier }, `T${it.row.tier} hold`)
                        : it.row.kind}
                    </Badge>
                  ) : (
                    <Badge variant={STATUS_TONE[it.row.kind] ?? "muted"}>{it.row.kind}</Badge>
                  )}
                  <span className="text-sm">{it.row.label ?? "—"}</span>
                </div>
                <span className="font-mono text-xs text-[var(--p-text-2)]">{new Date(it.date).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
