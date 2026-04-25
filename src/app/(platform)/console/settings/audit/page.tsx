import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { AuditLogViewer } from "./AuditLogViewer";
import type { AuditLog } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title="Audit log" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const rows = (await listOrgScoped("audit_log", session.orgId, {
    orderBy: "at",
    ascending: false,
    limit: 500,
  })) as AuditLog[];

  return (
    <>
      <ModuleHeader
        eyebrow="Settings"
        title="Workspace settings"
        subtitle={`Audit log · ${rows.length} events`}
      />
      <div className="page-content max-w-6xl">
        <AuditLogViewer rows={rows} />
      </div>
    </>
  );
}
