import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { XPMS_CLASS_BY_CODE } from "@/lib/xpms";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Atom = {
  id: string;
  identifier: string;
  name: string;
  state: "uac" | "tpc";
  phase: string | null;
};

const STATE_TONE: Record<Atom["state"], "muted" | "success"> = {
  uac: "muted",
  tpc: "success",
};

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code: codeStr } = await params;
  const code = Number(codeStr);
  if (!Number.isFinite(code) || code < 0 || code > 9) notFound();
  const klass = XPMS_CLASS_BY_CODE[code];
  if (!klass) notFound();

  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="XPMS" title={klass.name} />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const { data } = await supabase
    .from("xpms_atoms")
    .select("id, identifier, name, state, phase")
    .eq("org_id", session.orgId)
    .eq("class_code", code)
    .order("identifier", { ascending: true })
    .limit(500);

  const atoms = (data ?? []) as Atom[];
  const uac = atoms.filter((a) => a.state === "uac").length;
  const tpc = atoms.filter((a) => a.state === "tpc").length;

  return (
    <>
      <ModuleHeader
        eyebrow="XPMS · XTC Protocol™"
        title={`${klass.code}000 · ${klass.name}`}
        subtitle={klass.oneLine}
        breadcrumbs={[
          { label: "XPMS", href: "/console/xpms" },
          { label: "Classes", href: "/console/xpms/classes" },
          { label: klass.name },
        ]}
      />
      <div className="page-content space-y-5">
        <div
          className="h-1 w-full rounded"
          style={{ "--xpms-accent": klass.accent, background: "var(--xpms-accent)" } as React.CSSProperties}
        />

        <p className="text-sm text-[var(--text-secondary)]">{klass.domain}</p>

        <div className="metric-grid-3">
          <MetricCard label="Total Atoms" value={fmt.number(atoms.length)} accent />
          <MetricCard label="UAC" value={fmt.number(uac)} />
          <MetricCard label="TPC" value={fmt.number(tpc)} />
        </div>

        <section>
          <div className="flex items-center justify-between pb-3">
            <h3 className="text-base font-semibold">Atoms in This Class</h3>
            <Link
              href={`/console/xpms/codebook#class-${klass.code}`}
              className="text-xs text-[var(--org-primary)] hover:underline"
            >
              Codebook section →
            </Link>
          </div>

          <DataTable<Atom>
            rows={atoms}
            emptyLabel="No Atoms In This Class"
            emptyDescription="No atoms have been recorded in this XPMS class yet."
            columns={[
              {
                key: "identifier",
                header: "Identifier",
                render: (a) => a.identifier,
                accessor: (a) => a.identifier,
                mono: true,
                sortable: true,
              },
              { key: "name", header: "Name", render: (a) => a.name, accessor: (a) => a.name, sortable: true },
              {
                key: "phase",
                header: "Phase",
                render: (a) => a.phase ?? "—",
                accessor: (a) => a.phase ?? "",
                filterable: true,
              },
              {
                key: "state",
                header: "State",
                render: (a) => <Badge variant={STATE_TONE[a.state]}>{a.state.toUpperCase()}</Badge>,
                accessor: (a) => a.state,
                filterable: true,
                groupable: true,
              },
            ]}
          />
        </section>
      </div>
    </>
  );
}
