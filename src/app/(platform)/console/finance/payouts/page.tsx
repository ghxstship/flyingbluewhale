import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import type { Vendor } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function PayoutsPage() {
  if (!hasSupabase) return <><ModuleHeader title="Payouts" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>;
  const session = await requireSession();
  const vendors = await listOrgScoped("vendors", session.orgId);
  return (
    <>
      <ModuleHeader eyebrow="Finance" title="Payouts" subtitle="Stripe Connect onboarding status per vendor" />
      <div className="page-content">
        <DataTable<Vendor>
          rows={vendors}
          columns={[
            { key: "name", header: "Vendor", render: (r) => r.name },
            { key: "account", header: "Connect account", render: (r) => r.payout_account_id
              ? <span className="font-mono text-xs">{r.payout_account_id}</span>
              : <Badge variant="muted">Not onboarded</Badge> },
            { key: "w9", header: "W-9", render: (r) => r.w9_on_file ? <Badge variant="success">On file</Badge> : <Badge variant="warning">Missing</Badge> },
            { key: "coi", header: "COI expires", render: (r) => r.coi_expires_at ?? "—", className: "font-mono text-xs" },
          ]}
        />
      </div>
    </>
  );
}
