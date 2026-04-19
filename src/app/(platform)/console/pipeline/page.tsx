import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import type { Lead, LeadStage } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const STAGES: { key: LeadStage; label: string }[] = [
  { key: "new", label: "New" },
  { key: "qualified", label: "Qualified" },
  { key: "contacted", label: "Contacted" },
  { key: "proposal", label: "Proposal" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
];

export default async function PipelinePage() {
  if (!hasSupabase) {
    return <><ModuleHeader title="Pipeline" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>;
  }
  const session = await requireSession();
  const leads = await listOrgScoped("leads", session.orgId, { orderBy: "updated_at" });

  const grouped = STAGES.reduce<Record<LeadStage, Lead[]>>((acc, s) => {
    acc[s.key] = []; return acc;
  }, {} as Record<LeadStage, Lead[]>);
  for (const l of leads) grouped[l.stage].push(l);

  return (
    <>
      <ModuleHeader eyebrow="Sales" title="Pipeline" subtitle="Open a lead to advance its stage" />
      <div className="page-content">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {STAGES.map((s) => (
            <div key={s.key} className="surface p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{s.label}</div>
                <div className="font-mono text-xs text-[var(--text-muted)]">{grouped[s.key].length}</div>
              </div>
              <div className="mt-2 space-y-2">
                {grouped[s.key].map((l) => (
                  <Link key={l.id} href={`/console/leads/${l.id}`} className="surface-raised hover-lift block p-3">
                    <div className="text-sm font-medium">{l.name}</div>
                    <div className="mt-1 text-xs text-[var(--text-muted)]">{formatMoney(l.estimated_value_cents)}</div>
                  </Link>
                ))}
                {grouped[s.key].length === 0 && <div className="text-xs text-[var(--text-muted)]">—</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
