import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";
import type { Credential } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function CredentialsPage() {
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title="Credentials" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("credentials")
    .select("*")
    .eq("org_id", session.orgId)
    .order("expires_on", { ascending: true });
  const rows = (data ?? []) as Credential[];
  const expiringSoon = rows.filter(
    (r) => r.expires_on && new Date(r.expires_on).getTime() - Date.now() < 60 * 86400_000,
  ).length;

  return (
    <>
      <ModuleHeader
        eyebrow="People"
        title="Credentials"
        subtitle={`${rows.length} certs tracked${expiringSoon ? ` · ${expiringSoon} expiring in 60d` : ""}`}
        action={
          <Button href="/console/people/credentials/new" size="sm">
            + Add credential
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<Credential>
          rows={rows}
          rowHref={(r) => `/console/people/credentials/${r.id}`}
          emptyLabel="No credentials tracked"
          emptyDescription="First-aid, working-at-height, security badges — track expiry to flag re-cert ahead of deployment."
          emptyAction={
            <Button href="/console/people/credentials/new" size="sm">
              + Add credential
            </Button>
          }
          columns={[
            {
              key: "kind",
              header: "Kind",
              render: (r) => r.kind,
              accessor: (r) => r.kind,
              filterable: true,
              groupable: true,
            },
            {
              key: "number",
              header: "Number",
              render: (r) => r.number ?? "—",
              className: "font-mono text-xs",
              accessor: (r) => r.number ?? null,
            },
            {
              key: "issued",
              header: "Issued",
              render: (r) => formatDate(r.issued_on, "medium"),
              className: "font-mono text-xs",
              accessor: (r) => r.issued_on,
            },
            {
              key: "expires",
              header: "Expires",
              render: (r) => {
                if (!r.expires_on) return "—";
                const daysUntil = Math.ceil((new Date(r.expires_on).getTime() - Date.now()) / 86400_000);
                if (daysUntil < 0) return <Badge variant="error">Expired</Badge>;
                if (daysUntil < 30) return <Badge variant="warning">{daysUntil}d</Badge>;
                return <span className="font-mono text-xs">{formatDate(r.expires_on, "medium")}</span>;
              },
            },
          ]}
        />
      </div>
    </>
  );
}
