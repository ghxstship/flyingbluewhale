import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string;
  center_lat: number;
  center_lng: number;
  radius_m: number;
  lifecycle_state: string;
  project_id: string | null;
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Settings" title="Time-Clock Zones" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("time_clock_zones")
    .select("id, name, center_lat, center_lng, radius_m, lifecycle_state, project_id")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("name");
  const rows = (data ?? []) as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow="Settings"
        title="Time-Clock Zones"
        subtitle={`${rows.length} zone${rows.length === 1 ? "" : "s"} · classify field punches as inside/outside on /m/clock`}
        action={
          <Button href="/console/settings/time-clock-zones/new" size="sm">
            + New Zone
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/settings/time-clock-zones/${r.id}`}
          emptyLabel="No zones defined"
          emptyDescription="Define a worksite radius. Field punches classify as inside/outside the zone, and outside punches surface in the timesheet audit."
          columns={[
            { key: "name", header: "Name", render: (r) => r.name },
            {
              key: "center",
              header: "Center",
              render: (r) => `${r.center_lat.toFixed(5)}, ${r.center_lng.toFixed(5)}`,
              mono: true,
            },
            {
              key: "radius_m",
              header: "Radius",
              render: (r) => `${r.radius_m} m`,
              mono: true,
            },
            {
              key: "lifecycle_state",
              header: "State",
              render: (r) => (
                <Badge variant={r.lifecycle_state === "active" ? "success" : "muted"}>{r.lifecycle_state}</Badge>
              ),
            },
          ]}
        />
      </div>
    </>
  );
}
