import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { listMsas } from "@/lib/msa/queries";
import { MSA_STATUS_LABEL, MSA_STATUS_VARIANT } from "@/lib/msa/types";
import type { IndependentContractorMsaResolved } from "@/lib/msa/types";

export const dynamic = "force-dynamic";

export default async function MsasPage() {
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.people.msas.eyebrowShort", undefined, "People")}
          title={t("console.people.msas.titleShort", undefined, "Contracts")}
          subtitle={t("console.people.msas.subtitleShort", undefined, "Master Services Agreements")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.people.msas.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const rows = await listMsas(session.orgId);
  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.msa_state] = (acc[r.msa_state] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.people.msas.eyebrow", undefined, "People · Contracts")}
        title={t("console.people.msas.title", undefined, "Master Services Agreements")}
        subtitle={t(
          "console.people.msas.subtitleCounts",
          { total: rows.length, signed: counts["signed"] ?? 0, draft: counts["draft"] ?? 0 },
          `${rows.length} On File · ${counts["signed"] ?? 0} Signed · ${counts["draft"] ?? 0} Draft`,
        )}
        action={
          <Button href="/studio/people/msas/new" size="sm">
            {t("console.people.msas.newContract", undefined, "+ New Contract")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<IndependentContractorMsaResolved>
          rows={rows}
          rowHref={(r) => `/studio/people/msas/${r.id}`}
          emptyLabel={t("console.people.msas.emptyLabel", undefined, "No MSAs yet")}
          emptyDescription={t(
            "console.people.msas.emptyDescription",
            undefined,
            "Issue an MSA to a crew member before sending their first engagement letter.",
          )}
          columns={[
            {
              key: "contractor",
              header: t("console.people.msas.col.contractor", undefined, "Contractor"),
              render: (r) => (
                <div>
                  <div className="text-sm font-medium">{r.crew_member_name}</div>
                  <div className="font-mono text-xs text-[var(--p-text-2)]">{r.crew_member_email ?? "—"}</div>
                </div>
              ),
              accessor: (r) => r.crew_member_name ?? null,
            },
            {
              key: "role",
              header: t("console.people.msas.col.role", undefined, "Role"),
              render: (r) => <span className="text-xs">{r.crew_member_role ?? "—"}</span>,
              filterable: true,
              groupable: true,
              accessor: (r) => r.crew_member_role ?? null,
            },
            {
              key: "version",
              header: t("console.people.msas.col.version", undefined, "Version"),
              render: (r) => <span className="font-mono text-xs">v{r.version}</span>,
              accessor: (r) => r.version ?? null,
            },
            {
              key: "status",
              header: t("console.people.msas.col.status", undefined, "Status"),
              render: (r) => <Badge variant={MSA_STATUS_VARIANT[r.msa_state]}>{MSA_STATUS_LABEL[r.msa_state]}</Badge>,
              filterable: true,
              groupable: true,
              accessor: (r) => r.msa_state ?? null,
            },
            {
              key: "signed_at",
              header: t("console.people.msas.col.signed", undefined, "Signed"),
              render: (r) =>
                r.signed_at ? (
                  <span className="font-mono text-xs">{fmt.date(new Date(r.signed_at))}</span>
                ) : (
                  <span className="text-xs text-[var(--p-text-2)]">—</span>
                ),
              accessor: (r) => r.signed_at ?? null,
            },
            {
              key: "code",
              header: t("console.people.msas.col.code", undefined, "Code"),
              render: (r) => <span className="font-mono text-xs tracking-wider">{r.access_code}</span>,
              accessor: (r) => r.access_code ?? null,
            },
            {
              key: "open",
              header: "",
              render: (r) => (
                <Link
                  href={`/studio/people/msas/${r.id}`}
                  className="text-xs text-[var(--p-text-2)] hover:text-[var(--p-accent)]"
                >
                  {t("common.openArrow", undefined, "Open →")}
                </Link>
              ),
              className: "text-end",
              accessor: (r) => r.id ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
