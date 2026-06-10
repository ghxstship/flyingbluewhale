import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

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
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("p.delegation.visa.eyebrowShort", undefined, "Portal")}
          title={t("p.delegation.visa.title", undefined, "Visa Cases")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("p.delegation.visa.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const { data } = await supabase
    .from("visa_cases")
    .select(
      "id, person_name, nationality, passport_no, case_state, letter_path, delegation:delegation_id(name, code), updated_at",
    )
    .eq("org_id", session.orgId)
    .order("person_name", { ascending: true });

  const cases = ((data ?? []) as unknown as Visa[]) ?? [];
  const approved = cases.filter((c) => c.status === "approved").length;
  const lettersIssued = cases.filter((c) => c.letter_path).length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("p.delegation.visa.eyebrow", undefined, "Portal · Delegation")}
        title={t("p.delegation.visa.title", undefined, "Visa Cases")}
        subtitle={
          cases.length === 1
            ? t(
                "p.delegation.visa.subtitleSingular",
                { count: cases.length, approved },
                `${cases.length} Case · ${approved} Approved`,
              )
            : t(
                "p.delegation.visa.subtitlePlural",
                { count: cases.length, approved },
                `${cases.length} Cases · ${approved} Approved`,
              )
        }
        breadcrumbs={[
          { label: t("p.delegation.visa.breadcrumbPortal", undefined, "Portal"), href: `/p/${slug}` },
          {
            label: t("p.delegation.visa.breadcrumbDelegation", undefined, "Delegation"),
            href: `/p/${slug}/delegation`,
          },
          { label: t("p.delegation.visa.breadcrumbVisa", undefined, "Visa") },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("p.delegation.visa.metric.approved", undefined, "Approved")}
            value={fmt.number(approved)}
            accent={approved > 0}
          />
          <MetricCard
            label={t("p.delegation.visa.metric.lettersIssued", undefined, "Letters Issued")}
            value={fmt.number(lettersIssued)}
          />
          <MetricCard
            label={t("p.delegation.visa.metric.total", undefined, "Total")}
            value={fmt.number(cases.length)}
          />
        </div>

        <DataTable<Visa>
          rows={cases}
          emptyLabel={t("p.delegation.visa.empty.label", undefined, "No visa cases")}
          emptyDescription={t(
            "p.delegation.visa.empty.description",
            undefined,
            "Open cases for delegation members who need entry letters or visa support. We track status and store the issued letter for download.",
          )}
          columns={[
            {
              key: "name",
              header: t("p.delegation.visa.col.person", undefined, "Person"),
              render: (r) => r.person_name,
              accessor: (r) => r.person_name,
            },
            {
              key: "nat",
              header: t("p.delegation.visa.col.nationality", undefined, "Nationality"),
              render: (r) => r.nationality ?? "—",
              accessor: (r) => r.nationality ?? null,
            },
            {
              key: "passport",
              header: t("p.delegation.visa.col.passport", undefined, "Passport"),
              render: (r) => <span className="font-mono text-[10px]">{maskPassport(r.passport_no)}</span>,
              accessor: (r) => r.passport_no ?? null,
            },
            {
              key: "delegation",
              header: t("p.delegation.visa.col.delegation", undefined, "Delegation"),
              render: (r) => r.delegation?.code ?? "—",
              accessor: (r) => r.delegation?.code ?? null,
            },
            {
              key: "letter",
              header: t("p.delegation.visa.col.letter", undefined, "Letter"),
              render: (r) =>
                r.letter_path ? (
                  <span className="font-mono text-[10px] text-[var(--p-accent)]">
                    {t("p.delegation.visa.letter.onFile", undefined, "on file")}
                  </span>
                ) : (
                  <span className="text-[var(--p-text-2)]">—</span>
                ),
              accessor: (r) => r.letter_path ?? null,
            },
            {
              key: "status",
              header: t("p.delegation.visa.col.status", undefined, "Status"),
              render: (r) => <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{toTitle(r.status)}</Badge>,
              filterable: true,
              groupable: true,
              accessor: (r) => r.status ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
