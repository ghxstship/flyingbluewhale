import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import type { Client } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title={t("console.clients.title", undefined, "Clients")} />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const rows = await listOrgScoped("clients", session.orgId, { orderBy: "created_at" });

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.clients.eyebrow", undefined, "Sales")}
        title={t("console.clients.title", undefined, "Clients")}
        subtitle={
          rows.length === 1
            ? t("console.clients.subtitleOne", { count: rows.length }, `${rows.length} Client`)
            : t("console.clients.subtitleMany", { count: rows.length }, `${rows.length} Clients`)
        }
        action={
          <Button href="/console/clients/new">{t("console.clients.newClient", undefined, "+ New Client")}</Button>
        }
      />
      <div className="page-content">
        <DataTable<Client>
          rows={rows}
          rowHref={(r) => `/console/clients/${r.id}`}
          columns={[
            {
              key: "name",
              header: t("console.clients.columns.name", undefined, "Name"),
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "email",
              header: t("console.clients.columns.email", undefined, "Email"),
              render: (r) => r.contact_email ?? "—",
              accessor: (r) => r.contact_email ?? null,
            },
            {
              key: "phone",
              header: t("console.clients.columns.phone", undefined, "Phone"),
              render: (r) => r.contact_phone ?? "—",
              accessor: (r) => r.contact_phone ?? null,
            },
            {
              key: "website",
              header: t("console.clients.columns.website", undefined, "Website"),
              render: (r) => r.website ?? "—",
              accessor: (r) => r.website ?? null,
            },
            {
              key: "created",
              header: t("console.clients.columns.added", undefined, "Added"),
              render: (r) => timeAgo(r.created_at),
              accessor: (r) => r.created_at,
            },
          ]}
        />
      </div>
    </>
  );
}
