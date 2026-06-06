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
  const [atoms, variance, comp] = await Promise.all([
    supabase.from("xpms_atoms").select("class_code, state, phase").eq("org_id", session.orgId),
    supabase.from("xpms_variance_ledger").select("id, reason").eq("org_id", session.orgId),
    supabase.from("xpms_project_composition").select("tier, share").limit(1000),
  ]);

  const byClass = new Map<number, number>();
  let uacCount = 0,
    tpcCount = 0;
  (atoms.data ?? []).forEach((a: { class_code: number; state: string }) => {
    byClass.set(a.class_code, (byClass.get(a.class_code) ?? 0) + 1);
    if (a.state === "uac") uacCount++;
    else tpcCount++;
  });

  return (
    <>
      <ModuleHeader
        eyebrow="XPMS"
        title={t("console.xpms.title", undefined, "Experiential Project Management System")}
        subtitle={t("console.xpms.subtitle", undefined, "Atomic production catalog.")}
      />
      <div className="page-content">
        <div className="metric-grid mb-6">
          <MetricCard
            label={t("console.xpms.metric.atoms", undefined, "Atoms")}
            value={String(atoms.data?.length ?? 0)}
          />
          <MetricCard label={t("console.xpms.metric.uac", undefined, "UAC (planned)")} value={String(uacCount)} />
          <MetricCard label={t("console.xpms.metric.tpc", undefined, "TPC (deployed)")} value={String(tpcCount)} />
          <MetricCard
            label={t("console.xpms.metric.variance", undefined, "Variance entries")}
            value={String(variance.data?.length ?? 0)}
          />
        </div>

        <Card className="mb-6">
          <CardHeader
            title={t("console.xpms.classes.title", undefined, "Ten Classes")}
            subtitle={t(
              "console.xpms.classes.subtitle",
              undefined,
              "Class is collection and code — one taxonomy, two faces.",
            )}
          />
          <CardBody>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5">
              {XPMS_CLASSES.map((c) => (
                <Link
                  key={c.code}
                  href={`/console/xpms/classes/${c.code}`}
                  className="surface hover-lift block rounded-md p-4"
                  style={{ borderTop: `3px solid ${c.accent}` }}
                >
                  <div className="font-mono text-[10px] tracking-widest text-[var(--text-muted)]">{c.code}000</div>
                  <div className="mt-1 text-sm font-semibold">{c.name}</div>
                  <div className="mt-2 line-clamp-2 text-xs text-[var(--text-muted)]">{c.oneLine}</div>
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
                "The second axis — what kind of human encounter the atom delivers.",
              )}
            />
            <CardBody>
              <ul className="space-y-2 text-sm">
                {XPMS_TIERS.map((tier) => (
                  <li key={tier.id} className="flex items-center justify-between">
                    <span>
                      <span className="me-2 font-mono text-[10px] text-[var(--text-muted)]">{tier.num}</span>
                      {tier.label}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {t("console.xpms.tiers.pairedWith", { pair: tier.pair }, `paired with ${tier.pair}`)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 text-xs">
                <Link href="/console/xpms/tiers" className="text-[var(--org-primary)]">
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
                      <span className="me-2 font-mono text-[10px] text-[var(--text-muted)]">{p.num}</span>
                      {p.label}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">{p.platform}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-3 text-xs">
                <Link href="/console/xpms/phases" className="text-[var(--org-primary)]">
                  {t("console.xpms.phases.openLink", undefined, "Open phase view →")}
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="mt-6 text-xs text-[var(--text-muted)]">
          {t(
            "console.xpms.footer.compositionRows",
            { count: comp.data?.length ?? 0 },
            `Composition rows on file: ${comp.data?.length ?? 0}.`,
          )}{" "}
          {t("console.xpms.footer.codebookNote", undefined, "Codebook is global and append-only — see")}{" "}
          <Link href="/console/xpms/codebook" className="text-[var(--org-primary)]">
            {t("console.xpms.footer.codebookLink", undefined, "XTC codebook")}
          </Link>
          .
        </div>
      </div>
    </>
  );
}
