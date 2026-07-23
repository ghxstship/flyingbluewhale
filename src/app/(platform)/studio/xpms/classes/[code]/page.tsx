import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { DataView } from "@/components/views/DataViewServer";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { XPMS_CLASS_BY_CODE } from "@/lib/xpms";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

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

  const { t } = await getRequestT();

  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="XPMS" title={klass.name} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.xpms.classes.detail.configureSupabase", undefined, "Configure Supabase.")}
          </div>
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
          { label: "XPMS", href: "/studio/xpms" },
          {
            label: t("console.xpms.classes.detail.breadcrumb.classes", undefined, "Classes"),
            href: "/studio/xpms/classes",
          },
          { label: klass.name },
        ]}
      />
      <div className="page-content space-y-5">
        <div style={{ height: 4, background: klass.accent }} className="rounded" />

        <p className="text-sm text-[var(--p-text-2)]">{klass.domain}</p>

        <div className="metric-grid-3">
          <MetricCard
            label={t("console.xpms.classes.detail.metric.totalAtoms", undefined, "Total Atoms")}
            value={fmt.number(atoms.length)}
            accent
          />
          <MetricCard label={t("console.xpms.classes.detail.metric.uac", undefined, "UAC")} value={fmt.number(uac)} />
          <MetricCard label={t("console.xpms.classes.detail.metric.tpc", undefined, "TPC")} value={fmt.number(tpc)} />
        </div>

        <section>
          <div className="flex items-center justify-between pb-3">
            <h3 className="text-base font-semibold">
              {t("console.xpms.classes.detail.atomsInClass", undefined, "Atoms in This Class")}
            </h3>
            <Link
              href={`/studio/xpms/codebook#class-${klass.code}`}
              className="text-xs text-[var(--p-accent)] hover:underline"
            >
              {t("console.xpms.classes.detail.codebookSection", undefined, "Codebook section →")}
            </Link>
          </div>

          <DataView<Atom>
            rows={atoms}
            emptyLabel={t("console.xpms.classes.detail.empty.label", undefined, "No Atoms In This Class")}
            emptyDescription={t(
              "console.xpms.classes.detail.empty.description",
              undefined,
              "No atoms have been recorded in this XPMS class yet.",
            )}
            columns={[
              {
                key: "identifier",
                header: t("console.xpms.classes.detail.column.identifier", undefined, "Identifier"),
                render: (a) => a.identifier,
                accessor: (a) => a.identifier,
                mono: true,
                sortable: true,
              },
              {
                key: "name",
                header: t("console.xpms.classes.detail.column.name", undefined, "Name"),
                render: (a) => a.name,
                accessor: (a) => a.name,
                sortable: true,
              },
              {
                key: "phase",
                header: t("console.xpms.classes.detail.column.phase", undefined, "Phase"),
                render: (a) => a.phase ?? "—",
                accessor: (a) => a.phase ?? "",
                filterable: true,
              },
              {
                key: "state",
                header: t("console.xpms.classes.detail.column.state", undefined, "Status"),
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
