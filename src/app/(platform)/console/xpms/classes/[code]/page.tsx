import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { XPMS_CLASS_BY_CODE } from "@/lib/xpms";

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
        <div style={{ height: 4, background: klass.accent }} className="rounded" />

        <p className="text-sm text-[var(--text-secondary)]">{klass.domain}</p>

        <div className="metric-grid-3">
          <MetricCard label="Total Atoms" value={atoms.length.toLocaleString()} accent />
          <MetricCard label="UAC" value={uac.toLocaleString()} />
          <MetricCard label="TPC" value={tpc.toLocaleString()} />
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

          {atoms.length === 0 ? (
            <div className="surface p-6 text-sm text-[var(--text-muted)]">No atoms recorded in this class yet.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Identifier</th>
                  <th>Name</th>
                  <th>Phase</th>
                  <th>State</th>
                </tr>
              </thead>
              <tbody>
                {atoms.map((a) => (
                  <tr key={a.id}>
                    <td className="font-mono text-xs">{a.identifier}</td>
                    <td>{a.name}</td>
                    <td className="text-[var(--text-secondary)]">{a.phase ?? "—"}</td>
                    <td>
                      <Badge variant={STATE_TONE[a.state]}>{a.state.toUpperCase()}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </>
  );
}
