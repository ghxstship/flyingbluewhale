import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { listOfferLetters } from "@/lib/offer-letters/queries";
import { EMPLOYER_SHORT, STATUS_LABEL, STATUS_VARIANT } from "@/lib/offer-letters/types";
import type { OfferLetter } from "@/lib/offer-letters/types";

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
        <DataTable<OfferLetter>
          rows={rows}
          rowHref={(r) => `/console/people/offer-letters/${r.id}`}
          emptyLabel="No offer letters yet"
          emptyDescription="Letters seed from the project crew roster — see the Salvage City project."
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
            },
            {
              key: "role",
              header: "Role",
              render: (r) => (
                <div>
                  <div className="text-sm">{r.role_title}</div>
                  <div className="text-xs text-[var(--text-muted)]">{r.department ?? ""}</div>
                </div>
              ),
            },
            { key: "employer", header: "Issuer", render: (r) => <Badge>{EMPLOYER_SHORT[r.employer]}</Badge> },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge>,
            },
            {
              key: "code",
              header: "Access Code",
              render: (r) => <span className="font-mono text-xs tracking-wider">{r.access_code}</span>,
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
            },
          ]}
        />
      </div>
    </>
  );
}
