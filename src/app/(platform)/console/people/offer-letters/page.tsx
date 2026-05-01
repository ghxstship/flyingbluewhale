import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { listOfferLetters } from "@/lib/offer-letters/queries";
import { EMPLOYER_SHORT, STATUS_LABEL, STATUS_VARIANT } from "@/lib/offer-letters/types";
import type { OfferLetterResolved } from "@/lib/offer-letters/types";
import { formatDollars } from "@/lib/offer-letters/format";

export const dynamic = "force-dynamic";

export default async function OfferLettersPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="People" title="Offer Letters" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const rows = await listOfferLetters(session.orgId);
  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <ModuleHeader
        eyebrow="People"
        title="Offer Letters"
        subtitle={`${rows.length} ${rows.length === 1 ? "letter" : "letters"} · ${counts["accepted"] ?? 0} accepted · ${counts["draft"] ?? 0} draft`}
      />
      <div className="page-content">
        <DataTable<OfferLetterResolved>
          rows={rows}
          rowHref={(r) => `/console/people/offer-letters/${r.id}`}
          emptyLabel="No offer letters yet"
          emptyDescription="Letters seed from the project crew roster. Run seed_salvage_city_ssot('demo') to populate Salvage City."
          columns={[
            {
              key: "recipient",
              header: "Recipient",
              render: (r) => (
                <div>
                  <div className="text-sm font-medium">{r.recipient_name}</div>
                  <div className="font-mono text-xs text-[var(--text-muted)]">{r.recipient_email}</div>
                </div>
              ),
              accessor: (r) => r.recipient_name ?? null,
            },
            {
              key: "role",
              header: "Role",
              render: (r) => (
                <div>
                  <div className="text-sm">{r.role_title}</div>
                  <div className="text-xs text-[var(--text-muted)]">{r.role_department ?? ""}</div>
                </div>
              ),
              filterable: true,
              groupable: true,
              accessor: (r) => r.role_title ?? r.role_department ?? null,
            },
            {
              key: "project",
              header: "Project",
              render: (r) => <span className="text-xs">{r.project_name}</span>,
              accessor: (r) => r.project_name ?? null,
            },
            {
              key: "employer",
              header: "Issuer",
              render: (r) => <Badge>{EMPLOYER_SHORT[r.employer]}</Badge>,
              accessor: (r) => r.employer ?? null,
            },
            {
              key: "comp",
              header: "Compensation",
              render: (r) =>
                r.effective_compensation_cents > 0 ? (
                  <span className="font-mono text-xs">{formatDollars(r.effective_compensation_cents)}</span>
                ) : (
                  <span className="text-xs text-[var(--text-muted)]">TBD</span>
                ),
              className: "text-end",
              accessor: (r) => Number(r.effective_compensation_cents ?? 0),
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge>,
              filterable: true,
              groupable: true,
              accessor: (r) => r.status ?? null,
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
                  href={`/console/people/offer-letters/${r.id}`}
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
