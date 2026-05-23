import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { listMsas } from "@/lib/msa/queries";
import { MSA_STATUS_LABEL, MSA_STATUS_VARIANT } from "@/lib/msa/types";
import type { IndependentContractorMsaResolved } from "@/lib/msa/types";

export const dynamic = "force-dynamic";

export default async function MsasPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="People" title="Contracts" subtitle="Master Services Agreements" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
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
        eyebrow="People · Contracts"
        title="Master Services Agreements"
        subtitle={`${rows.length} On File · ${counts["signed"] ?? 0} Signed · ${counts["draft"] ?? 0} Draft`}
        action={
          <Button href="/console/people/msas/new" size="sm">
            + New Contract
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<IndependentContractorMsaResolved>
          rows={rows}
          rowHref={(r) => `/console/people/msas/${r.id}`}
          emptyLabel="No MSAs yet"
          emptyDescription="Issue an MSA to a crew member before sending their first engagement letter."
          columns={[
            {
              key: "contractor",
              header: "Contractor",
              render: (r) => (
                <div>
                  <div className="text-sm font-medium">{r.crew_member_name}</div>
                  <div className="font-mono text-xs text-[var(--text-muted)]">{r.crew_member_email ?? "—"}</div>
                </div>
              ),
              accessor: (r) => r.crew_member_name ?? null,
            },
            {
              key: "role",
              header: "Role",
              render: (r) => <span className="text-xs">{r.crew_member_role ?? "—"}</span>,
              filterable: true,
              groupable: true,
              accessor: (r) => r.crew_member_role ?? null,
            },
            {
              key: "version",
              header: "Version",
              render: (r) => <span className="font-mono text-xs">v{r.version}</span>,
              accessor: (r) => r.version ?? null,
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge variant={MSA_STATUS_VARIANT[r.msa_state]}>{MSA_STATUS_LABEL[r.msa_state]}</Badge>,
              filterable: true,
              groupable: true,
              accessor: (r) => r.msa_state ?? null,
            },
            {
              key: "signed_at",
              header: "Signed",
              render: (r) =>
                r.signed_at ? (
                  <span className="font-mono text-xs">{new Date(r.signed_at).toLocaleDateString()}</span>
                ) : (
                  <span className="text-xs text-[var(--text-muted)]">—</span>
                ),
              accessor: (r) => r.signed_at ?? null,
            },
            {
              key: "code",
              header: "Code",
              render: (r) => <span className="font-mono text-xs tracking-wider">{r.access_code}</span>,
              accessor: (r) => r.access_code ?? null,
            },
            {
              key: "open",
              header: "",
              render: (r) => (
                <Link
                  href={`/console/people/msas/${r.id}`}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--org-primary)]"
                >
                  Open →
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
