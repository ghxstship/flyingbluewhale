import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type Visa = {
  id: string;
  person_name: string;
  nationality: string | null;
  passport_no: string | null;
  status: string;
  letter_path: string | null;
  delegation: { name: string | null; code: string | null } | null;
  updated_at: string;
};

const STATUS_TONE: Record<string, "muted" | "info" | "warning" | "success" | "error"> = {
  pending: "muted",
  documents_in: "info",
  letter_issued: "success",
  application_filed: "warning",
  approved: "success",
  denied: "error",
};

function maskPassport(pass: string | null): string {
  if (!pass) return "—";
  if (pass.length <= 4) return "••" + pass;
  return `${pass.slice(0, 2)}•••••${pass.slice(-2)}`;
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Portal" title="Visa Cases" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("visa_cases")
    .select(
      "id, person_name, nationality, passport_no, status, letter_path, delegation:delegation_id(name, code), updated_at",
    )
    .eq("org_id", session.orgId)
    .order("person_name", { ascending: true });

  const cases = ((data ?? []) as unknown as Visa[]) ?? [];
  const approved = cases.filter((c) => c.status === "approved").length;
  const lettersIssued = cases.filter((c) => c.letter_path).length;

  return (
    <>
      <ModuleHeader
        eyebrow="Portal · Delegation"
        title="Visa Cases"
        subtitle={`${cases.length} case${cases.length === 1 ? "" : "s"} · ${approved} approved`}
        breadcrumbs={[
          { label: "Portal", href: `/p/${slug}` },
          { label: "Delegation", href: `/p/${slug}/delegation` },
          { label: "Visa" },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Approved" value={approved.toLocaleString()} accent={approved > 0} />
          <MetricCard label="Letters Issued" value={lettersIssued.toLocaleString()} />
          <MetricCard label="Total" value={cases.length.toLocaleString()} />
        </div>

        <DataTable<Visa>
          rows={cases}
          emptyLabel="No visa cases"
          emptyDescription="Open cases for delegation members who need entry letters or visa support. We track status and store the issued letter for download."
          columns={[
            { key: "name", header: "Person", render: (r) => r.person_name, accessor: (r) => r.person_name },
            {
              key: "nat",
              header: "Nationality",
              render: (r) => r.nationality ?? "—",
              accessor: (r) => r.nationality ?? null,
            },
            {
              key: "passport",
              header: "Passport",
              render: (r) => <span className="font-mono text-[10px]">{maskPassport(r.passport_no)}</span>,
            },
            { key: "delegation", header: "Delegation", render: (r) => r.delegation?.code ?? "—" },
            {
              key: "letter",
              header: "Letter",
              render: (r) =>
                r.letter_path ? (
                  <span className="font-mono text-[10px] text-[var(--org-primary)]">on file</span>
                ) : (
                  <span className="text-[var(--text-muted)]">—</span>
                ),
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{r.status.replace(/_/g, " ")}</Badge>,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
