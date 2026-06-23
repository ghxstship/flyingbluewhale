import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";
import type { Credential } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function CredentialsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={t("console.people.credentials.title", undefined, "Credentials")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.people.credentials.configureSupabase", undefined, "Configure Supabase.")}
          </div>
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
        eyebrow={t("console.people.credentials.eyebrow", undefined, "People")}
        title={t("console.people.credentials.title", undefined, "Credentials")}
        subtitle={`${t("console.people.credentials.subtitleCertsTracked", { count: rows.length }, `${rows.length} certs tracked`)}${expiringSoon ? ` · ${t("console.people.credentials.subtitleExpiring", { count: expiringSoon }, `${expiringSoon} expiring in 60d`)}` : ""}`}
        action={
          <>
            <Button href="/studio/people/credentials/asset-linker" size="sm" variant="secondary">
              {t("console.people.credentials.scanCodeLinker", undefined, "Scan Code Linker")}
            </Button>
            <Button href="/studio/people/credentials/new" size="sm">
              {t("console.people.credentials.addCredential", undefined, "+ Add credential")}
            </Button>
          </>
        }
      />
      <div className="page-content">
        <DataTable<Credential>
          rows={rows}
          rowHref={(r) => `/studio/people/credentials/${r.id}`}
          emptyLabel={t("console.people.credentials.emptyLabel", undefined, "No credentials tracked")}
          emptyDescription={t(
            "console.people.credentials.emptyDescription",
            undefined,
            "First-aid, working-at-height, security badges — track expiry to flag re-cert ahead of deployment.",
          )}
          emptyAction={
            <Button href="/studio/people/credentials/new" size="sm">
              {t("console.people.credentials.addCredential", undefined, "+ Add credential")}
            </Button>
          }
          columns={[
            {
              key: "kind",
              header: t("console.people.credentials.col.kind", undefined, "Kind"),
              render: (r) => r.kind,
              accessor: (r) => r.kind,
              filterable: true,
              groupable: true,
            },
            {
              key: "number",
              header: t("console.people.credentials.col.number", undefined, "Number"),
              render: (r) => r.number ?? "—",
              className: "font-mono text-xs",
              accessor: (r) => r.number ?? null,
            },
            {
              key: "issued",
              header: t("console.people.credentials.col.issued", undefined, "Issued"),
              render: (r) => formatDate(r.issued_on, "medium"),
              className: "font-mono text-xs",
              accessor: (r) => r.issued_on,
            },
            {
              key: "expires",
              header: t("console.people.credentials.col.expires", undefined, "Expires"),
              render: (r) => {
                if (!r.expires_on) return "—";
                const daysUntil = Math.ceil((new Date(r.expires_on).getTime() - Date.now()) / 86400_000);
                if (daysUntil < 0)
                  return <Badge variant="error">{t("console.people.credentials.expired", undefined, "Expired")}</Badge>;
                if (daysUntil < 30)
                  return (
                    <Badge variant="warning">
                      {t("console.people.credentials.daysShort", { count: daysUntil }, `${daysUntil}d`)}
                    </Badge>
                  );
                return <span className="font-mono text-xs">{formatDate(r.expires_on, "medium")}</span>;
              },
              accessor: (r) => r.expires_on ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
