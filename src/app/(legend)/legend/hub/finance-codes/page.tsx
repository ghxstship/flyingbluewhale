import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { urlFor } from "@/lib/urls";

export const dynamic = "force-dynamic";

/**
 * Finance Codes pillar (canonical home, decision 6 rider): the org's cost
 * centers on the XPMS department canon (0000 Executive through 9000
 * Technology). Full CRUD lives here — cost_centers has no console surface;
 * finance WORKFLOWS (budgets, requisitions) stay in the console and code
 * against these.
 */

type CostCenter = {
  id: string;
  code: string;
  name: string;
  active: boolean;
  parent_id: string | null;
};

export default async function FinanceCodesPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Organization Hub" title="Finance Codes" />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;

  const { data } = await db
    .from("cost_centers")
    .select("id, code, name, active, parent_id")
    .eq("org_id", session.orgId)
    .order("code", { ascending: true })
    .limit(300);
  const rows = (data ?? []) as CostCenter[];

  return (
    <>
      <ModuleHeader
        eyebrow="Organization Hub"
        title="Finance Codes"
        subtitle="Cost centers on the XPMS department canon. Every budget line and requisition codes against these."
        breadcrumbs={[
          { label: "LEG3ND" },
          { label: "Organization Hub", href: "/legend/hub" },
          { label: "Finance Codes" },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button href={urlFor("platform", "/finance")} size="sm" variant="secondary">
              Finance in console
            </Button>
            <Button href="/legend/hub/finance-codes/new" size="sm">
              + New Cost Center
            </Button>
          </div>
        }
      />
      <div className="page-content">
        {rows.length === 0 ? (
          <EmptyState
            title="No cost centers yet"
            description="New organizations start with the 10 XPMS department classes, 0000 Executive through 9000 Technology."
            action={<Button href="/legend/hub/finance-codes/new">+ New Cost Center</Button>}
          />
        ) : (
          <DataTable<CostCenter>
            rows={rows}
            rowHref={(c) => `/legend/hub/finance-codes/${c.id}`}
            emptyLabel="No cost centers"
            columns={[
              {
                key: "code",
                header: "Code",
                render: (c) => <span className="ps-id">{c.code}</span>,
                accessor: (c) => c.code,
              },
              {
                key: "name",
                header: "Name",
                render: (c) => c.name,
                accessor: (c) => c.name,
              },
              {
                key: "active",
                header: "State",
                render: (c) =>
                  c.active ? <Badge variant="success">Active</Badge> : <Badge variant="muted">Inactive</Badge>,
                accessor: (c) => (c.active ? "active" : "inactive"),
              },
            ]}
          />
        )}
      </div>
    </>
  );
}
