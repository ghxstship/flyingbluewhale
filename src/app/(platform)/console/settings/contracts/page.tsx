import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Settings" title="Contract Templates" />
        <div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div>
      </>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();

  const { data: templates } = await supabase
    .from("contract_templates")
    .select("id, name, is_default, deposit_pct, created_at")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("is_default", { ascending: false })
    .order("name");

  const rows = templates ?? [];

  return (
    <>
      <ModuleHeader
        eyebrow="Settings"
        title="Contract Templates"
        actions={<Button href="/console/settings/contracts/new">New Template</Button>}
      />
      <div className="page-content max-w-3xl">
        {rows.length === 0 ? (
          <div className="surface p-8 text-center space-y-3">
            <p className="text-sm text-[var(--text-secondary)]">
              No contract templates yet. Create one to enable one-click contract generation from talent offers.
            </p>
            <Button href="/console/settings/contracts/new">Create your first template</Button>
          </div>
        ) : (
          <div className="surface divide-y divide-[var(--border-color)]">
            {rows.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{t.name}</span>
                    {t.is_default && <Badge tone="info">Default</Badge>}
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">Deposit: {t.deposit_pct}%</p>
                </div>
                <Link href={`/console/settings/contracts/${t.id}`} className="btn btn-ghost text-sm">
                  Edit
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
