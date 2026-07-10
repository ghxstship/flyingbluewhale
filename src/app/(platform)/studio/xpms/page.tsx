import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Card, CardBody, CardHeader, MetricCard } from "@/components/ui";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { createClient } from "@/lib/supabase/server";
import { XPMS_CLASSES, XPMS_TIERS, XPMS_ATOM_PHASES } from "@/lib/xpms";

export const dynamic = "force-dynamic";

export default async function XpmsOverviewPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow="XPMS"
          title={t("console.xpms.title", undefined, "Experiential Project Management System")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.xpms.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  // B-22: server-side aggregates — `count: "exact", head: true` per tile
  // instead of fetching every atom/ledger row just to count in JS.
  const [atomsTotal, atomsUac, variance, comp, ...classCounts] = await Promise.all([
    supabase.from("xpms_atoms").select("id", { count: "exact", head: true }).eq("org_id", session.orgId),
    supabase
      .from("xpms_atoms")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("state", "uac"),
    supabase.from("xpms_variance_ledger").select("id", { count: "exact", head: true }).eq("org_id", session.orgId),
    supabase.from("xpms_project_composition").select("project_id", { count: "exact", head: true }),
    ...XPMS_CLASSES.map((c) =>
      supabase
        .from("xpms_atoms")
        .select("id", { count: "exact", head: true })
        .eq("org_id", session.orgId)
        .eq("class_code", c.code),
    ),
  ]);

  const byClass = new Map<number, number>();
  XPMS_CLASSES.forEach((c, i) => {
    byClass.set(c.code, classCounts[i]?.count ?? 0);
  });
  const totalAtoms = atomsTotal.count ?? 0;
  const uacCount = atomsUac.count ?? 0;
  const tpcCount = Math.max(0, totalAtoms - uacCount);

  return (
    <>
      <ModuleHeader
        eyebrow="XPMS"
        title={t("console.xpms.title", undefined, "Experiential Project Management System")}
        subtitle={t("console.xpms.subtitle", undefined, "Atomic production catalog.")}
      />
      <div className="page-content">
        <div className="metric-grid mb-6">
          <MetricCard label={t("console.xpms.metric.atoms", undefined, "Atoms")} value={String(totalAtoms)} />
          {/* B-34: plain word first, acronym in parentheses — no dashes. */}
          <MetricCard
            label={t("console.xpms.metric.uacPlanned", undefined, "Planned (UAC)")}
            value={String(uacCount)}
          />
          <MetricCard
            label={t("console.xpms.metric.tpcDeployed", undefined, "Deployed (TPC)")}
            value={String(tpcCount)}
          />
          <MetricCard
            label={t("console.xpms.metric.variance", undefined, "Variance entries")}
            value={String(variance.count ?? 0)}
          />
        </div>

        <Card className="mb-6">
          <CardHeader
            title={t("console.xpms.classes.title", undefined, "Ten Classes")}
            subtitle={t(
              "console.xpms.classes.subtitle",
              undefined,
              "Class is collection and code: one taxonomy, two faces.",
            )}
          />
          <CardBody>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5">
              {XPMS_CLASSES.map((c) => (
                <Link
                  key={c.code}
                  href={`/studio/xpms/classes/${c.code}`}
                  className="surface hover-lift block rounded-md p-4"
                  style={{ borderTop: `3px solid ${c.accent}` }}
                >
                  <div className="font-mono text-[11px] tracking-widest text-[var(--p-text-2)]">{c.code}000</div>
                  <div className="mt-1 text-sm font-semibold">{c.name}</div>
                  <div className="mt-2 line-clamp-2 text-xs text-[var(--p-text-2)]">{c.oneLine}</div>
                  <div className="mt-3 font-mono text-xs">
                    {t(
                      "console.xpms.classes.atomsCount",
                      { count: byClass.get(c.code) ?? 0 },
                      `${byClass.get(c.code) ?? 0} atoms`,
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </CardBody>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader
              title={t("console.xpms.tiers.title", undefined, "Six Tiers of Experience")}
              subtitle={t(
                "console.xpms.tiers.subtitle",
                undefined,
                "The second axis: what kind of human encounter the atom delivers.",
              )}
            />
            <CardBody>
              <ul className="space-y-2 text-sm">
                {XPMS_TIERS.map((tier) => (
                  <li key={tier.id} className="flex items-center justify-between">
                    <span>
                      <span className="me-2 font-mono text-[11px] text-[var(--p-text-2)]">{tier.num}</span>
                      {tier.label}
                    </span>
                    <span className="text-xs text-[var(--p-text-2)]">
                      {t("console.xpms.tiers.pairedWith", { pair: tier.pair }, `paired with ${tier.pair}`)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 text-xs">
                <Link href="/studio/xpms/tiers" className="text-[var(--p-accent)]">
                  {t("console.xpms.tiers.openLink", undefined, "Open tier composition →")}
                </Link>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader
              title={t("console.xpms.phases.title", undefined, "Eight Production Phases")}
              subtitle={t("console.xpms.phases.subtitle", undefined, "Temporal spine. Every atom carries a phase.")}
            />
            <CardBody>
              <ol className="space-y-2 text-sm">
                {XPMS_ATOM_PHASES.map((p) => (
                  <li key={p.id} className="flex items-center justify-between">
                    <span>
                      <span className="me-2 font-mono text-[11px] text-[var(--p-text-2)]">{p.num}</span>
                      {p.label}
                    </span>
                    <span className="text-[11px] text-[var(--p-text-2)]">{p.platform}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-3 text-xs">
                <Link href="/studio/xpms/phases" className="text-[var(--p-accent)]">
                  {t("console.xpms.phases.openLink", undefined, "Open phase view →")}
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="mt-6 text-xs text-[var(--p-text-2)]">
          {t(
            "console.xpms.footer.compositionRows",
            { count: comp.count ?? 0 },
            `Composition rows on file: ${comp.count ?? 0}.`,
          )}{" "}
          {t("console.xpms.footer.codebookNote", undefined, "Codebook is global and append-only. See")}{" "}
          <Link href="/studio/xpms/codebook" className="text-[var(--p-accent)]">
            {t("console.xpms.footer.codebookLink", undefined, "XTC codebook")}
          </Link>
          .
        </div>
      </div>
    </>
  );
}
