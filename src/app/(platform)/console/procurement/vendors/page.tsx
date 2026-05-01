import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";
import type { Vendor } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function VendorsPage() {
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title="Vendors" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("vendors", session.orgId, { orderBy: "name", ascending: true });
  return (
    <>
      <ModuleHeader
        eyebrow="Procurement"
        title="Vendors"
        subtitle={`${rows.length} vendor${rows.length === 1 ? "" : "s"}`}
        action={<Button href="/console/procurement/vendors/new">+ New Vendor</Button>}
      />
      <div className="page-content">
        <DataTable<Vendor>
          rows={rows}
          rowHref={(r) => `/console/procurement/vendors/${r.id}`}
          emptyLabel="No vendors yet"
          emptyDescription="Onboard suppliers with W-9, COI, and payment terms before issuing POs."
          emptyAction={
            <Button href="/console/procurement/vendors/new" size="sm">
              + New Vendor
            </Button>
          }
          columns={[
            { key: "name", header: "Name", render: (r) => r.name, accessor: (r) => r.name },
            {
              key: "category",
              header: "Category",
              render: (r) => r.category ?? "—",
              className: "font-mono text-xs",
              accessor: (r) => r.category ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "email",
              header: "Email",
              render: (r) => r.contact_email ?? "—",
              className: "font-mono text-xs",
              accessor: (r) => r.contact_email ?? null,
            },
            {
              key: "w9",
              header: "W-9",
              render: (r) =>
                r.w9_on_file ? <Badge variant="success">On File</Badge> : <Badge variant="warning">Missing</Badge>,
            },
            {
              key: "coi",
              header: "COI expires",
              render: (r) => formatDate(r.coi_expires_at, "medium"),
              className: "font-mono text-xs",
              accessor: (r) => r.coi_expires_at,
            },
          ]}
        />
      </div>
    </>
  );
}
