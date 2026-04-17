import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import type { Location } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  if (!hasSupabase) return <><ModuleHeader title="Locations" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>;
  const session = await requireSession();
  const rows = await listOrgScoped("locations", session.orgId, { orderBy: "name", ascending: true });
  return (
    <>
      <ModuleHeader eyebrow="Work" title="Locations" subtitle={`${rows.length} location${rows.length === 1 ? "" : "s"}`}
        action={<Button href="/console/locations/new">+ Add location</Button>} />
      <div className="page-content">
        <DataTable<Location>
          rows={rows}
          columns={[
            { key: "name", header: "Name", render: (r) => r.name },
            { key: "address", header: "Address", render: (r) => r.address ?? "—", className: "font-mono text-xs" },
            { key: "city", header: "City", render: (r) => [r.city, r.region].filter(Boolean).join(", ") || "—", className: "font-mono text-xs" },
            { key: "country", header: "Country", render: (r) => r.country ?? "—", className: "font-mono text-xs" },
          ]}
        />
      </div>
    </>
  );
}
