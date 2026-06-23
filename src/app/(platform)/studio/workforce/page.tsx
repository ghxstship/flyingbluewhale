import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

type Row = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  kind: string;
  venue_id: string | null;
};

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  paid_staff: "Paid Staff",
  volunteer: "Volunteers",
  contractor: "Contractors",
  official: "Officials",
};

export default async function Page({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const sp = await searchParams;
  const { t } = await getRequestT();
  const KIND_LABEL_I18N: Record<string, string> = {
    paid_staff: t("console.workforce.kind.paidStaff", undefined, "Paid Staff"),
    volunteer: t("console.workforce.kind.volunteers", undefined, "Volunteers"),
    contractor: t("console.workforce.kind.contractors", undefined, "Contractors"),
    official: t("console.workforce.kind.officials", undefined, "Officials"),
  };
  const KIND_FILTERS_I18N = [
    { kind: null, label: t("console.workforce.filter.all", undefined, "All") },
    { kind: "paid_staff", label: t("console.workforce.kind.paidStaff", undefined, "Paid Staff") },
    { kind: "volunteer", label: t("console.workforce.kind.volunteers", undefined, "Volunteers") },
    { kind: "contractor", label: t("console.workforce.kind.contractors", undefined, "Contractors") },
    { kind: "official", label: t("console.workforce.kind.officials", undefined, "Officials") },
  ] as const;
  const RELATED_I18N = [
    {
      href: "/studio/workforce/planning",
      label: t("console.workforce.related.planning.label", undefined, "Planning"),
      sub: t("console.workforce.related.planning.sub", undefined, "Capacity + needs"),
    },
    {
      href: "/studio/workforce/deployment",
      label: t("console.workforce.related.deployment.label", undefined, "Deployment"),
      sub: t("console.workforce.related.deployment.sub", undefined, "Where they go"),
    },
    {
      href: "/studio/workforce/call-sheets",
      label: t("console.workforce.related.callSheets.label", undefined, "Call Sheets"),
      sub: t("console.workforce.related.callSheets.sub", undefined, "Day-of-show"),
    },
    {
      href: "/studio/workforce/housing",
      label: t("console.workforce.related.housing.label", undefined, "Housing"),
      sub: t("console.workforce.related.housing.sub", undefined, "Crew accommodation"),
    },
    {
      href: "/studio/workforce/uniforms",
      label: t("console.workforce.related.uniforms.label", undefined, "Uniforms"),
      sub: t("console.workforce.related.uniforms.sub", undefined, "Issue + return"),
    },
    {
      href: "/studio/workforce/services",
      label: t("console.workforce.related.services.label", undefined, "Services"),
      sub: t("console.workforce.related.services.sub", undefined, "Service requests"),
    },
  ];
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title={t("console.workforce.title", undefined, "Workforce")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.workforce.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  let q = supabase
    .from("workforce_members")
    .select("id,full_name,email,phone,role,kind,venue_id")
    .eq("org_id", session.orgId)
    .order("full_name", { ascending: true });
  type WorkforceKind = "paid_staff" | "volunteer" | "contractor" | "official";
  const activeKind = sp.kind && Object.keys(KIND_LABEL).includes(sp.kind) ? (sp.kind as WorkforceKind) : null;
  if (activeKind) q = q.eq("kind", activeKind);
  const { data } = await q;
  const rows = (data ?? []) as Row[];

  // Per-kind counts so the filter chips show inventory at a glance.
  const { data: allRows } = await supabase.from("workforce_members").select("kind").eq("org_id", session.orgId);
  const counts = (allRows ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.kind] = (acc[r.kind] ?? 0) + 1;
    return acc;
  }, {});
  const totalCount = (allRows ?? []).length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.eyebrow", undefined, "People")}
        title={t("console.workforce.title", undefined, "Workforce")}
        subtitle={
          activeKind
            ? t(
                "console.workforce.subtitle.filtered",
                { count: rows.length, kind: (KIND_LABEL_I18N[activeKind] ?? activeKind).toLowerCase() },
                `${rows.length} ${(KIND_LABEL_I18N[activeKind] ?? activeKind).toLowerCase()}`,
              )
            : t(
                "console.workforce.subtitle.all",
                { count: totalCount, plural: totalCount === 1 ? "" : "s" },
                `${totalCount} member${totalCount === 1 ? "" : "s"} across all kinds`,
              )
        }
      />
      <div className="page-content space-y-5">
        <div
          role="tablist"
          aria-label={t("console.workforce.filterAriaLabel", undefined, "Filter by workforce kind")}
          className="inline-flex flex-wrap items-center gap-1.5"
        >
          {KIND_FILTERS_I18N.map((f) => {
            const isActive = (f.kind ?? null) === activeKind;
            const count = f.kind ? (counts[f.kind] ?? 0) : totalCount;
            const href = f.kind ? `/studio/workforce?kind=${f.kind}` : "/studio/workforce";
            return (
              <Link
                key={f.label}
                href={href}
                role="tab"
                aria-selected={isActive}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                  isActive
                    ? "border-[var(--p-accent)] bg-[var(--p-accent)] text-[var(--p-accent-contrast,var(--p-bg))]"
                    : "border-[var(--p-border)] hover:bg-[var(--p-surface-2)]"
                }`}
              >
                {f.label}
                <span className={isActive ? "opacity-80" : "text-[var(--p-text-2)]"}>{count}</span>
              </Link>
            );
          })}
        </div>

        <DataTable<Row>
          rows={rows}
          emptyLabel={
            activeKind
              ? t(
                  "console.workforce.empty.filtered",
                  { kind: KIND_LABEL_I18N[activeKind] ?? activeKind },
                  `No ${KIND_LABEL_I18N[activeKind] ?? activeKind}`,
                )
              : t("console.workforce.empty.all", undefined, "No Workforce Members")
          }
          emptyDescription={t(
            "console.workforce.emptyDescription",
            undefined,
            "Add a workforce member to the directory to start scheduling and assigning.",
          )}
          columns={[
            {
              key: "full_name",
              header: t("console.workforce.column.name", undefined, "Name"),
              render: (r) => r.full_name,
              accessor: (r) => r.full_name,
              sortable: true,
            },
            {
              key: "kind",
              header: t("console.workforce.column.kind", undefined, "Kind"),
              render: (r) => <Badge variant="brand">{KIND_LABEL_I18N[r.kind] ?? r.kind}</Badge>,
              accessor: (r) => r.kind,
              filterable: true,
              groupable: true,
            },
            {
              key: "role",
              header: t("console.workforce.column.role", undefined, "Role"),
              render: (r) => r.role ?? "—",
              accessor: (r) => r.role ?? "",
              filterable: true,
            },
            {
              key: "contact",
              header: t("console.workforce.column.contact", undefined, "Contact"),
              render: (r) => r.email ?? r.phone ?? "—",
              accessor: (r) => r.email ?? r.phone ?? "",
              mono: true,
            },
          ]}
        />

        <section>
          <h2 className="mb-3 text-[11px] font-semibold tracking-[0.2em] text-[var(--p-text-2)] uppercase">
            {t("console.workforce.relatedSections", undefined, "Related Sections")}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {RELATED_I18N.map((item) => (
              <Link key={item.href} href={item.href} className="surface hover-lift p-4">
                <div className="text-sm font-semibold">{item.label}</div>
                <div className="mt-1 text-xs text-[var(--p-text-2)]">{item.sub}</div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
