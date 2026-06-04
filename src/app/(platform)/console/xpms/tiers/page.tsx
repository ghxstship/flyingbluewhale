import { ModuleHeader } from "@/components/Shell";
import { Card, CardBody, CardHeader, ProgressBar } from "@/components/ui";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { createClient } from "@/lib/supabase/server";
import { XPMS_TIERS, type XpmsTier } from "@/lib/xpms";

export const dynamic = "force-dynamic";

type TierRow = { tier: XpmsTier; atom_count: number; cost_cents: number };

export default async function TierCompositionPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="XPMS" title={t("console.xpms.tiers.title", undefined, "Tier Composition")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.xpms.tiers.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("v_xpms_atom_tier_composition")
    .select("tier, atom_count, cost_cents")
    .eq("org_id", session.orgId);
  const rows = (data ?? []) as TierRow[];

  const totalAtoms = rows.reduce((s, r) => s + Number(r.atom_count ?? 0), 0);
  const byTier = new Map<XpmsTier, { atoms: number; cost: number }>();
  rows.forEach((r) => byTier.set(r.tier, { atoms: Number(r.atom_count), cost: Number(r.cost_cents ?? 0) }));

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.xpms.tiers.eyebrow", undefined, "XPMS · Six Tiers of Experience")}
        title={t("console.xpms.tiers.title", undefined, "Tier Composition")}
        subtitle={t(
          "console.xpms.tiers.subtitle",
          undefined,
          "Project portfolio composition — what kind of human encounter the work delivers.",
        )}
      />
      <div className="page-content space-y-4">
        <Card>
          <CardHeader
            title={t("console.xpms.tiers.atomShareTitle", undefined, "Atom share by tier")}
            subtitle={t(
              "console.xpms.tiers.atomShareSubtitle",
              { count: totalAtoms, plural: totalAtoms === 1 ? "" : "s" },
              `Across ${totalAtoms} Atom${totalAtoms === 1 ? "" : "s"} carrying a primary tier`,
            )}
          />
          <CardBody>
            <div className="space-y-3">
              {XPMS_TIERS.map((tier) => {
                const stat = byTier.get(tier.id) ?? { atoms: 0, cost: 0 };
                const share = totalAtoms ? stat.atoms / totalAtoms : 0;
                return (
                  <div key={tier.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        <span className="me-2 font-mono text-[10px] text-[var(--text-muted)]">{tier.num}</span>
                        {tier.label}
                      </span>
                      <span className="font-mono text-xs text-[var(--text-muted)]">
                        {t(
                          "console.xpms.tiers.atomsShare",
                          { atoms: stat.atoms, share: (share * 100).toFixed(1) },
                          `${stat.atoms} atoms · ${(share * 100).toFixed(1)}%`,
                        )}
                      </span>
                    </div>
                    <ProgressBar value={Math.round(share * 100)} />
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
