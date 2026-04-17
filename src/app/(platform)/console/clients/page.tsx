import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import type { Client } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title="Clients" />
        <div className="page-content"><div className="surface p-6 text-sm">Configure Supabase to load clients.</div></div>
      </>
    );
  }
  const session = await requireSession();
  const rows = await listOrgScoped("clients", session.orgId, { orderBy: "created_at" });

  return (
    <>
      <ModuleHeader
        eyebrow="Sales"
        title="Clients"
        subtitle={`${rows.length} client${rows.length === 1 ? "" : "s"}`}
        action={<Button href="/console/clients/new">+ New client</Button>}
      />
      <div className="page-content">
        <DataTable<Client>
          rows={rows}
          rowHref={(r) => `/console/clients/${r.id}`}
          columns={[
            { key: "name", header: "Name", render: (r) => r.name },
            { key: "email", header: "Email", render: (r) => r.contact_email ?? "—", className: "font-mono text-xs" },
            { key: "phone", header: "Phone", render: (r) => r.contact_phone ?? "—", className: "font-mono text-xs" },
            { key: "website", header: "Website", render: (r) => r.website ?? "—", className: "font-mono text-xs" },
            { key: "created", header: "Added", render: (r) => timeAgo(r.created_at), className: "font-mono text-xs" },
          ]}
        />
      </div>
    </>
  );
}
