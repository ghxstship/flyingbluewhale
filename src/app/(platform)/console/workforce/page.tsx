import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

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

const KIND_FILTERS = [
  { kind: null, label: "All" },
  { kind: "paid_staff", label: "Paid Staff" },
  { kind: "volunteer", label: "Volunteers" },
  { kind: "contractor", label: "Contractors" },
  { kind: "official", label: "Officials" },
] as const;

// Workforce-adjacent surfaces that are real concepts (not type filters of
// the workforce_members table). Kept here as a tile band so they remain
// reachable after the WAYFINDER consolidation removed them from the
// primary sidebar.
const RELATED = [
  { href: "/console/workforce/planning", label: "Planning", sub: "Capacity + needs" },
  { href: "/console/workforce/deployment", label: "Deployment", sub: "Where they go" },
  { href: "/console/workforce/call-sheets", label: "Call Sheets", sub: "Day-of-show" },
  { href: "/console/workforce/housing", label: "Housing", sub: "Crew accommodation" },
  { href: "/console/workforce/uniforms", label: "Uniforms", sub: "Issue + return" },
  { href: "/console/workforce/services", label: "Services", sub: "Service requests" },
];

export default async function Page({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const sp = await searchParams;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title="Workforce" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
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
        eyebrow="People"
        title="Workforce"
        subtitle={
          activeKind
            ? `${rows.length} ${KIND_LABEL[activeKind].toLowerCase()}`
            : `${totalCount} member${totalCount === 1 ? "" : "s"} across all kinds`
        }
      />
      <div className="page-content space-y-5">
        <div
          role="tablist"
          aria-label="Filter by workforce kind"
          className="inline-flex flex-wrap items-center gap-1.5"
        >
          {KIND_FILTERS.map((f) => {
            const isActive = (f.kind ?? null) === activeKind;
            const count = f.kind ? (counts[f.kind] ?? 0) : totalCount;
            const href = f.kind ? `/console/workforce?kind=${f.kind}` : "/console/workforce";
            return (
              <Link
                key={f.label}
                href={href}
                role="tab"
                aria-selected={isActive}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                  isActive
                    ? "border-[var(--org-primary)] bg-[var(--org-primary)] text-[var(--org-on-primary,var(--background))]"
                    : "border-[var(--border-color)] hover:bg-[var(--surface-inset)]"
                }`}
              >
                {f.label}
                <span className={isActive ? "opacity-80" : "text-[var(--text-muted)]"}>{count}</span>
              </Link>
            );
          })}
        </div>

        <DataTable<Row>
          rows={rows}
          emptyLabel={activeKind ? `No ${KIND_LABEL[activeKind]}` : "No Workforce Members"}
          emptyDescription="Add a workforce member to the directory to start scheduling and assigning."
          columns={[
            {
              key: "full_name",
              header: "Name",
              render: (r) => r.full_name,
              accessor: (r) => r.full_name,
              sortable: true,
            },
            {
              key: "kind",
              header: "Kind",
              render: (r) => <Badge variant="brand">{KIND_LABEL[r.kind] ?? r.kind}</Badge>,
              accessor: (r) => r.kind,
              filterable: true,
              groupable: true,
            },
            {
              key: "role",
              header: "Role",
              render: (r) => r.role ?? "—",
              accessor: (r) => r.role ?? "",
              filterable: true,
            },
            {
              key: "contact",
              header: "Contact",
              render: (r) => r.email ?? r.phone ?? "—",
              accessor: (r) => r.email ?? r.phone ?? "",
              mono: true,
            },
          ]}
        />

        <section>
          <h2 className="mb-3 text-[11px] font-semibold tracking-[0.2em] text-[var(--text-muted)] uppercase">
            Related Sections
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {RELATED.map((t) => (
              <Link key={t.href} href={t.href} className="surface hover-lift p-4">
                <div className="text-sm font-semibold">{t.label}</div>
                <div className="mt-1 text-xs text-[var(--text-muted)]">{t.sub}</div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
