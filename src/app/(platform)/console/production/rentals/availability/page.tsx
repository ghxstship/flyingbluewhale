import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type EquipmentRow = {
  id: string;
  name: string;
  asset_tag: string | null;
  category: string | null;
  status: "available" | "reserved" | "in_use" | "maintenance" | "retired" | string;
};

type RentalRow = {
  id: string;
  equipment_id: string;
  starts_at: string;
  ends_at: string;
  project: { id: string; name: string } | null;
};

function inWindow(r: RentalRow, fromIso: string, toIso: string): boolean {
  return !(r.ends_at < fromIso || r.starts_at > toIso);
}

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Production · Rentals" title="Availability" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  // Window: today + next 7 days
  const now = new Date();
  const windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const windowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
  const fromIso = windowStart.toISOString();
  const toIso = windowEnd.toISOString();

  const [{ data: equipment }, { data: rentals }] = await Promise.all([
    supabase
      .from("equipment")
      .select("id, name, asset_tag, category, status")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .neq("status", "retired")
      .order("name", { ascending: true })
      .limit(500),
    supabase
      .from("rentals")
      .select("id, equipment_id, starts_at, ends_at, project:project_id(id, name)")
      .eq("org_id", session.orgId)
      .lte("starts_at", toIso)
      .gte("ends_at", fromIso)
      .order("starts_at", { ascending: true }),
  ]);

  const eqList = (equipment ?? []) as EquipmentRow[];
  const rentalList = ((rentals ?? []) as unknown as RentalRow[]).filter((r) => inWindow(r, fromIso, toIso));

  // Group rentals by equipment_id
  const rentalsByEq = new Map<string, RentalRow[]>();
  for (const r of rentalList) {
    if (!rentalsByEq.has(r.equipment_id)) rentalsByEq.set(r.equipment_id, []);
    rentalsByEq.get(r.equipment_id)!.push(r);
  }

  // Build a 7-day grid for each equipment row
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(new Date(now.getFullYear(), now.getMonth(), now.getDate() + i));
  }

  function statusForDay(eq: EquipmentRow, day: Date): "free" | "booked" | "blocked" {
    if (eq.status === "maintenance") return "blocked";
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).toISOString();
    const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1).toISOString();
    const list = rentalsByEq.get(eq.id) ?? [];
    return list.some((r) => inWindow(r, dayStart, dayEnd)) ? "booked" : "free";
  }

  // Roll-up: how many available now
  const availableNow = eqList.filter((e) => e.status === "available").length;
  const reservedNow = eqList.filter((e) => e.status === "reserved").length;
  const inUseNow = eqList.filter((e) => e.status === "in_use").length;

  return (
    <>
      <ModuleHeader
        eyebrow="Production · Rentals"
        title="Availability"
        subtitle={`${availableNow} available · ${reservedNow} reserved · ${inUseNow} in use`}
        action={
          <Button href="/console/production/rentals/new" size="sm">
            + New Rental
          </Button>
        }
      />
      <div className="page-content">
        {eqList.length === 0 ? (
          <EmptyState
            title="No Equipment to Show"
            description="Author equipment in /console/production/equipment, then bookings + availability surface here."
          />
        ) : (
          <div className="surface overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Status</th>
                  {days.map((d) => (
                    <th key={d.toISOString()} className="text-center text-xs">
                      {d.toLocaleDateString(undefined, { weekday: "short", month: "numeric", day: "numeric" })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {eqList.slice(0, 200).map((eq) => (
                  <tr key={eq.id}>
                    <td>
                      <div className="text-sm font-medium">{eq.name}</div>
                      <div className="font-mono text-[10px] text-[var(--text-muted)]">
                        {eq.asset_tag ?? "—"} {eq.category ? `· ${eq.category}` : ""}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={eq.status} />
                    </td>
                    {days.map((d) => {
                      const s = statusForDay(eq, d);
                      const tone = s === "free" ? "success" : s === "booked" ? "warning" : "error";
                      return (
                        <td key={d.toISOString()} className="text-center">
                          <Badge variant={tone}>{s}</Badge>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {eqList.length > 200 && (
              <p className="px-4 py-3 text-xs text-[var(--text-muted)]">
                Showing first 200 assets. Filter by category in /console/production/equipment for narrower views.
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
