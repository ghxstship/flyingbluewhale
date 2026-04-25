import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { ComplianceForm } from "./ComplianceForm";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

const PLATFORM_CONTROLS = [
  { name: "Row-Level Security", status: "enforced", note: "Every table scoped by org_id via Postgres RLS" },
  { name: "Audit log", status: "enabled", note: "All mutations recorded in audit_log" },
  { name: "Encryption in transit", status: "enforced", note: "TLS 1.2+" },
  { name: "Backups", status: "daily", note: "7-day retention, point-in-time on enterprise" },
];

type ComplianceSettings = {
  retention_audit_days?: number;
  retention_logs_days?: number;
  encryption_at_rest?: "on" | "off";
  dpa_signed?: "on" | "off";
  data_residency?: "us" | "eu" | "global";
};

export default async function CompliancePage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Settings" title="Compliance" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data: org } = await supabase
    .from("orgs")
    .select("compliance_settings")
    .eq("id", session.orgId)
    .maybeSingle();
  const settings = (org?.compliance_settings as ComplianceSettings) ?? {};

  return (
    <>
      <ModuleHeader
        eyebrow="Settings"
        title="Workspace settings"
        subtitle="Compliance"
      />
      <div className="page-content max-w-3xl space-y-5">
        <section className="surface p-5">
          <h3 className="text-sm font-semibold">Workspace settings</h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Override defaults for retention, encryption and residency. Most
            controls require an Enterprise plan to relax.
          </p>
          <div className="mt-4">
            <ComplianceForm initial={settings} />
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Platform controls
          </h3>
          <div className="surface overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th>Control</th>
                  <th>Status</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {PLATFORM_CONTROLS.map((c) => (
                  <tr key={c.name}>
                    <td>{c.name}</td>
                    <td><Badge variant="success">{c.status}</Badge></td>
                    <td className="text-[var(--text-secondary)]">{c.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
