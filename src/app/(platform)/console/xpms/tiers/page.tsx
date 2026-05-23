import { ModuleHeader } from "@/components/Shell";
import { Card, CardBody, CardHeader, ProgressBar } from "@/components/ui";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { XPMS_TIERS, type XpmsTier } from "@/lib/xpms";

export const dynamic = "force-dynamic";

type TierRow = { tier: XpmsTier; atom_count: number; cost_cents: number };

export default async function TierCompositionPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="XPMS" title="Tier Composition" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
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
        eyebrow="XPMS · Six Tiers of Experience"
        title="Tier Composition"
        subtitle="Project portfolio composition — what kind of human encounter the work delivers."
      />
      <div className="page-content space-y-4">
        <Card>
          <CardHeader
            title="Atom share by tier"
            subtitle={`Across ${totalAtoms} Atom${totalAtoms === 1 ? "" : "s"} carrying a primary tier`}
          />
          <CardBody>
            <div className="space-y-3">
              {XPMS_TIERS.map((t) => {
                const stat = byTier.get(t.id) ?? { atoms: 0, cost: 0 };
                const share = totalAtoms ? stat.atoms / totalAtoms : 0;
                return (
                  <div key={t.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        <span className="mr-2 font-mono text-[10px] text-[var(--text-muted)]">{t.num}</span>
                        {t.label}
                      </span>
                      <span className="font-mono text-xs text-[var(--text-muted)]">
                        {stat.atoms} atoms · {(share * 100).toFixed(1)}%
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
